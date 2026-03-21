#!/usr/bin/env node
/**
 * Orchestrate Daily Research Update
 *
 * Self-healing multi-agent pipeline:
 *
 * [1] Synthesizer Agent  — generates draft from collected metadata
 * [2] QA Agent          — validates draft vs raw data, detects over-filtering
 *       ↓ FAIL (major)  → retry synthesizer with specific feedback
 *       ↓ FAIL (any)    → patch agent adds missed items directly
 * [3] Executor          — validates frontmatter, saves file, updates monthly summary
 *
 * Self-healing mechanisms:
 * - QA catches over-filtering and missed items before saving
 * - Retry loop sends QA feedback back to synthesizer (1 retry max)
 * - Patch mode adds missed Quick Hits directly when retry isn't enough
 * - Model fallback: sonnet-4-6 → haiku-4-5 on API/model errors
 */

const path = require('path');
const fs = require('fs');

// Add tooling/node_modules to module path so @anthropic-ai/sdk can be found
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
const { readFileSafe, writeFileSafe, fileExists, ensureDirectoryExists } = require('../src/utils/file');
const { validateNonEmptyString } = require('../src/utils/validation');

// ─── Date handling ────────────────────────────────────────────────────────────
const dateArg = process.argv.includes('--date')
  ? process.argv[process.argv.indexOf('--date') + 1]
  : null;
const today = dateArg ? new Date(dateArg + 'T12:00:00') : new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;

// ─── Models — primary first, fallback second ─────────────────────────────────
const MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];

let anthropic;

// ─── Shared Claude caller with 429 backoff + model fallback ──────────────────
const MAX_429_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 20000; // 20s, doubles each retry

async function callClaude(systemPrompt, userPrompt, maxTokens = 16000) {
  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    if (i > 0) console.log(`   🔄 Falling back to model: ${model}`);

    let attempt = 0;
    while (true) {
      try {
        const message = await anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt,
        });
        return { text: message.content[0].text, model, usage: message.usage };
      } catch (error) {
        const is429 = error.status === 429 || error.message?.includes('rate_limit');
        if (is429 && attempt < MAX_429_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(`   ⏳ Rate limited on ${model}, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_429_RETRIES})...`);
          await new Promise(r => setTimeout(r, delay));
          attempt++;
          continue;
        }
        // Non-429 error or retries exhausted — try next model
        if (i < MODELS.length - 1) {
          console.warn(`   ⚠️  Model ${model} failed (${error.message}), trying fallback...`);
        } else {
          throw error;
        }
        break;
      }
    }
  }
}

// ─── Content validation & cleaning ───────────────────────────────────────────
function validateAndCleanContent(content) {
  // Unwrap markdown fences if model wrapped content
  const fenceMatch = content.match(/```(?:markdown)?\s*\n(---[\s\S]*?)\n```/);
  if (fenceMatch) {
    console.log('   ⚠️  Unwrapping fenced code block...');
    content = fenceMatch[1];
  }

  // Strip preamble before frontmatter
  const frontmatterIndex = content.indexOf('---');
  if (frontmatterIndex > 0) {
    console.log('   ⚠️  Removing preamble before frontmatter...');
    content = content.substring(frontmatterIndex);
  } else if (frontmatterIndex === -1) {
    return { valid: false, error: 'No frontmatter delimiter found', content };
  }

  // Validate frontmatter block exists and closes
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { valid: false, error: 'No closing frontmatter delimiter', content };
  }

  // Check required fields
  const frontmatterBody = frontmatterMatch[1];
  const missingFields = ['title:', 'date:', 'tags:'].filter(f => !frontmatterBody.includes(f));
  if (missingFields.length > 0) {
    return { valid: false, error: `Missing frontmatter fields: ${missingFields.join(', ')}`, content };
  }

  return { valid: true, content };
}

