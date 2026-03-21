# AI PM Research — Agent Guide

This repo generates daily PM research updates focused on AI products, shipped automatically via GitHub Actions. Read this before making changes.

---

## What this project does

A daily pipeline collects content from tracked companies and people, synthesizes it into a structured PM research update, and commits the result to `updates/daily/YYYY/YYYY-MM-DD.md`.

---

## Key files to know

| File | What it does |
|------|-------------|
| `scripts/run-daily-research-data-collection.sh` | Main entry point — runs data collection then synthesis |
| `scripts/check-company-updates.js` | Scrapes RSS/blogs for tracked companies |
| `scripts/check-people-search.js` | Claude web_search agent for tracked people |
| `scripts/orchestrate-daily-update.js` | Synthesis pipeline — synthesizer → QA → patch → save |
| `src/pipelines/people-search.js` | People search pipeline (rate-limit resilient, batched) |
| `context/companies.md` | Tracked companies with their RSS/blog URLs |
| `context/people.md` | Tracked people with their blog/social URLs |
| `context/prefs.md` | Quality bar and inclusion rules for the synthesizer |
| `updates/daily/YYYY/YYYY-MM-DD.md` | Daily output files |
| `updates/monthly/YYYY-MM.md` | Monthly rollup summaries |

---

## How to run

```bash
# Requires ANTHROPIC_API_KEY in environment
source .env  # or export ANTHROPIC_API_KEY="..."

# Full pipeline (data collection + synthesis)
bash scripts/run-daily-research-data-collection.sh

# Synthesis only (data file must exist in /tmp/)
node scripts/orchestrate-daily-update.js --date 2026-03-21
```

---

## Adding tracked companies or people

- **Companies:** edit `context/companies.md` — add name, why we track them, and primary source URLs with RSS feeds or `(feed_url: scrape)` annotation
- **People:** edit `context/people.md` — add name, role, signal types, and Twitter/blog/RSS
- No code changes needed — scripts read these files automatically

---

## Output format requirements

Every daily update must start with valid YAML frontmatter or the pipeline fails:

```markdown
---
title: "Short Natural Title"
date: YYYY-MM-DD
tags:
  - daily-update
  - ai-pm-research
---
```

---

## What not to touch

- `updates/` — auto-generated, don't edit manually
- `tooling/node_modules/` — installed dependencies
- `.github/workflows/daily-update.yml` — production pipeline, changes affect the daily GitHub Actions run
