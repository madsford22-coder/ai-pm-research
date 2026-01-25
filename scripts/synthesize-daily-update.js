#!/usr/bin/env node
/**
 * Synthesize Daily Research Update
 *
 * This script:
 * 1. Reads collected research data from /tmp/daily-research-YYYY-MM-DD.txt
 * 2. Reads context files (companies.md, people.md, prefs.md, open-questions.md)
 * 3. Reads research prompt (tooling/prompts/daily-research.md)
 * 4. Calls Claude API to synthesize the daily update
 * 5. Saves output to updates/daily/YYYY/YYYY-MM-DD.md
 */

const path = require('path');
const fs = require('fs');

// Add tooling/node_modules to module path so @anthropic-ai/sdk can be found
// This allows the script to use dependencies installed in tooling/
const toolingNodeModules = path.join(__dirname, '..', 'tooling', 'node_modules');
if (fs.existsSync(toolingNodeModules)) {
  // Add to NODE_PATH so require() can find modules in tooling/node_modules
  if (!process.env.NODE_PATH) {
    process.env.NODE_PATH = toolingNodeModules;
  } else if (!process.env.NODE_PATH.includes(toolingNodeModules)) {
    process.env.NODE_PATH = toolingNodeModules + path.delimiter + process.env.NODE_PATH;
  }
  require('module')._initPaths();
}

const Anthropic = require('@anthropic-ai/sdk');
const { readFileSafe, writeFileSafe, fileExists, ensureDirectoryExists } = require('../src/utils/file');
const { validateNonEmptyString } = require('../src/utils/validation');

// Get today's date
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;