// ─── Synthesizer Agent ────────────────────────────────────────────────────────
async function runSynthesizer(context, qaFeedback = null) {
  const { researchPrompt, companies, people, prefs, openQuestions, previousUpdates, collectedData } = context;

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

  let userPrompt = `Today is ${dateStr}.

Generate the daily research update for today based on the collected data below.

CRITICAL OUTPUT FORMAT: Your response must be raw markdown ONLY. Do NOT wrap in code fences (\`\`\`markdown). Do NOT add any preamble, explanation, or label before the content. The very first characters of your response must be exactly: ---

## IMPORTANT: You are working from pre-collected metadata

The "Collected Research Data" section below contains metadata scraped from RSS feeds and blogs: titles, URLs, publication dates, and summaries where available. You are working offline — you CANNOT and SHOULD NOT attempt to fetch URLs or read external content. Synthesize entirely from what is provided here.

This means:
- For items WITH a summary or excerpt in the data: use that to write the "What happened" section
- For items WITHOUT a summary (title + URL only): use the title, source, and publication date to write a concise "What happened" based on what the title suggests shipped or was announced, then note full details are at the URL
- DO NOT skip items just because you lack the full article text — use what's available
- When you cannot complete the full synthesis format for an item, put it in Quick Hits instead of excluding it

## Inclusion rules (these override any filtering instinct)

- DEFAULT TO INCLUDING. If a tracked company or person had any activity, there is ALWAYS at minimum a Quick Hit.
- Quick Hits bar is low: a shipped product change or post from a tracked person with a title, URL, and date is sufficient — no full synthesis needed.
- Do NOT output "No meaningful PM-relevant updates today" if the collected data shows any activity from tracked companies or people. Use Quick Hits instead.
- DEDUPLICATION: Skip only the SAME event (same URL already in a prior update). Do NOT skip based on topic overlap.
- Pricing changes, platform launches, new features, and business model changes are ALWAYS new events.

## Reminders
- Maximum 3-5 items in detailed analysis
- Maximum 5 items in "Quick Hits" section
- Include the Daily Product Reflection Challenge at the end
- Output file should be saved to: updates/daily/${year}/${dateStr}.md`;

  if (qaFeedback) {
    userPrompt += `\n\n## ⚠️ QA Review Found Issues with Previous Attempt\n\n${qaFeedback}\n\nPlease revise your output to address the above. Ensure all listed items are included at minimum in Quick Hits.`;
  }

  userPrompt += `\n\n# Collected Research Data\n\n${collectedData}`;

  const result = await callClaude(systemPrompt, userPrompt);
  console.log(`   Model: ${result.model} | Tokens: ${result.usage.input_tokens} in, ${result.usage.output_tokens} out`);
  return result.text;
}

// ─── QA Agent ────────────────────────────────────────────────────────────────
const QA_SYSTEM_PROMPT = `You are a Quality Assurance agent for a daily PM research update pipeline.

Your job: validate the synthesizer's draft against the raw collected data and return a JSON report.

## Output format
Respond with a single JSON object only — no markdown fences, no preamble, nothing else. Schema:
{
  "pass": boolean,
  "severity": "none" | "minor" | "major",
  "issues": [
    {
      "type": "missed_item" | "over_filtering" | "format_error",
      "description": string,
      "item_title": string,
      "item_url": string
    }
  ],
  "feedback_for_synthesizer": string | null
}

## Pass criteria — return pass=true ONLY if ALL are true:
1. The draft starts with valid YAML frontmatter (--- block) containing title, date, and tags fields
2. The draft is NOT a bare "No meaningful PM-relevant updates today" response when the raw data contains activity from tracked companies or people
3. Items from the raw data that meet the Quick Hits bar appear in the draft (in detailed analysis OR Quick Hits)
4. No items are filtered solely due to "topic overlap" with previous updates — only same-URL duplicates are valid filter reasons

## Quick Hits bar (low threshold)
An item belongs in Quick Hits if ALL of these are true:
- It comes from a tracked company or tracked person in the raw data
- It represents a shipped product change, new feature, new post, pricing or business model change
- Its exact URL does NOT already appear in any of the previous 7 days of updates provided

## Severity
- "none": pass=true
- "minor": pass=false, only 1-2 Quick Hits missed — patch directly without retrying synthesizer
- "major": pass=false with meaningful content missed (3+ items, or "no updates" output when activity exists) — retry synthesizer with feedback first

## Deduplication rule
An item is a TRUE duplicate ONLY if the exact same URL already appears in the previous 7 days of updates.
"Same topic", "same category", or "similar pattern" is NOT a valid dedup reason.
A new post, new feature, or new product launch from a tracked company is always a new event even if the topic was discussed before.`;

