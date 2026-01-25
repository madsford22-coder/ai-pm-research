#!/usr/bin/env node
/**
 * Generate Monthly Summary
 * 
 * This script aggregates all daily updates for a given month and creates
 * a monthly summary following the format in .prompts/monthly-summary.md:
 * - Opening paragraphs (2-3 sentences main theme, 1-2 sentences secondary)
 * - What Matters section (3 bullets with bold headers)
 * - Essential Resources (3 items with descriptions)
 * 
 * Uses AI to synthesize themes and generate human-readable summary.
 */

const path = require('path');
const fs = require('fs');
const { readFileSafe, writeFileSafe, fileExists, ensureDirectoryExists } = require('../src/utils/file');
const { parseFrontmatter } = require('../src/utils/frontmatter');
const { validatePositiveInteger, validateNonEmptyString } = require('../src/utils/validation');

// Add tooling/node_modules to module path for @anthropic-ai/sdk
const toolingNodeModules = path.join(__dirname, '..', 'tooling', 'node_modules');
if (fs.existsSync(toolingNodeModules)) {
  if (!process.env.NODE_PATH) {
    process.env.NODE_PATH = toolingNodeModules;
  } else if (!process.env.NODE_PATH.includes(toolingNodeModules)) {
    process.env.NODE_PATH = toolingNodeModules + path.delimiter + process.env.NODE_PATH;
  }
  require('module')._initPaths();
}

const Anthropic = require('@anthropic-ai/sdk');

function extractResources(content) {
  const resources = new Set();
  
  // Extract all source links from Items section (markdown format: **Source:** http://...)
  const sourceRegex = /\*\*Source:\*\*\s*(https?:\/\/[^\s\n]+)/gi;
  let match;
  while ((match = sourceRegex.exec(content)) !== null) {
    resources.add(match[1]);
  }
  
  // Extract links from "Quick Hits" section (new format)
  const quickHitsRegex = /## Quick Hits[\s\S]*?((?:https?:\/\/[^\s\n)]+))/gi;
  while ((match = quickHitsRegex.exec(content)) !== null) {
    resources.add(match[1]);
  }
  
  return Array.from(resources);
}

