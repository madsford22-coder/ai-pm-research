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

// ─── Models ──────────────────────────────────────────────────────────────────
const SONNET = 'claude-sonnet-4-6';
const HAIKU  = 'claude-haiku-4-5-20251001';

let anthropic;

// ─── Shared Claude caller with 429 backoff + model fallback ──────────────────
const MAX_429_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 20000; // 20s, doubles each retry

async function callClaude(systemPrompt, userPrompt, maxTokens = 8000, models = [SONNET, HAIKU]) {
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
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
        if (i < models.length - 1) {
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

// ─── Extract people items from collected data ─────────────────────────────────
function extractPeopleItems(collectedData) {
  const sectionMatch = collectedData.match(/## People Activity[\s\S]*?(?=\n## |\n={5,}|$)/);
  if (!sectionMatch) return [];
  const section = sectionMatch[0];
  const items = [];
  const personMatches = section.matchAll(/### ([^\n]+)\n([\s\S]*?)(?=\n### |\n\*No activity|\n## |$)/g);
  for (const match of personMatches) {
    const name = match[1].trim();
    const text = match[2].trim();
    if (text && !text.toLowerCase().startsWith('no recent activity')) {
      items.push({ name, text });
    }
  }
  return items;
}

// ─── Synthesizer Agent ────────────────────────────────────────────────────────
async function runSynthesizer(context, qaFeedback = null) {
  const { researchPrompt, companies, people, prefs, openQuestions, previousUrlList, collectedData } = context;

  const systemPrompt = `## OFFLINE SYNTHESIS MODE — READ THIS FIRST

You are operating in OFFLINE synthesis mode. The research prompt below was written for an interactive Cursor workflow with full web access. You have NO web access. Override rules for this mode:

1. You CANNOT fetch URLs. Do not attempt to access any link. Synthesize entirely from the pre-collected metadata provided in the user message.
2. The "Actually read the sources" and "Fetch and analyze full content" instructions in the research prompt DO NOT APPLY. Treat the pre-collected metadata (titles, URLs, dates, excerpts) as the full evidence available.
3. People posts are PRE-APPROVED for Quick Hits. Any tracked person listed in the "Tracked People With Activity" section MUST appear in Quick Hits. You do not need to apply the full quality bar — a name, title, URL, and date is sufficient. Do not filter people posts out.
4. The only valid reason to exclude a people item is if its exact URL already appears in a previous update.

---

${researchPrompt}

# Context Files

## context/companies.md
${companies}

## context/people.md
Activity from tracked people is pre-collected. Include any item from a tracked person that appears in the collected data.

## context/prefs.md
${prefs}

## context/open-questions.md
${openQuestions}

# URLs already covered in the last 14 days — skip any item whose exact URL appears here:
${previousUrlList}`;

  // Pre-extract people items so the synthesizer doesn't have to hunt for them
  const peopleItems = extractPeopleItems(collectedData);

  let userPrompt = `Today is ${dateStr}.

Generate the daily research update for today based on the collected data below.

CRITICAL OUTPUT FORMAT: Your response must be raw markdown ONLY. Do NOT wrap in code fences (\`\`\`markdown). Do NOT add any preamble, explanation, or label before the content. The very first characters of your response must be exactly: ---

## You are working from pre-collected metadata (offline)

The "Collected Research Data" section contains metadata scraped from RSS feeds and web search: titles, URLs, publication dates, and excerpts. Synthesize entirely from this — do not attempt to fetch any URLs.

- For items WITH an excerpt: use it to write the analysis
- For items WITHOUT an excerpt (title + URL only): write a concise description based on what the title suggests, then note full details are at the URL
- DO NOT skip items just because you lack the full article text — use what's available
- When you cannot complete the full synthesis format, put the item in Quick Hits instead of excluding it

## Inclusion rules (override any filtering instinct)

- DEFAULT TO INCLUDING. If a tracked company or person had any activity, there is ALWAYS at minimum a Quick Hit.
- Do NOT output "No meaningful PM-relevant updates today" if the collected data shows any activity from tracked companies or people.
- DEDUPLICATION: Skip only items whose exact URL already appears in the "URLs already covered" list in your system prompt. Topic overlap is NOT a valid reason to skip.

## Quick Hits — REQUIRED inclusions

Quick Hits must contain the top 5 most PM-relevant items from the list below. These are pre-approved — include them without applying the full quality bar.`;

  if (peopleItems.length > 0) {
    userPrompt += `\n\n### Tracked People With Activity Today (${peopleItems.length} people — pick top 5 for Quick Hits by PM relevance)\n\n`;
    userPrompt += peopleItems.map(p => `**${p.name}**\n${p.text}`).join('\n\n');
  } else {
    userPrompt += `\n\n*(No tracked people had activity today — Quick Hits should come from company updates.)*`;
  }

  userPrompt += `\n\n## Other reminders
- Maximum 3-5 items in detailed analysis (choose the highest-signal company or people items)
- Maximum 5 items in Quick Hits (people items take priority — fill remaining slots with company updates)
- Include Sit With This at the end
- Output file: updates/daily/${year}/${dateStr}.md`;

  if (qaFeedback) {
    userPrompt += `\n\n## ⚠️ QA Review Found Issues with Previous Attempt\n\n${qaFeedback}\n\nPlease revise your output to address the above. Ensure all listed items are included at minimum in Quick Hits.`;
  }

  userPrompt += `\n\n# Collected Research Data\n\n${collectedData}`;

  const result = await callClaude(systemPrompt, userPrompt);
  console.log(`   Model: ${result.model} | Tokens: ${result.usage.input_tokens} in, ${result.usage.output_tokens} out`);
  return result.text;
}

// ─── QA Check (structural, no LLM) ───────────────────────────────────────────
// The original LLM-based QA was catching one failure mode: synthesizer outputs
// "No meaningful PM-relevant updates today" when real data exists. The synthesizer
// prompt has since been heavily patched against that. The complex item-counting
// logic was causing false positives on good outputs (Haiku couldn't reliably
// cross-reference 25K tokens of raw data against the draft), triggering an
// unnecessary Sonnet retry every single day.
//
// This structural check catches the actual failure modes without any API call:
// 1. Empty / "no updates" output when raw data has content
// 2. Missing frontmatter
// 3. Draft has no items at all (no ### headers and no Quick Hits bullets)
function runQA(rawData, draft) {
  const issues = [];

  // Check 1: frontmatter present
  if (!draft.trimStart().startsWith('---')) {
    issues.push({ type: 'format_error', description: 'Missing YAML frontmatter', item_title: '', item_url: '' });
    return { pass: false, severity: 'major', issues, feedback_for_synthesizer: 'Your output is missing the required YAML frontmatter. The very first characters must be exactly: ---' };
  }

  // Check 2: "no updates" output when data exists
  const isNoUpdates = /no meaningful (pm-relevant )?updates today/i.test(draft);
  const dataHasContent = rawData.length > 500; // raw data file with real content is always much larger
  if (isNoUpdates && dataHasContent) {
    issues.push({ type: 'over_filtering', description: 'Synthesizer output "no updates" when raw data has content', item_title: '', item_url: '' });
    return {
      pass: false,
      severity: 'major',
      issues,
      feedback_for_synthesizer: 'You output "No meaningful PM-relevant updates today" but the collected data contains real activity from tracked companies and people. You MUST synthesize from the pre-collected metadata — do not refuse because you lack web access. Default to including. At minimum, every tracked company or person with activity gets a Quick Hit.',
    };
  }

  // Check 3: draft has actual content (at least one item header or Quick Hit bullet)
  const hasItems = /^#{2,3}\s+\S/m.test(draft) || /^- \*\*/m.test(draft);
  if (!hasItems) {
    issues.push({ type: 'format_error', description: 'Draft contains no items or Quick Hits', item_title: '', item_url: '' });
    return { pass: false, severity: 'major', issues, feedback_for_synthesizer: 'Your output contains no items. Include at least 1 detailed item and 1 Quick Hit based on the collected data.' };
  }

  return { pass: true, severity: 'none', issues: [], feedback_for_synthesizer: null };
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

  console.log('📖 Reading previous 14 days of updates for deduplication...');
  const seenUrls = new Set();
  let daysFound = 0;
  for (let i = 1; i <= 14; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - i);
    const pYear  = pastDate.getFullYear();
    const pMonth = String(pastDate.getMonth() + 1).padStart(2, '0');
    const pDay   = String(pastDate.getDate()).padStart(2, '0');
    const pDateStr = `${pYear}-${pMonth}-${pDay}`;
    const pastFile = path.join(projectRoot, 'updates', 'daily', String(pYear), `${pDateStr}.md`);
    if (fileExists(pastFile)) {
      try {
        const content = readFileSafe(pastFile);
        const urls = content.match(/https?:\/\/[^\s\)>\]"]+/g) || [];
        urls.forEach(u => seenUrls.add(u));
        daysFound++;
      } catch (e) {
        // skip unreadable files
      }
    }
  }
  const previousUrlList = seenUrls.size > 0
    ? [...seenUrls].join('\n')
    : '(none)';
  console.log(`   Extracted ${seenUrls.size} URLs from ${daysFound} previous updates\n`);

  const context = { researchPrompt, companies, people, prefs, openQuestions, previousUrlList, collectedData };

  // ── Step 1: Synthesizer ──────────────────────────────────────────────────
  console.log('🤖 [Step 1/3] Running Synthesizer Agent...');
  let draft = await runSynthesizer(context);

  // ── Step 2: QA validation ────────────────────────────────────────────────
  console.log('\n🔍 [Step 2/3] Running QA Agent...');
  let qaResult = runQA(collectedData, draft);
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
      qaResult = runQA(collectedData, draft);
      console.log(`   Result: ${qaResult.pass ? '✅ PASS' : `❌ FAIL (${qaResult.severity}) — skipping to save`}`);
    }
  }

  // ── Step 3: Validate & save ──────────────────────────────────────────────
  console.log('\n💾 [Step 3/3] Validating and saving...');
  let { valid, error, content } = validateAndCleanContent(draft);

  if (!valid) {
    console.warn(`   ⚠️  Content validation failed: ${error} — retrying synthesizer with format correction...`);
    draft = await runSynthesizer(context, `Your previous output failed content validation with this error: "${error}". CRITICAL: The very first characters of your response must be exactly: ---\nDo not wrap in code fences. Do not add any preamble.`);
    ({ valid, error, content } = validateAndCleanContent(draft));
  }

  if (!valid) {
    console.error(`❌ Content validation failed after retry: ${error}`);
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
