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
const { fetchRSSFeedDirect } = require('../adapters/rss');

const DEFAULT_DAYS_BACK = 3;
const CONCURRENCY = 3;
const BATCH_DELAY_MS = 3000;    // pause between batches to stay under tokens/min limit
const MODEL = 'claude-haiku-4-5-20251001';
const FALLBACK_MODEL = 'claude-sonnet-4-6';
const MAX_429_RETRIES = 2;      // reduced: 2 retries max (was 3)
const RETRY_BASE_DELAY_MS = 10000; // 10s base, doubles each retry (was 15s)
const PERSON_TIMEOUT_MS = 50000;   // 50s hard timeout per person
const TOTAL_TIMEOUT_MS = 7 * 60 * 1000; // 7 min total — bail out with partial results

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
 * Fetch a person's recent activity from their RSS feed — no API calls.
 * @param {Object} person - Person object with rss_feed
 * @param {number} daysBack
 * @returns {Promise<{name: string, text: string, hasActivity: boolean, source: string}>}
 */
async function fetchPersonFromRSS(person, daysBack) {
  const { name, rss_feed } = person;
  const { posts, error } = await fetchRSSFeedDirect(rss_feed, { daysBack });

  if (error || posts.length === 0) {
    const reason = error ? `RSS error: ${error}` : 'No recent activity found.';
    return { name, text: reason, hasActivity: false, source: 'rss' };
  }

  const lines = posts.slice(0, 5).map(post => {
    const date = post.published ? new Date(post.published).toISOString().split('T')[0] : '';
    const desc = post.description
      ? ' — ' + post.description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200)
      : '';
    return `- [${post.title}](${post.link})${date ? ' (' + date + ')' : ''}${desc}`;
  });

  return { name, text: lines.join('\n'), hasActivity: true, source: 'rss' };
}

/**
 * Search for a single person's recent public activity.
 * @param {Object} anthropic - Anthropic client instance
 * @param {Object} person - Person object from parsePeopleFile
 * @param {number} daysBack
 * @returns {Promise<{name: string, text: string, hasActivity: boolean}>}
 */
async function searchPersonActivityCore(anthropic, person, daysBack) {
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
- Use at most 2 web searches total. Stop after 2 searches regardless of results.
- Only include content directly published by ${name} — their own tweets, blog posts, newsletters, or public statements
- Do NOT include third-party articles ABOUT them, news coverage of their company, or analyst writeups
- Focus on: product thinking, AI product decisions, PM frameworks, product launches, strategic takes
- For each item found, return exactly: title/summary (1–2 sentences), URL, date published
- If nothing directly from them exists in this window, say exactly: No recent activity found.
- Do NOT fabricate. Only report real, verifiable content you actually found.
- Do not explain your search process — output findings only.`;

  for (const model of [MODEL, FALLBACK_MODEL]) {
    let attempt = 0;
    while (true) {
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
        const is429 = err.status === 429 || err.message?.includes('rate_limit');
        const isTransient = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' ||
          err.message?.includes('network') || err.message?.includes('connect');

        if ((is429 || isTransient) && attempt < MAX_429_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          const reason = is429 ? 'rate limited' : 'transient error';
          console.warn(`  ⏳ ${name}: ${reason}, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_429_RETRIES})...`);
          await new Promise(r => setTimeout(r, delay));
          attempt++;
          continue;
        }
        if (model === MODEL) {
          console.warn(`  ⚠️  ${name}: primary model failed (${err.message}), trying fallback...`);
        } else {
          console.error(`  ✗ ${name}: both models failed — ${err.message}`);
          return { name, text: `Search error: ${err.message}`, hasActivity: false, errored: true };
        }
        break; // move to fallback model
      }
    }
  }
}

/**
 * Wrapper: run searchPersonActivityCore with a hard per-person timeout.
 */
async function searchPersonActivity(anthropic, person, daysBack) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('per-person timeout')), PERSON_TIMEOUT_MS)
  );
  try {
    return await Promise.race([searchPersonActivityCore(anthropic, person, daysBack), timeout]);
  } catch (err) {
    console.warn(`  ⏰ ${person.name}: ${err.message} — skipping`);
    return { name: person.name, text: `Search error: ${err.message}`, hasActivity: false, errored: true };
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
  const rssEnabled = people.filter(p => p.rss_feed);
  const searchOnly = people.filter(p => !p.rss_feed);
  console.log(`Fetching RSS for ${rssEnabled.length} people, searching ${searchOnly.length} via web (last ${daysBack} days)...\n`);

  // ── Step 1: RSS fetches (free, parallel) ──────────────────────────────────
  const rssResults = await Promise.all(rssEnabled.map(p => fetchPersonFromRSS(p, daysBack)));
  const rssActive = rssResults.filter(r => r.hasActivity).length;
  console.log(`  [RSS] ${rssActive}/${rssEnabled.length} with activity\n`);

  // ── Step 2: Web search for people without RSS ─────────────────────────────
  const results = [...rssResults];
  const totalBatches = Math.ceil(searchOnly.length / CONCURRENCY);
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;

  for (let i = 0; i < searchOnly.length; i += CONCURRENCY) {
    if (Date.now() >= deadline) {
      const remaining = searchOnly.slice(i).map(p => p.name);
      console.warn(`  ⏰ Total timeout reached — skipping remaining: ${remaining.join(', ')}`);
      break;
    }

    const batch = searchOnly.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    console.log(`  [Search] Batch ${batchNum}/${totalBatches}: ${batch.map(p => p.name).join(', ')}`);

    const batchResults = await Promise.all(
      batch.map(person => searchPersonActivity(anthropic, person, daysBack))
    );
    results.push(...batchResults);

    // Pause between batches to stay under the tokens/min rate limit
    if (i + CONCURRENCY < searchOnly.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  const active   = results.filter(r => r.hasActivity);
  const errored  = results.filter(r => r.errored);
  const inactive = results.filter(r => !r.hasActivity && !r.errored);

  console.log(`\n  Found activity for ${active.length}/${people.length} people (${errored.length} errored, ${inactive.length} no activity)\n`);
  if (errored.length > 0) {
    console.warn(`  ⚠️  Errored: ${errored.map(r => r.name).join(', ')}`);
  }

  // Format as markdown section
  const lines = [`## People Activity (Last ${daysBack} Days)`];
  lines.push(`*Searched: ${people.length} people — ${active.length} with activity, ${inactive.length} quiet, ${errored.length} errored*`);

  if (active.length === 0) {
    lines.push('\nNo recent activity found for any tracked people.');
  } else {
    for (const result of active) {
      lines.push(`\n### ${result.name}`);
      lines.push(result.text);
    }
  }

  if (inactive.length > 0) {
    lines.push(`\n*No activity found for: ${inactive.map(r => r.name).join(', ')}*`);
  }
  if (errored.length > 0) {
    lines.push(`\n*Search errors (will retry tomorrow): ${errored.map(r => r.name).join(', ')}*`);
  }

  return { results, output: lines.join('\n') };
}

module.exports = { checkPeopleSearchPipeline };