function extractItems(content) {
  const items = [];
  
  // Match item blocks in ## Items section (### Title ... until next ### or ##)
  // Only extract from Items section, not Quick Hits
  const itemsSectionMatch = content.match(/## Items\s*\n([\s\S]*?)(?=\n##|$)/);
  if (!itemsSectionMatch) return items;
  
  const itemsContent = itemsSectionMatch[1];
  const itemRegex = /###\s+([^\n]+)\n([\s\S]*?)(?=\n###|\n##|$)/g;
  let match;
  
  while ((match = itemRegex.exec(itemsContent)) !== null) {
    const title = match[1].trim();
    const itemContent = match[2];
    
    // Extract source
    const sourceMatch = itemContent.match(/\*\*Source:\*\*\s*(https?:\/\/[^\s\n]+)/);
    const source = sourceMatch ? sourceMatch[1] : null;
    
    // Extract credibility
    const credibilityMatch = itemContent.match(/\*\*Credibility:\*\*\s*([^\n]+)/);
    const credibility = credibilityMatch ? credibilityMatch[1].trim() : null;
    
    // Extract "What happened" (2-4 sentences)
    const whatHappenedMatch = itemContent.match(/\*\*What happened:\*\*\s*([\s\S]+?)(?=\n\*\*|$)/);
    const whatHappened = whatHappenedMatch ? whatHappenedMatch[1].trim() : null;
    
    // Extract "Why it matters for PMs" (2-3 sentences)
    const whyItMattersMatch = itemContent.match(/\*\*Why it matters for PMs:\*\*\s*([\s\S]+?)(?=\n\*\*|$)/);
    const whyItMatters = whyItMattersMatch ? whyItMattersMatch[1].trim() : null;
    
    // Extract company/author name from title (format: "Company - Title" or "Author - Title")
    const titleParts = title.split(' - ');
    const companyOrAuthor = titleParts.length > 1 ? titleParts[0].trim() : null;
    const itemTitle = titleParts.length > 1 ? titleParts.slice(1).join(' - ') : title;
    
    if (title && source) {
      items.push({
        title: itemTitle,
        companyOrAuthor,
        source,
        credibility,
        whatHappened,
        whyItMatters,
        fullContent: itemContent, // Keep full content for AI synthesis
      });
    }
  }
  
  return items;
}

function extractOneLineSummary(content) {
  // Extract the one-line summary from ## One-Line Summary section
  const summaryMatch = content.match(/## One-Line Summary\s*\n\s*\n([^\n]+(?:\n[^#][^\n]+)*)/);
  return summaryMatch ? summaryMatch[1].trim() : null;
}

function extractWeeklyPattern(content) {
  // Extract "This Week's Pattern" section
  const patternMatch = content.match(/## This Week's Pattern\s*\n\s*\n\*\*([^\n]+)\*\*\s*\n\s*\n([\s\S]+?)(?=\n---|\n##|$)/);
  if (patternMatch) {
    return {
      title: patternMatch[1].trim(),
      description: patternMatch[2].trim(),
    };
  }
  return null;
}

async function generateMonthlySummary(year, month) {
  // Validate inputs
  validatePositiveInteger(year, 'year', 2020);
  validatePositiveInteger(month, 'month', 1);
  if (month > 12) {
    throw new Error('month must be between 1 and 12');
  }
  
  const updatesDir = path.join(__dirname, '..', 'updates', 'daily', String(year));
  const monthlyDir = path.join(__dirname, '..', 'updates', 'monthly');
  
  // Ensure monthly directory exists
  ensureDirectoryExists(monthlyDir);
  
  const monthStr = String(month).padStart(2, '0');
  const monthKey = `${year}-${monthStr}`;
  const outputFile = path.join(monthlyDir, `${monthKey}.md`);
  
  // Find all daily updates for this month
  const dailyFiles = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  
  if (!fileExists(updatesDir)) {
    console.error(`Updates directory not found: ${updatesDir}`);
    return;
  }
  
  const fs = require('fs'); // Still need for readdirSync
  const files = fs.readdirSync(updatesDir);
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const dateMatch = file.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) continue;
    
    const fileYear = parseInt(dateMatch[1]);
    const fileMonth = parseInt(dateMatch[2]);
    const fileDay = parseInt(dateMatch[3]);
    
    if (fileYear === year && fileMonth === month) {
      const fileDate = new Date(fileYear, fileMonth - 1, fileDay);
      if (fileDate >= monthStart && fileDate <= monthEnd) {
        dailyFiles.push({
          date: fileDate,
          path: path.join(updatesDir, file),
          filename: file,
        });
      }
    }
  }
  
  // Sort by date (newest first)
  dailyFiles.sort((a, b) => b.date - a.date);
  
  if (dailyFiles.length === 0) {
    console.log(`No daily updates found for ${year}-${monthStr}`);
    return;
  }
  
  console.log(`Found ${dailyFiles.length} daily updates for ${year}-${monthStr}`);
  
  // Process all daily updates
  const allResources = new Set();
  const allItems = [];
  const weeklyPatterns = [];
  const oneLineSummaries = [];
  
  for (const file of dailyFiles) {
    const content = readFileSafe(file.path);
    const parsed = parseFrontmatter(content);
    
    const dateStr = file.date.toISOString().split('T')[0];
    
    // Extract resources
    const resources = extractResources(parsed.content);
    resources.forEach(r => allResources.add(r));
    
    // Extract one-line summary
    const oneLineSummary = extractOneLineSummary(parsed.content);
    if (oneLineSummary) {
      oneLineSummaries.push({ date: dateStr, summary: oneLineSummary });
    }
    
    // Extract items
    const items = extractItems(parsed.content);
    allItems.push(...items.map(item => ({ ...item, date: dateStr })));
    
    // Extract weekly patterns
    const weeklyPattern = extractWeeklyPattern(parsed.content);
    if (weeklyPattern) {
      weeklyPatterns.push({ date: dateStr, ...weeklyPattern });
    }
  }
  
  // Prepare data for AI synthesis
  const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthTitle = monthName;
  
  // Get top 3 most valuable resources (prioritize diversity and impact)
  // Group by domain to ensure diversity
  const resourcesByDomain = new Map();
  for (const item of allItems) {
    if (!item.source) continue;
    try {
      const url = new URL(item.source);
      const domain = url.hostname.replace('www.', '');
      if (!resourcesByDomain.has(domain)) {
        resourcesByDomain.set(domain, []);
      }
      resourcesByDomain.get(domain).push(item);
    } catch {
      // Skip invalid URLs
    }
  }
  
  // Select top 3 resources, one per domain when possible
  const topResources = [];
  const usedDomains = new Set();
  for (const item of allItems) {
    if (topResources.length >= 3) break;
    if (!item.source || !item.companyOrAuthor || !item.title) continue;
    try {
      const url = new URL(item.source);
      const domain = url.hostname.replace('www.', '');
      // Prefer diverse domains, but allow duplicates if needed
      if (!usedDomains.has(domain) || topResources.length < 2) {
        usedDomains.add(domain);
        topResources.push({
          source: item.companyOrAuthor,
          title: item.title,
          url: item.source,
          description: item.whyItMatters || item.whatHappened || '',
        });
      }
    } catch {
      // Skip invalid URLs
    }
  }
  
  // Use AI to generate summary following monthly prompt format
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  ANTHROPIC_API_KEY not set. Generating basic summary without AI synthesis.');
    return generateBasicSummary(year, month, monthKey, monthTitle, dailyFiles, allItems, topResources, monthEnd);
  }
  
  return generateAISummary(year, month, monthKey, monthTitle, dailyFiles, allItems, oneLineSummaries, weeklyPatterns, topResources, monthEnd, apiKey);
}

