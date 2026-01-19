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

const fs = require('fs');
const path = require('path');

// Simple frontmatter parser
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content: content };
  }
  
  const yamlContent = match[1];
  const markdownContent = match[2];
  const data = {};
  
  // Simple YAML parser
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (key && value) {
        if (key === 'tags' && value.startsWith('[')) {
          // Parse array
          data[key] = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
        } else {
          data[key] = value;
        }
      }
    }
  }
  
  return { data, content: markdownContent };
}

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
  const updatesDir = path.join(__dirname, '..', 'updates', 'daily', String(year));
  const monthlyDir = path.join(__dirname, '..', 'updates', 'monthly');
  
  // Ensure monthly directory exists
  if (!fs.existsSync(monthlyDir)) {
    fs.mkdirSync(monthlyDir, { recursive: true });
  }
  
  const monthStr = String(month).padStart(2, '0');
  const monthKey = `${year}-${monthStr}`;
  const outputFile = path.join(monthlyDir, `${monthKey}.md`);
  
  // Find all daily updates for this month
  const dailyFiles = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  
  if (!fs.existsSync(updatesDir)) {
    console.error(`Updates directory not found: ${updatesDir}`);
    return;
  }
  
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
    const content = fs.readFileSync(file.path, 'utf-8');
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
  
  // Sort themes by frequency
  const topThemes = Array.from(themes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => theme);
  
  // Generate monthly summary markdown
  const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthTitle = monthName;
  
  // Format date nicely
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  let markdown = `---
title: "${monthTitle} Research Summary"
date: ${monthKey}-01
tags:
  - monthly-summary
  - ai-pm-research
---

# ${monthTitle} Research Summary

## Overview

This month saw **${dailyFiles.length} daily research updates** covering **${allItems.length} key items** across AI product management, tools, and workflows.

## Key Themes

${topThemes.length > 0 ? topThemes.map(theme => `- ${theme}`).join('\n') : '- Various AI product management insights and patterns'}

## Daily Updates

${dailySummaries.map(day => {
    const displayDate = formatDate(day.date);
    // URL format: /updates/daily/2026/2026-01-19
    const urlPath = day.date;
    return `### [${day.title}](/updates/daily/${year}/${urlPath})

**${displayDate}** · ${day.itemCount} item${day.itemCount !== 1 ? 's' : ''}

${day.summary ? `${day.summary}\n\n` : ''}→ [Read full update](/updates/daily/${year}/${urlPath})`;
  }).join('\n\n---\n\n')}

## Resources & Links

${Array.from(allResources).sort().map(resource => {
    try {
      const url = new URL(resource);
      return `- [${url.hostname.replace('www.', '')}](${resource})`;
    } catch {
      return `- ${resource}`;
    }
  }).join('\n')}

## Statistics

- **Total daily updates:** ${dailyFiles.length}
- **Total items covered:** ${allItems.length}
- **Unique resources:** ${allResources.size}
- **Key themes identified:** ${topThemes.length}
`;
  
  // Write output file
  fs.writeFileSync(outputFile, markdown, 'utf-8');
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
    
    if (!fs.existsSync(updatesDir)) {
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
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      console.error('Invalid year or month');
      process.exit(1);
    }
    
    generateMonthlySummary(year, month);
  } else {
    console.error('Usage: node generate-monthly-summary.js [year month]');
    console.error('  With no arguments: generates summaries for all months with updates');
    console.error('  With year month: generates summary for specific month (e.g., 2025 12)');
    process.exit(1);
  }
}

main();
