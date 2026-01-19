/**
 * Script to add YAML frontmatter to daily update markdown files
 * Extracts date from filename and generates a descriptive title from the summary
 */

const path = require('path');
const fs = require('fs'); // Still need for readdirSync and isDirectory
const { readFileSafe, writeFileSafe, fileExists } = require('../src/utils/file');
const { formatFrontmatter } = require('../src/utils/frontmatter');
const { validateDateString } = require('../src/utils/validation');

const UPDATES_DIR = path.join(__dirname, '..', 'updates', 'daily');

// Extract first sentence or key topics from summary
function generateTitleFromSummary(content) {
  // Find the summary section
  const summaryMatch = content.match(/## Summary\s+([\s\S]+?)(?=\n##|\n---|\n\n##)/);

  if (!summaryMatch) {
    return null;
  }

  const summary = summaryMatch[1].trim();

  // Try to extract key topics (look for patterns like "X and Y" or "X shows Y")
  // Take first sentence if it's under 100 chars
  const firstSentence = summary.split(/[.!?]\s/)[0];

  if (firstSentence && firstSentence.length < 100) {
    return firstSentence;
  }

  // Otherwise, try to extract main subjects
  const topics = [];
  const topicPatterns = [
    /(\w+(?:'s)?)\s+(?:guide|case study|announcement|release|update)/gi,
    /(\w+)\s+(?:shows|reveals|demonstrates|announces)/gi,
  ];

  for (const pattern of topicPatterns) {
    const matches = summary.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !topics.includes(match[1])) {
        topics.push(match[1]);
      }
    }
  }

  if (topics.length > 0) {
    if (topics.length === 1) {
      return `${topics[0]} Update`;
    } else if (topics.length === 2) {
      return `${topics[0]} and ${topics[1]}`;
    } else {
      return `${topics.slice(0, 2).join(', ')} and More`;
    }
  }

  // Fallback: use first 60 chars of summary
  return summary.substring(0, 60).trim() + '...';
}

function addFrontmatter(filePath) {
  try {
    const content = readFileSafe(filePath);

    // Check if frontmatter already exists
    if (content.startsWith('---')) {
      console.log(`⏭️  Skipping ${path.basename(filePath)} - already has frontmatter`);
      return;
    }

    // Extract date from filename (YYYY-MM-DD.md)
    const filename = path.basename(filePath, '.md');
    const dateMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})/);

    if (!dateMatch) {
      console.log(`⚠️  Skipping ${filename} - couldn't extract date`);
      return;
    }

    const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

    // Validate date
    try {
      validateDateString(date, 'date', true);
    } catch (error) {
      console.log(`⚠️  Skipping ${filename} - invalid date: ${error.message}`);
      return;
    }

    // Generate title from summary
    const generatedTitle = generateTitleFromSummary(content);
    const title = generatedTitle || `Daily Update - ${date}`;

    // Create frontmatter data
    const frontmatterData = {
      title: title,
      date: date,
      tags: ['daily-update', 'ai-pm-research'],
    };

    // Format with frontmatter
    const newContent = formatFrontmatter(frontmatterData, content);

    // Write file with frontmatter
    writeFileSafe(filePath, newContent);

    console.log(`✅ Added frontmatter to ${filename}`);
    console.log(`   Title: "${title}"`);
    console.log(`   Date: ${date}`);
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(filePath)}: ${error.message}`);
  }
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      addFrontmatter(fullPath);
    }
  }
}

console.log('🚀 Adding frontmatter to daily update files...\n');
processDirectory(UPDATES_DIR);
console.log('\n✨ Done!');