async function generateAISummary(year, month, monthKey, monthTitle, dailyFiles, allItems, oneLineSummaries, weeklyPatterns, topResources, monthEnd, apiKey) {
  const monthlyPromptPath = path.join(__dirname, '..', '.prompts', 'monthly-summary.md');
  const monthlyPrompt = readFileSafe(monthlyPromptPath);
  
  // Prepare context for AI
  const itemsContext = allItems.map(item => {
    return `### ${item.companyOrAuthor || 'Unknown'} - ${item.title}
**Source:** ${item.source}
**What happened:** ${item.whatHappened || 'N/A'}
**Why it matters:** ${item.whyItMatters || 'N/A'}
**Date:** ${item.date}`;
  }).join('\n\n');
  
  const summariesContext = oneLineSummaries.map(s => `- ${s.date}: ${s.summary}`).join('\n');
  const patternsContext = weeklyPatterns.map(p => `- ${p.date}: **${p.title}** - ${p.description}`).join('\n');
  
  const userPrompt = `Generate a monthly summary for ${monthTitle} following the format in the prompt.

# Daily Updates Context

## One-Line Summaries
${summariesContext}

## Weekly Patterns
${patternsContext}

## All Items (${allItems.length} total)
${itemsContext}

## Top Resources to Include
${topResources.map((r, i) => `${i + 1}. ${r.source} - ${r.title} (${r.url})`).join('\n')}

Generate the summary following the exact format in the prompt:
- Opening paragraphs (2-3 sentences main theme, 1-2 sentences secondary)
- What Matters section (3 bullets with bold headers and specific examples)
- Essential Resources (3 items with format: **Source** — [Title](URL) — One-line summary)

Use specific examples, company names, and numbers. Write like a human, not corporate jargon.`;

  const anthropic = new Anthropic({ apiKey });
  
  try {
    console.log('🤖 Generating monthly summary with AI...');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
      system: monthlyPrompt,
    });
    
    let generatedContent = message.content[0].text;
    
    // Ensure frontmatter is first
    const frontmatterIndex = generatedContent.indexOf('---');
    if (frontmatterIndex > 0) {
      generatedContent = generatedContent.substring(frontmatterIndex);
    } else if (frontmatterIndex === -1) {
      // Add frontmatter if missing
      generatedContent = `---
title: "${monthTitle} Research Summary"
date: ${monthKey}-01
tags:
  - monthly-summary
  - ai-pm-research
---

${generatedContent}`;
    }
    
    // Add footer with update count
    const lastDay = monthEnd.getDate();
    const footer = `\n---\n\n*${dailyFiles.length} daily updates tracked ${allItems.length} items this month. [View all ${monthTitle.split(' ')[0]} updates](/?from=${monthKey}-01&to=${monthKey}-${String(lastDay).padStart(2, '0')})*`;
    
    // Only add footer if not already present
    if (!generatedContent.includes('*[')) {
      generatedContent += footer;
    }
    
    const outputFile = path.join(path.join(__dirname, '..', 'updates', 'monthly'), `${monthKey}.md`);
    writeFileSafe(outputFile, generatedContent);
    
    console.log(`✅ Generated monthly summary: ${outputFile}`);
    console.log(`📊 Tokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output\n`);
    
    return {
      file: outputFile,
      dailyCount: dailyFiles.length,
      itemCount: allItems.length,
      resourceCount: topResources.length,
    };
  } catch (error) {
    console.error('❌ Error generating AI summary:', error.message);
    console.log('Falling back to basic summary...\n');
    return generateBasicSummary(year, month, monthKey, monthTitle, dailyFiles, allItems, topResources, monthEnd);
  }
}

