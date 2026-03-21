/**
 * People Search Pipeline
 *
 * Uses Claude API with web_search to find recent activity from tracked people.
 * Replaces the Puppeteer-based people-activity pipeline, which couldn't access
 * Twitter/X without auth and left ~60% of tracked people with zero coverage.
 *
 * Strategy: one Claude call per person with web_search enabled, batched 3 at a time.
 */

const path = require('path');
const { parsePeopleFile } = require('../adapters/markdown');

const DEFAULT_DAYS_BACK = 5;
const CONCURRENCY = 3;
const MODEL = 'claude-sonnet-4-6';
const FALLBACK_MODEL = 'claude-haiku-4-5-20251001';

/**
 * Strip Claude's reasoning preamble ("I'll search for...", "Let me try...") from
 * the response text, keeping only the actual findings.
 */
function stripPreamble(text) {
  if (!text) return text;
  // If the text starts with a finding marker (**, #, -, "No recent"), keep as-is
  if (/^(\*\*|#|-|No recent)/i.test(text)) return text;
  // Look for the first line that looks like a finding and drop everything before it
  const lines = text.split('\n');
  const findingIndex = lines.findIndex(line =>
    /^(\*\*|#\s|\-\s\*\*|No recent|Title:|URL:|Date:)/i.test(line.trim())
  );
  if (findingIndex > 0) return lines.slice(findingIndex).join('\n').trim();
  // Fallback: strip lines that are clearly search narration
  return lines
    .filter(line => !/^(I'(ll|ve)|Let me|Based on|Unfortunately|Here('s| are)|Search(ing)?)/i.test(line.trim()))
    .join('\n')
    .trim();
}

/**
 * Search for a single person's recent public activity.
 * @param {Object} anthropic - Anthropic client instance
 * @param {Object} person - Person object from parsePeopleFile
 * @param {number} daysBack
 * @returns {Promise<{name: string, text: string, hasActivity: boolean}>}
 */
async function searchPersonActivity(anthropic, person, daysBack) {
  const { name, twitter, blog, rss_feed } = person;

  const profiles = [
    twitter ? `Twitter/X: @${twitter}` : null,
    blog    ? `Blog: ${blog}`          : null,
    rss_feed ? `RSS: ${rss_feed}`      : null,
  ].filter(Boolean);

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysBack);
  const sinceDateStr = sinceDate.toISOString().split('T')[0];

  const userPrompt = `Find posts, tweets, or articles DIRECTLY authored by ${name} since ${sinceDateStr} (last ${daysBack} days).

Their public profiles:
${profiles.length > 0 ? profiles.join('\n') : '(search by name)'}

Rules:
- Only include content directly published by ${name} — their own tweets, blog posts, newsletters, or public statements
- Do NOT include third-party articles ABOUT them, news coverage of their company, or analyst writeups
- Focus on: product thinking, AI product decisions, PM frameworks, product launches, strategic takes
- For each item found, return exactly: title/summary (1–2 sentences), URL, date published
- If nothing directly from them exists in this window, say exactly: No recent activity found.
- Do NOT fabricate. Only report real, verifiable content you actually found.
- Do not explain your search process — output findings only.`;

  for (const model of [MODEL, FALLBACK_MODEL]) {
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract text from all text-type content blocks
      let text = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n')
        .trim();

      // Strip reasoning preamble — Claude sometimes emits "I'll search for..."
      // before the actual findings. Drop everything before the first finding marker.
      text = stripPreamble(text);

      const noActivity =
        !text ||
        text.toLowerCase().includes('no recent activity found') ||
        text.toLowerCase().includes('nothing was published') ||
        text.toLowerCase().includes('no posts or tweets') ||
        text.toLowerCase().includes('no direct posts') ||
        text.length < 40;

      return { name, text: text || 'No recent activity found.', hasActivity: !noActivity };
    } catch (err) {
      if (model === MODEL) {
        console.warn(`  ⚠️  ${name}: primary model failed (${err.message}), trying fallback...`);
      } else {
        console.error(`  ✗ ${name}: both models failed — ${err.message}`);
        return { name, text: `Search error: ${err.message}`, hasActivity: false };
      }
    }
  }
}

/**
 * Main pipeline: search all tracked people for recent activity.
 * @param {Object} options
 * @param {number}  options.daysBack   - Days to look back (default 2)
 * @param {string}  options.peopleFile - Path to people.md
 * @param {Object}  options.anthropic  - Anthropic client instance (required)
 * @returns {Promise<{results: Array, output: string}>}
 */
async function checkPeopleSearchPipeline(options = {}) {
  const {
    daysBack = DEFAULT_DAYS_BACK,
    peopleFile = path.join(__dirname, '../../context/people.md'),
    anthropic,
  } = options;

  if (!anthropic) throw new Error('anthropic client is required');

  const people = parsePeopleFile(peopleFile);
  console.log(`Searching activity for ${people.length} people (last ${daysBack} days)...\n`);

  const results = [];
  const totalBatches = Math.ceil(people.length / CONCURRENCY);

  for (let i = 0; i < people.length; i += CONCURRENCY) {
    const batch = people.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.map(p => p.name).join(', ')}`);

    const batchResults = await Promise.all(
      batch.map(person => searchPersonActivity(anthropic, person, daysBack))
    );
    results.push(...batchResults);
  }

  const activeCount = results.filter(r => r.hasActivity).length;
  console.log(`\n  Found activity for ${activeCount}/${people.length} people\n`);

  // Format as markdown section
  const lines = [`## People Activity (Last ${daysBack} Days)`];

  const active = results.filter(r => r.hasActivity);
  if (active.length === 0) {
    lines.push('\nNo recent activity found for any tracked people.');
  } else {
    for (const result of active) {
      lines.push(`\n### ${result.name}`);
      lines.push(result.text);
    }
  }

  // Append quiet list of people with no activity for transparency
  const inactive = results.filter(r => !r.hasActivity).map(r => r.name);
  if (inactive.length > 0) {
    lines.push(`\n*No activity found for: ${inactive.join(', ')}*`);
  }

  return { results, output: lines.join('\n') };
}

module.exports = { checkPeopleSearchPipeline };
