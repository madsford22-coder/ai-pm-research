# AI PM Research — Project Guide for Claude

This repo generates daily PM research updates focused on AI products and ships them automatically via GitHub Actions. This file explains the pipeline architecture, key files, and how to maintain it.

---

## What this project does

Every day at 6am PT, GitHub Actions:
1. Runs data collection scripts that scrape RSS feeds and blogs for tracked companies and people
2. Runs an AI orchestration pipeline that synthesizes a daily update from the collected metadata
3. Commits the resulting markdown file to `updates/daily/YYYY/YYYY-MM-DD.md`
4. Regenerates the monthly summary in `updates/monthly/YYYY-MM.md`
5. Sends an email notification on success or failure

---

## Pipeline architecture

```
.github/workflows/daily-update.yml
  └── bash scripts/run-daily-research-data-collection.sh
        ├── node scripts/check-people-search.js     → /tmp/daily-research-YYYY-MM-DD.txt
        ├── node scripts/check-company-updates.js  ↗
        └── node scripts/orchestrate-daily-update.js   ← main synthesis entry point
```

### orchestrate-daily-update.js (the synthesis pipeline)

This is a self-healing multi-agent pipeline with three steps:

**Step 1 — Synthesizer Agent**
Calls Claude API with the collected metadata + context files + previous 7 days of updates. Produces a draft daily update in markdown.

**Step 2 — QA Agent**
Validates the draft against the raw collected data. Returns a JSON verdict:
- `pass: true` → proceed to save
- `pass: false, severity: "major"` → retry synthesizer with specific feedback about what was missed
- `pass: false, severity: "minor"` → skip retry, go straight to patch

After a major-fail retry, if QA still fails → Patch Agent adds missed items directly as Quick Hits.

**Step 3 — Executor**
Validates frontmatter, saves the file, regenerates monthly summary.

**Model fallback:** All Claude API calls try `claude-sonnet-4-6` first. On 429 rate limit errors, they retry with exponential backoff (up to 3x) before falling back to `claude-haiku-4-5-20251001`. Other errors fall back immediately.

### Why the QA agent exists

The synthesizer was consistently producing "No meaningful PM-relevant updates today" even when tracked companies had shipped real features. Root cause: the prompt told Claude to "actually read source content" but the API context has no web access, so Claude would refuse to synthesize from metadata alone and filter everything out. The QA agent detects this over-filtering and either forces a retry or patches the output directly.

---

## Key files

| File | Purpose |
|------|---------|
| `scripts/orchestrate-daily-update.js` | Main synthesis entry point — orchestrator + agents |
| `scripts/run-daily-research-data-collection.sh` | Shell entry point: runs collection then orchestrator |
| `scripts/check-company-updates.js` | Scrapes RSS/blogs for tracked companies (Puppeteer) |
| `scripts/check-people-search.js` | Claude web_search agent for tracked people's recent activity |
| `src/pipelines/people-search.js` | Core people search pipeline — batched, rate-limit resilient |
| `scripts/generate-monthly-summary.js` | Regenerates monthly rollup from daily files |
| `context/companies.md` | Tracked companies and their feed URLs |
| `context/people.md` | Tracked people and their blog/social URLs |
| `context/prefs.md` | Quality bar, inclusion rules, what to ignore |
| `context/open-questions.md` | Open PM questions to watch for signals on |
| `tooling/prompts/daily-research.md` | System prompt for the synthesizer agent |
| `updates/daily/YYYY/YYYY-MM-DD.md` | Daily output files |
| `updates/monthly/YYYY-MM.md` | Monthly summaries |

---

## Running manually

```bash
# Set API key
export ANTHROPIC_API_KEY="..."   # or source .env

# Run full pipeline for today
bash scripts/run-daily-research-data-collection.sh

# Rerun synthesis only for a specific date (data file must already exist in /tmp/)
node scripts/orchestrate-daily-update.js --date 2026-03-20

# Rerun for a past date including data collection
node scripts/check-company-updates.js --days 3 --format markdown > /tmp/daily-research-2026-03-15.txt
node scripts/check-people-search.js --days 5 >> /tmp/daily-research-2026-03-15.txt
node scripts/orchestrate-daily-update.js --date 2026-03-15
```

---

## Debugging "no updates" output

If the pipeline produces a "No meaningful PM-relevant updates today" file when there should be content:

1. Check the raw data file: `cat /tmp/daily-research-YYYY-MM-DD.txt` — does it have company/people activity?
2. If yes, the synthesizer is over-filtering. The QA agent should catch this. Check if QA is running correctly by looking at the console output for `[Step 2/3] Running QA Agent`.
3. If the QA agent itself is failing (invalid JSON response), it defaults to `pass: true` and the bad output gets saved. Check the log for `⚠️ QA response was not valid JSON`.
4. As a last resort, run the orchestrator manually and inspect the draft before QA: add a `console.log(draft)` after `runSynthesizer()` in `orchestrate-daily-update.js`.

---

## GitHub Actions secrets required

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `NOTIFICATION_EMAIL` | Email address for success/failure notifications |
| `GMAIL_USERNAME` | Gmail address for sending notifications |
| `GMAIL_APP_PASSWORD` | Gmail app password (not account password) |

---

## Adding tracked companies or people

- Edit `context/companies.md` to add a company with its blog/RSS/changelog URLs
- Edit `context/people.md` to add a person with their blog/RSS/Twitter/LinkedIn
- The data collection scripts read these files automatically on each run
- No code changes needed

---

## Output file format

Every daily update must start with YAML frontmatter:

```markdown
---
title: "Short Natural Title"
date: YYYY-MM-DD
tags:
  - daily-update
  - ai-pm-research
---

# Daily PM Research Update: YYYY-MM-DD
```

If the frontmatter is missing or malformed, the orchestrator exits with code 1 and GitHub Actions fails (no commit). This is intentional — a corrupt file would break the site.
