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

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

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
  if (!apiKey) {
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
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ Error: Data file not found: ${dataFile}`);
    console.error('\nRun the data collection script first:');
    console.error('  ./scripts/run-daily-research-data-collection.sh\n');
    process.exit(1);
  }

  // Check if output file already exists
  if (fs.existsSync(outputFile)) {
    console.log(`⚠️  Warning: Output file already exists: ${outputFile}`);
    console.log('Overwriting existing file...\n');
  }

  console.log('📖 Reading context files...');

  // Read all required files
  const collectedData = fs.readFileSync(dataFile, 'utf-8');
  const researchPrompt = fs.readFileSync(
    path.join(projectRoot, 'tooling/prompts/daily-research.md'),
    'utf-8'
  );
  const companies = fs.readFileSync(
    path.join(projectRoot, 'context/companies.md'),
    'utf-8'
  );
  const people = fs.readFileSync(
    path.join(projectRoot, 'context/people.md'),
    'utf-8'
  );
  const prefs = fs.readFileSync(
    path.join(projectRoot, 'context/prefs.md'),
    'utf-8'
  );
  const openQuestions = fs.readFileSync(
    path.join(projectRoot, 'context/open-questions.md'),
    'utf-8'
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

    if (fs.existsSync(pastFile)) {
      const content = fs.readFileSync(pastFile, 'utf-8');
      previousUpdates.push({
        date: pastDateStr,
        content: content
      });
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
    const generatedContent = message.content[0].text;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to output file
    fs.writeFileSync(outputFile, generatedContent);

    console.log('✅ Daily update generated successfully!\n');
    console.log(`📄 Output saved to: ${outputFile}`);
    console.log(`📊 Tokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output\n`);
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
