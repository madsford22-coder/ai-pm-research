/**
 * Script to improve titles in frontmatter based on the actual content items
 */

const fs = require('fs');
const path = require('path');

const UPDATES_DIR = path.join(__dirname, '..', 'updates', 'daily');

// Extract main topics from Items sections
function generateBetterTitle(content) {
  // Extract all item headings (### level)
  const itemHeadings = [];
  const headingMatches = content.matchAll(/### (.+?)(?:\n|$)/g);

  for (const match of headingMatches) {
    const heading = match[1].trim();
    // Remove author attribution and clean up
    const cleaned = heading
      .replace(/\s*-\s*.+$/, '') // Remove everything after first dash
      .replace(/\(.+?\)/g, '') // Remove parentheses
      .trim();

    if (cleaned && !itemHeadings.includes(cleaned)) {
      itemHeadings.push(cleaned);
    }
  }

  if (itemHeadings.length === 0) {
    return null;
  }

  // Shorten long names
  const shortened = itemHeadings.map(h => {
    // Extract key companies/products
    const companies = ['Lenny Rachitsky', 'LangChain', 'OpenAI', 'Anthropic', 'Google', 'Meta', 'Microsoft', 'Vercel', 'GitHub'];
    for (const company of companies) {
      if (h.includes(company)) {
        // Extract the main topic after the company name
        const parts = h.split(/[-–:]/);
        if (parts.length > 1) {
          return parts[1].trim();
        }
        return h.replace(company, '').trim() || company;
      }
    }
    return h;
  });

  // Create title
  if (shortened.length === 1) {
    return shortened[0];
  } else if (shortened.length === 2) {
    return `${shortened[0]} & ${shortened[1]}`;
  } else {
    return `${shortened[0]}, ${shortened[1]} & More`;
  }
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
    /^(---\s+title:\s*")[^"]+(")/m,
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
