#!/usr/bin/env node
/**
 * Generate Monthly Summary
 * 
 * This script aggregates all daily updates for a given month and creates
 * a monthly summary with:
 * - Monthly overview
 * - Key themes and patterns
 * - Daily updates list with tl;drs and links
 * - Resource links from all updates
 */

const path = require('path');
const { readFileSafe, writeFileSafe, fileExists, ensureDirectoryExists } = require('../src/utils/file');
const { parseFrontmatter, formatFrontmatter } = require('../src/utils/frontmatter');
const { validatePositiveInteger, validateNonEmptyString } = require('../src/utils/validation');

function extractResources(content) {
  const resources = new Set();
  
  // Extract all source links (markdown format: **Source:** http://...)
  const sourceRegex = /\*\*Source:\*\*\s*(https?:\/\/[^\s\n]+)/gi;
  let match;
  while ((match = sourceRegex.exec(content)) !== null) {
    resources.add(match[1]);
  }
  
  // Extract links from "Other Notable Updates" section
  const otherUpdatesRegex = /## Other Notable Updates[\s\S]*?((?:https?:\/\/[^\s\n)]+))/gi;
  while ((match = otherUpdatesRegex.exec(content)) !== null) {
    resources.add(match[1]);
  }
  
  return Array.from(resources);
}

function extractItems(content) {
  const items = [];
  
  // Match item blocks (### Title ... until next ### or ##)
  const itemRegex = /###\s+([^\n]+)\n([\s\S]*?)(?=\n###|\n##|$)/g;
  let match;
  
  while ((match = itemRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const itemContent = match[2];
    
    // Extract tl;dr
    const tldrMatch = itemContent.match(/\*\*tl;dr:\*\*\s*(.+?)(?=\n\*\*|$)/s);
    const tldr = tldrMatch ? tldrMatch[1].trim() : null;
    
    // Extract source
    const sourceMatch = itemContent.match(/\*\*Source:\*\*\s*(https?:\/\/[^\s\n]+)/);
    const source = sourceMatch ? sourceMatch[1] : null;
    
    // Extract author if present
    const authorMatch = itemContent.match(/\*\*Author:\*\*\s*([^\n]+)/);
    const author = authorMatch ? authorMatch[1].trim() : null;
    
    if (title && (tldr || source)) {
      items.push({
        title,
        tldr,
        source,
        author,
      });
    }
  }
  
  return items;
}

function extractSummary(content) {
  // Extract the main summary from ## Summary section
  const summaryMatch = content.match(/## Summary\s*\n\n([^\n]+(?:\n[^#][^\n]+)*)/);
  return summaryMatch ? summaryMatch[1].trim() : null;
}

function generateMonthlySummary(year, month) {
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
  const dailySummaries = [];
  const allItems = [];
  const themes = new Map();
  
  for (const file of dailyFiles) {
    const content = readFileSafe(file.path);
    const parsed = parseFrontmatter(content);
    
    const dateStr = file.date.toISOString().split('T')[0];
    const dayOfMonth = file.date.getDate();
    
    // Extract resources
    const resources = extractResources(parsed.content);
    resources.forEach(r => allResources.add(r));
    
    // Extract summary
    const summary = extractSummary(parsed.content);
    
    // Extract items
    const items = extractItems(parsed.content);
    allItems.push(...items.map(item => ({ ...item, date: dateStr })));
    
    // Extract patterns/themes
    const patternMatches = parsed.content.matchAll(/\*\*Pattern to note:\*\*\s*([^\n]+)/g);
    for (const match of patternMatches) {
      const pattern = match[1].trim();
      themes.set(pattern, (themes.get(pattern) || 0) + 1);
    }
    
    dailySummaries.push({
      date: dateStr,
      day: dayOfMonth,
      title: parsed.data.title || `Daily Update - ${dateStr}`,
      summary,
      itemCount: items.length,
      url: `/updates/daily/${year}/${dateStr.replace(/-/g, '/')}`,
    });
  }
  
  // Sort themes by frequency and get top 3 most important
  const topThemes = Array.from(themes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme, count]) => theme);
  
  // Get top 3 most important resources (prioritize unique domains and most referenced)
  const resourceCounts = new Map();
  for (const resource of allResources) {
    try {
      const url = new URL(resource);
      const domain = url.hostname.replace('www.', '');
      resourceCounts.set(domain, (resourceCounts.get(domain) || 0) + 1);
    } catch {
      // Skip invalid URLs
    }
  }
  
  // Get top 3 most important items with their resources
  const topItems = allItems
    .filter(item => item.tldr && item.source)
    .slice(0, 3)
    .map((item, idx) => {
      try {
        const url = new URL(item.source);
        const domain = url.hostname.replace('www.', '');
        const title = item.title.replace(/\s*-\s*[^]+$/, '').trim();
        return {
          title,
          source: item.source,
          domain,
          tldr: item.tldr
        };
      } catch {
        return null;
      }
    })
    .filter(item => item !== null);
  
  // Generate executive summary
  const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthTitle = monthName;
  
  // Create concise executive summary (one page, chief of staff style)
  let executiveSummary = '';
  if (topThemes.length > 0) {
    // Create one flowing sentence from themes
    const themesLower = topThemes.map(theme => theme.charAt(0).toLowerCase() + theme.slice(1));
    if (themesLower.length === 1) {
      executiveSummary = themesLower[0] + '.';
    } else if (themesLower.length === 2) {
      executiveSummary = themesLower[0] + ', and ' + themesLower[1] + '.';
    } else {
      executiveSummary = themesLower.slice(0, -1).join(', ') + ', and ' + themesLower[themesLower.length - 1] + '.';
    }
  } else {
    executiveSummary = `This month tracked ${allItems.length} key items across AI product management, tools, and workflows.`;
  }
  
  let markdown = `---
title: "${monthTitle} Research Summary"
date: ${monthKey}-01
tags:
  - monthly-summary
  - ai-pm-research
---

# ${monthTitle} Research Summary

${(executiveSummary.charAt(0).toUpperCase() + executiveSummary.slice(1)).replace(/\baI\b/gi, 'AI').replace(/\bai\b/g, 'AI')}

## What Matters

${topThemes.length > 0 ? topThemes.map(theme => {
  const capitalized = theme.charAt(0).toUpperCase() + theme.slice(1);
  return `- ${capitalized.replace(/\baI\b/gi, 'AI').replace(/\bai\b/g, 'AI')}`;
}).join('\n') : `- ${dailyFiles.length} daily updates tracked ${allItems.length} key items this month`}

${topItems.length > 0 ? `\n## Essential Resources (${topItems.length})\n\n${topItems.map((item, idx) => {
  return `${idx + 1}. **${item.title}** — [${item.domain}](${item.source})`;
}).join('\n')}\n` : ''}

---

*${dailyFiles.length} daily updates tracked ${allItems.length} items this month. [View all updates](/updates/daily/${year}/)*
`;
  
  // Write output file
  writeFileSafe(outputFile, markdown);
  console.log(`✅ Generated monthly summary: ${outputFile}`);
  
  return {
    file: outputFile,
    dailyCount: dailyFiles.length,
    itemCount: allItems.length,
    resourceCount: allResources.size,
  };
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Generate for all months that have updates
    const updatesDir = path.join(__dirname, '..', 'updates', 'daily');
    const fs = require('fs'); // Still need for readdirSync and statSync
    
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
            generateMonthlySummary(parseInt(match[1]), month);
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
      
      generateMonthlySummary(year, month);
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

main();