async function runQA(rawData, draft, previousUpdates) {
  const previousUpdatesStr = previousUpdates.length > 0
    ? previousUpdates.map(u => `### ${u.date}\n${u.content}`).join('\n\n')
    : 'None — no previous updates in the 14-day window.';

  const userPrompt = `Validate this synthesizer draft against the raw collected data.

## Raw Collected Data
${rawData}

## Synthesizer Draft
${draft}

## Previous 14 Days of Updates (for deduplication checking)
${previousUpdatesStr}

Return your JSON report.`;

  const result = await callClaude(QA_SYSTEM_PROMPT, userPrompt, 4096);

  try {
    return JSON.parse(result.text.trim());
  } catch (e) {
    // If QA can't produce valid JSON, don't block the pipeline
    console.warn(`   ⚠️  QA response was not valid JSON — defaulting to pass`);
    console.warn(`   QA raw output: ${result.text.substring(0, 200)}`);
    return { pass: true, severity: 'none', issues: [], feedback_for_synthesizer: null };
  }
}

// ─── QA Patch Agent ───────────────────────────────────────────────────────────
async function runQAPatch(draft, issues, rawData) {
  const missedItems = issues.filter(i => i.type === 'missed_item' || i.type === 'over_filtering');

  if (missedItems.length === 0) {
    console.log('   No missed items to patch.');
    return draft;
  }

  const systemPrompt = `You are a patch agent. Add missing Quick Hits items to an existing daily PM research update.

CRITICAL OUTPUT FORMAT: Return the complete patched markdown document. Raw markdown only — no fences, no preamble. The very first characters must be: ---

Rules:
- Add missing items to the "## Quick Hits" section
- If "## Quick Hits" does not exist, create it before "## This Week's Pattern" or "## Reflection Prompt" (whichever comes first), or before the final "---" separator
- Format for each new Quick Hit: "- **Company/Author**: [Brief description of what shipped or was posted] (Date if available): URL"
- Do not modify existing content — only add the missing Quick Hits entries
- Keep Quick Hits to a maximum of 5 items total; if adding would exceed 5, prioritize by PM relevance and drop the lowest-signal existing item`;

  const userPrompt = `Add these missed items to the Quick Hits section of the draft below.

## Items to add as Quick Hits
${missedItems.map(i => `- **${i.item_title}**\n  URL: ${i.item_url}\n  Context: ${i.description}`).join('\n\n')}

## Current Draft
${draft}

Return the complete patched document.`;

  const result = await callClaude(systemPrompt, userPrompt);
  console.log(`   Patch model: ${result.model} | Tokens: ${result.usage.input_tokens} in, ${result.usage.output_tokens} out`);
  return result.text;
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${'='.repeat(50)}`);
  console.log('Daily Research Update Orchestrator');
  console.log(`Date: ${dateStr}`);
  console.log(`${'='.repeat(50)}\n`);

  // Validate API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  try {
    validateNonEmptyString(apiKey, 'ANTHROPIC_API_KEY');
  } catch (error) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('  export ANTHROPIC_API_KEY="your-api-key-here"\n');
    process.exit(1);
  }

  anthropic = new Anthropic({ apiKey });

  const projectRoot = path.join(__dirname, '..');
  const dataFile = `/tmp/daily-research-${dateStr}.txt`;
  const outputDir = path.join(projectRoot, 'updates', 'daily', String(year));
  const outputFile = path.join(outputDir, `${dateStr}.md`);

  if (!fileExists(dataFile)) {
    console.error(`❌ Data file not found: ${dataFile}`);
    console.error('  Run data collection first: bash scripts/run-daily-research-data-collection.sh\n');
    process.exit(1);
  }

  if (fileExists(outputFile)) {
    console.log(`⚠️  Output file already exists: ${outputFile}`);
    console.log('   Overwriting...\n');
  }

  // ── Read inputs ──────────────────────────────────────────────────────────
  console.log('📖 Reading context files...');
  const collectedData    = readFileSafe(dataFile);
  const researchPrompt   = readFileSafe(path.join(projectRoot, 'tooling/prompts/daily-research.md'));
  const companies        = readFileSafe(path.join(projectRoot, 'context/companies.md'));
  const people           = readFileSafe(path.join(projectRoot, 'context/people.md'));
  const prefs            = readFileSafe(path.join(projectRoot, 'context/prefs.md'));
  const openQuestions    = readFileSafe(path.join(projectRoot, 'context/open-questions.md'));

  console.log('📖 Reading previous 7 days of updates for deduplication...');
  const previousUpdates = [];
  for (let i = 1; i <= 7; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - i);
    const pYear  = pastDate.getFullYear();
    const pMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
    const pDay   = String(pastDate.getDate()).padStart(2, '0');
    const pDateStr = `${pYear}-${pMonth}-${pDay}`;
    const pastFile = path.join(projectRoot, 'updates', 'daily', String(pYear), `${pDateStr}.md`);
    if (fileExists(pastFile)) {
      try {
        previousUpdates.push({ date: pDateStr, content: readFileSafe(pastFile) });
      } catch (e) {
        // skip unreadable files
      }
    }
  }
  console.log(`   Found ${previousUpdates.length} previous updates\n`);

  const context = { researchPrompt, companies, people, prefs, openQuestions, previousUpdates, collectedData };

  // ── Step 1: Synthesizer ──────────────────────────────────────────────────
  console.log('🤖 [Step 1/3] Running Synthesizer Agent...');
  let draft = await runSynthesizer(context);

  // ── Step 2: QA validation ────────────────────────────────────────────────
  console.log('\n🔍 [Step 2/3] Running QA Agent...');
  let qaResult = await runQA(collectedData, draft, previousUpdates);
  console.log(`   Result: ${qaResult.pass ? '✅ PASS' : `❌ FAIL (${qaResult.severity})`}`);

  if (!qaResult.pass) {
    if (qaResult.issues && qaResult.issues.length > 0) {
      console.log('   Issues:');
      qaResult.issues.forEach(issue =>
        console.log(`   - [${issue.type}] ${issue.item_title || issue.description}`)
      );
    }

    if (qaResult.severity === 'major' && qaResult.feedback_for_synthesizer) {
      // Major failure: retry synthesizer with QA feedback
      console.log('\n🔄 Major QA failure — retrying Synthesizer with feedback...');
      draft = await runSynthesizer(context, qaResult.feedback_for_synthesizer);

      console.log('\n🔍 Re-running QA on revised draft...');
      qaResult = await runQA(collectedData, draft, previousUpdates);
      console.log(`   Result: ${qaResult.pass ? '✅ PASS' : `❌ FAIL (${qaResult.severity}) — switching to patch mode`}`);
    }

    if (!qaResult.pass && qaResult.issues && qaResult.issues.length > 0) {
      // Still failing after retry (or was minor to begin with): patch directly
      console.log('\n🩹 Applying QA patch for missed items...');
      draft = await runQAPatch(draft, qaResult.issues, collectedData);
    }
  }

  // ── Step 3: Validate & save ──────────────────────────────────────────────
  console.log('\n💾 [Step 3/3] Validating and saving...');
  const { valid, error, content } = validateAndCleanContent(draft);

  if (!valid) {
    console.error(`❌ Content validation failed: ${error}`);
    console.error('   Content preview:', draft.substring(0, 300));
    process.exit(1);
  }

  ensureDirectoryExists(outputDir);
  writeFileSafe(outputFile, content);
  console.log(`✅ Daily update saved: ${outputFile}`);

  // ── Monthly summary ──────────────────────────────────────────────────────
  console.log('\n📅 Regenerating monthly summary...');
  try {
    const { generateMonthlySummary } = require('./generate-monthly-summary.js');
    await generateMonthlySummary(year, parseInt(month));
    console.log('✅ Monthly summary updated');
  } catch (e) {
    console.warn(`⚠️  Could not update monthly summary: ${e.message}`);
    console.warn(`   Regenerate manually: node scripts/generate-monthly-summary.js ${year} ${month}`);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('Next Steps:');
  console.log(`${'='.repeat(50)}`);
  console.log(`1. Review: cursor ${outputFile}`);
  console.log(`2. Commit: git add ${outputFile} && git commit -m "Add daily research update for ${dateStr}"`);
  console.log(`${'='.repeat(50)}\n`);
}

main().catch(err => {
  console.error('❌ Orchestrator failed:', err.message);
  if (err.status === 401) console.error('   Authentication failed — check ANTHROPIC_API_KEY');
  process.exit(1);
});
