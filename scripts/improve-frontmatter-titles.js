/**
 * Script to improve titles in frontmatter based on the summary content
 */

const fs = require('fs');
const path = require('path');

const UPDATES_DIR = path.join(__dirname, '..', 'updates', 'daily');

// Extract main topics from Summary section
function generateBetterTitle(content) {
  // Extract the summary section
  const summaryMatch = content.match(/## Summary\s*\n\s*\n(.+?)(?:\n\n---|\n\n##|$)/s);

  if (!summaryMatch) {
    return null;
  }

  const summary = summaryMatch[1].trim();

  // Extract key topics and themes from the summary
  // Look for patterns like "shows how X" or "reveals Y patterns" or "guide to Z"
  const topics = [];

  // Extract phrases after common patterns
  const patterns = [
    /(?:shows? how|reveals?|demonstrates?) (.+?)(?:\s+and|\s+for|,|\.|$)/gi,
    /(?:guide to|introduction to) (.+?)(?:\s+and|\s+for|,|\.|$)/gi,
    /(?:patterns? for|approaches? to) (.+?)(?:\s+and|\s+for|,|\.|$)/gi,
    /enable(?:s)? (?:PMs|product managers) to (.+?)(?:\s+and|\s+for|,|\.|$)/gi,
  ];

  patterns.forEach(pattern => {
    const matches = summary.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const topic = match[1].trim()
          .replace(/^(the|a|an)\s+/i, '') // Remove articles
          .replace(/\s+(through|using|with|via).+$/, '') // Remove method descriptions
          .trim();

        if (topic.length > 10 && topic.length < 80 && !topics.includes(topic)) {
          topics.push(topic);
        }
      }
    }
  });

  // If no topics found with patterns, extract key noun phrases
  if (topics.length === 0) {
    // Look for capitalized terms and important phrases
    const sentences = summary.split(/[.:]/);
    for (const sentence of sentences) {
      // Extract phrases with AI, PM, or technical terms
      const keyPhrases = sentence.match(/(?:AI|PM|multi-agent|product|workflow|agent|system|tool)[^,]*/gi);
      if (keyPhrases) {
        keyPhrases.forEach(phrase => {
          const cleaned = phrase.trim().replace(/^(the|a|an)\s+/i, '');
          if (cleaned.length > 10 && cleaned.length < 80 && !topics.includes(cleaned)) {
            topics.push(cleaned);
          }
        });
      }
    }
  }

  // If still no topics, fall back to item headings
  if (topics.length === 0) {
    const headingMatches = content.matchAll(/### (.+?)\s*-\s*(.+?)(?:\n|$)/g);
    for (const match of headingMatches) {
      const topic = match[2].trim();
      if (topic && !topics.includes(topic)) {
        topics.push(topic);
      }
    }
  }

  if (topics.length === 0) {
    return null;
  }

  // Create title from topics - keep it concise and descriptive
  if (topics.length === 1) {
    return capitalizeTitle(topics[0]);
  } else if (topics.length === 2) {
    return `${capitalizeTitle(topics[0])} & ${capitalizeTitle(topics[1])}`;
  } else {
    // Pick the two most descriptive topics
    const sorted = topics.sort((a, b) => b.length - a.length);
    return `${capitalizeTitle(sorted[0])} & ${capitalizeTitle(sorted[1])}`;
  }
}

// Helper to properly capitalize titles
function capitalizeTitle(str) {
  const lowerWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with'];

  return str
    .split(' ')
    .map((word, index) => {
      // Always capitalize first word and words not in lowerWords list
      if (index === 0 || !lowerWords.includes(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
}

function improveFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check if frontmatter exists
  if (!content.startsWith('---')) {
    console.log(`⏭️  Skipping ${path.basename(filePath)} - no frontmatter`);
    return;
  }

  // Generate better title
  const betterTitle = generateBetterTitle(content);

  if (!betterTitle) {
    console.log(`⚠️  Couldn't generate title for ${path.basename(filePath)}`);
    return;
  }

  // Replace the title in frontmatter
  const newContent = content.replace(
    /^(---\s+title:\s*")[^"]+(\")/m,
    `$1${betterTitle}$2`
  );

  // Write back
  fs.writeFileSync(filePath, newContent, 'utf-8');

  const filename = path.basename(filePath, '.md');
  console.log(`✅ Updated ${filename}`);
  console.log(`   New title: "${betterTitle}"`);
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      improveFrontmatter(fullPath);
    }
  }
}

console.log('🚀 Improving frontmatter titles...\n');
processDirectory(UPDATES_DIR);
console.log('\n✨ Done!');