async function main() {
  console.log(`\n${'='.repeat(50)}`);
  console.log('Daily Research Update Synthesis');
  console.log(`Date: ${dateStr}`);
  console.log(`${'='.repeat(50)}\n`);

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  try {
    validateNonEmptyString(apiKey, 'ANTHROPIC_API_KEY');
  } catch (error) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('\nPlease set your API key:');
    console.error('  export ANTHROPIC_API_KEY="your-api-key-here"');
    console.error('\nOr add it to a .env file in the project root:');
    console.error('  ANTHROPIC_API_KEY=your-api-key-here\n');
    process.exit(1);
  }

  // Paths
  const projectRoot = path.join(__dirname, '..');
  const dataFile = `/tmp/daily-research-${dateStr}.txt`;
  const outputDir = path.join(projectRoot, 'updates', 'daily', String(year));
  const outputFile = path.join(outputDir, `${dateStr}.md`);

  // Check if data file exists
  if (!fileExists(dataFile)) {
    console.error(`❌ Error: Data file not found: ${dataFile}`);
    console.error('\nRun the data collection script first:');
    console.error('  ./scripts/run-daily-research-data-collection.sh\n');
    process.exit(1);
  }

  // Check if output file already exists
  if (fileExists(outputFile)) {
    console.log(`⚠️  Warning: Output file already exists: ${outputFile}`);
    console.log('Overwriting existing file...\n');
  }

  // Ensure output directory exists
  ensureDirectoryExists(outputDir);

  console.log('📖 Reading context files...');

  // Read all required files
  const collectedData = readFileSafe(dataFile);
  const researchPrompt = readFileSafe(
    path.join(projectRoot, 'tooling/prompts/daily-research.md')
  );
  const companies = readFileSafe(
    path.join(projectRoot, 'context/companies.md')
  );
  const people = readFileSafe(
    path.join(projectRoot, 'context/people.md')
  );
  const prefs = readFileSafe(
    path.join(projectRoot, 'context/prefs.md')
  );
  const openQuestions = readFileSafe(
    path.join(projectRoot, 'context/open-questions.md')
  );

  // Read previous 14 days of updates for deduplication
  console.log('📖 Reading previous updates for deduplication...');
  const previousUpdates = [];
  for (let i = 1; i <= 14; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - i);
    const pastYear = pastDate.getFullYear();
    const pastMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
    const pastDay = String(pastDate.getDate()).padStart(2, '0');
    const pastDateStr = `${pastYear}-${pastMonth}-${pastDay}`;
    const pastFile = path.join(projectRoot, 'updates', 'daily', String(pastYear), `${pastDateStr}.md`);

    if (fileExists(pastFile)) {
      try {
        const content = readFileSafe(pastFile);
        previousUpdates.push({
          date: pastDateStr,
          content: content
        });
      } catch (error) {
        // Skip files that can't be read
        console.warn(`   Warning: Could not read ${pastFile}: ${error.message}`);
      }
    }
  }

  console.log(`   Found ${previousUpdates.length} previous updates to check for duplicates\n`);

  // Construct the prompt
  const systemPrompt = `${researchPrompt}

# Context Files

## context/companies.md
${companies}

## context/people.md
${people}

## context/prefs.md
${prefs}

## context/open-questions.md
${openQuestions}

# Previous Updates (for deduplication)
${previousUpdates.length > 0 ? previousUpdates.map(u => `## ${u.date}\n${u.content}`).join('\n\n') : 'No previous updates found.'}`;

  const userPrompt = `Today is ${dateStr}.

Generate the daily research update for today based on the collected data below.

Remember:
- Maximum 3-5 items in detailed analysis
- Maximum 5 items in "Other Notable Updates" section
- Check for duplicates in previous 14 days - do NOT include items already covered
- Follow all quality bars and brevity requirements from the research prompt
- Include the Daily Product Reflection Challenge at the end
- Output file should be saved to: updates/daily/${year}/${dateStr}.md

# Collected Research Data

${collectedData}`;

  console.log('🤖 Calling Claude API to synthesize daily update...');
  console.log(`   Using model: claude-sonnet-4-5\n`);

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: systemPrompt,
    });

    // Extract the generated content
    let generatedContent = message.content[0].text;

    // Clean up the content - remove any preamble before the frontmatter
    // The file must start with '---' for valid frontmatter
    const frontmatterIndex = generatedContent.indexOf('---');
    if (frontmatterIndex > 0) {
      console.log('   ⚠️  Removing preamble text before frontmatter...');
      generatedContent = generatedContent.substring(frontmatterIndex);
    } else if (frontmatterIndex === -1) {
      console.error('   ❌ Error: Generated content does not contain frontmatter delimiter "---"');
      console.error('   Generated content preview:', generatedContent.substring(0, 200));
      process.exit(1);
    }

    // Ensure output directory exists and write file
    ensureDirectoryExists(outputDir);
    writeFileSafe(outputFile, generatedContent);

    console.log('✅ Daily update generated successfully!\n');
    console.log(`📄 Output saved to: ${outputFile}`);
    console.log(`📊 Tokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output\n`);
    
    // Automatically regenerate monthly summary for current month
    console.log('📅 Regenerating monthly summary...');
    try {
      const { generateMonthlySummary } = require('./generate-monthly-summary.js');
      const monthNum = parseInt(month);
      await generateMonthlySummary(year, monthNum);
      console.log('✅ Monthly summary updated\n');
    } catch (error) {
      console.warn(`⚠️  Could not update monthly summary: ${error.message}`);
      console.warn('   You can manually regenerate it with:');
      console.warn(`   node scripts/generate-monthly-summary.js ${year} ${month}\n`);
    }
    
    console.log(`${'='.repeat(50)}`);
    console.log('Next Steps:');
    console.log(`${'='.repeat(50)}`);
    console.log('1. Review the generated file:');
    console.log(`   cursor ${outputFile}`);
    console.log('2. If satisfied, commit the changes:');
    console.log(`   git add ${outputFile}`);
    console.log(`   git commit -m "Add daily research update for ${dateStr}"`);
    console.log(`   git push`);
    console.log(`${'='.repeat(50)}\n`);

  } catch (error) {
    console.error('❌ Error calling Claude API:', error.message);
    if (error.status === 401) {
      console.error('\nAuthentication failed. Please check your ANTHROPIC_API_KEY.\n');
    }
    process.exit(1);
  }
}

main().catch(console.error);