function generateBasicSummary(year, month, monthKey, monthTitle, dailyFiles, allItems, topResources, monthEnd) {
  const outputFile = path.join(path.join(__dirname, '..', 'updates', 'monthly'), `${monthKey}.md`);
  const lastDay = monthEnd.getDate();
  
  let markdown = `---
title: "${monthTitle} Research Summary"
date: ${monthKey}-01
tags:
  - monthly-summary
  - ai-pm-research
---

# ${monthTitle} Research Summary

This month tracked ${allItems.length} key items across AI product management, tools, and workflows.

## What Matters

- ${dailyFiles.length} daily updates tracked ${allItems.length} key items this month
- Focus areas included product changes, PM craft insights, and AI tool adoption
- Patterns emerged around agent infrastructure, PM productivity, and production deployments

${topResources.length > 0 ? `\n## Essential Resources (${topResources.length})\n\n${topResources.map((item, idx) => {
  const domain = new URL(item.url).hostname.replace('www.', '');
  return `${idx + 1}. **${item.source}** — [${item.title}](${item.url}) — ${item.description.substring(0, 100)}...`;
}).join('\n')}\n` : ''}

---

*${dailyFiles.length} daily updates tracked ${allItems.length} items this month. [View all ${monthTitle.split(' ')[0]} updates](/?from=${monthKey}-01&to=${monthKey}-${String(lastDay).padStart(2, '0')})*
`;
  
  writeFileSafe(outputFile, markdown);
  console.log(`✅ Generated basic monthly summary: ${outputFile}`);
  
  return {
    file: outputFile,
    dailyCount: dailyFiles.length,
    itemCount: allItems.length,
    resourceCount: topResources.length,
  };
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Generate for all months that have updates
    const updatesDir = path.join(__dirname, '..', 'updates', 'daily');
    
    if (!fileExists(updatesDir)) {
      console.error('Updates directory not found');
      process.exit(1);
    }
    
    const years = fs.readdirSync(updatesDir).filter(item => {
      const fullPath = path.join(updatesDir, item);
      return fs.statSync(fullPath).isDirectory();
    });
    
    const monthsProcessed = new Set();
    
    for (const year of years) {
      const yearDir = path.join(updatesDir, year);
      const files = fs.readdirSync(yearDir);
      
      for (const file of files) {
        const match = file.match(/(\d{4})-(\d{2})-(\d{2})\.md/);
        if (match) {
          const month = parseInt(match[2]);
          const monthKey = `${match[1]}-${match[2]}`;
          
          if (!monthsProcessed.has(monthKey)) {
            monthsProcessed.add(monthKey);
            await generateMonthlySummary(parseInt(match[1]), month);
          }
        }
      }
    }
  } else if (args.length === 2) {
    // Generate for specific month: node script.js 2025 12
    const year = parseInt(args[0]);
    const month = parseInt(args[1]);
    
    try {
      validatePositiveInteger(year, 'year', 2020);
      validatePositiveInteger(month, 'month', 1);
      if (month > 12) {
        throw new Error('month must be between 1 and 12');
      }
      
      await generateMonthlySummary(year, month);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.error('Usage: node generate-monthly-summary.js [year month]');
    console.error('  With no arguments: generates summaries for all months with updates');
    console.error('  With year month: generates summary for specific month (e.g., 2025 12)');
    process.exit(1);
  }
}

// Export for use in other scripts
if (require.main === module) {
  main().catch(console.error);
} else {
  module.exports = { generateMonthlySummary };
}
