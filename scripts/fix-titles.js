#!/usr/bin/env node
/**
 * Fix Titles in Daily Updates
 * 
 * This script:
 * 1. Fixes "Ai" to "AI" in titles
 * 2. Fixes "Pms" to "PMs" in titles
 * 3. Shortens overly long titles naturally
 */

const fs = require('fs');
const path = require('path');

// Simple regex-based title replacement
function replaceTitle(content, newTitle) {
  // Match title: "..." or title: '...'
  const titleRegex = /^(title:\s*["'])([^"']+)(["'])$/m;
  const match = content.match(titleRegex);
  
  if (match) {
    return content.replace(titleRegex, `$1${newTitle}$3`);
  }
  
  return content;
}

function fixTitle(title) {
  if (!title) return title;
  
  // First, fix capitalization issues
  let fixed = title;
  
  // Fix "Ai" to "AI" (case-insensitive, but preserve word boundaries)
  fixed = fixed.replace(/\bAi\b/gi, 'AI');
  // Fix "ai " or " ai" or " ai " (standalone lowercase ai)
  fixed = fixed.replace(/\bai\b/gi, 'AI');
  // Fix "Pms" to "PMs"
  fixed = fixed.replace(/\bPms\b/g, 'PMs');
  // Fix standalone "pm" when it means Product Manager
  fixed = fixed.replace(/\bpm\b/g, 'PM');
  
  // Now shorten overly long titles (target: ~60-80 characters for readability)
  // If title is too long, try to make it more concise
  if (fixed.length > 100) {
    // Remove redundant words/phrases
    fixed = fixed
      .replace(/\s+&\s+/g, ' & ') // Normalize ampersands
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // If still too long, try to shorten common patterns
    if (fixed.length > 100) {
      // Try to simplify verbose constructions
      fixed = fixed
        .replace(/Addresses the Organizational Challenge of /gi, '')
        .replace(/Dealing with /gi, '')
        .replace(/Provides Concrete /gi, '')
        .replace(/Reveals /gi, '')
        .replace(/Shows /gi, '')
        .replace(/How to /gi, '')
        .replace(/Practical /gi, '')
        .replace(/Concrete /gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // If STILL too long, try a more aggressive approach
      if (fixed.length > 100) {
        // Split by common delimiters and keep the most important part
        const parts = fixed.split(/\s*[-&]\s*/);
        if (parts.length > 1) {
          // Keep the first meaningful part (usually the main topic)
          fixed = parts[0].trim();
        } else {
          // If no clear delimiter, truncate at word boundary
          const words = fixed.split(' ');
          if (words.length > 12) {
            fixed = words.slice(0, 12).join(' ') + '...';
          }
        }
      }
    }
  }
  
  return fixed.trim();
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract current title
    const titleMatch = content.match(/^title:\s*["']([^"']+)["']$/m);
    if (!titleMatch) {
      return false; // No title to fix
    }
    
    const originalTitle = titleMatch[1];
    const fixedTitle = fixTitle(originalTitle);
    
    if (originalTitle === fixedTitle) {
      return false; // No changes needed
    }
    
    // Replace title in content
    const newContent = replaceTitle(content, fixedTitle);
    
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✓ Fixed: ${path.basename(filePath)}`);
    console.log(`  Before: ${originalTitle}`);
    console.log(`  After:  ${fixedTitle}\n`);
    
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

function main() {
  const updatesDir = path.join(__dirname, '..', 'updates', 'daily');
  
  if (!fs.existsSync(updatesDir)) {
    console.error(`Error: Updates directory not found: ${updatesDir}`);
    process.exit(1);
  }
  
  console.log('Fixing titles in daily updates...\n');
  
  let fixedCount = 0;
  let totalCount = 0;
  
  // Walk through all year directories
  const yearDirs = fs.readdirSync(updatesDir).filter(item => {
    const fullPath = path.join(updatesDir, item);
    return fs.statSync(fullPath).isDirectory();
  });
  
  for (const yearDir of yearDirs) {
    const yearPath = path.join(updatesDir, yearDir);
    const files = fs.readdirSync(yearPath).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      totalCount++;
      const filePath = path.join(yearPath, file);
      if (processFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  console.log(`${'='.repeat(50)}`);
  console.log(`Fixed ${fixedCount} of ${totalCount} files`);
  console.log(`${'='.repeat(50)}\n`);
}

main();
