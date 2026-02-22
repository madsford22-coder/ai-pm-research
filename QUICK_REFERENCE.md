# Quick Reference Guide

## Repository Location

**Local Path:** `/Users/madisonford/Documents/ai-pm-research`

**GitHub:** https://github.com/madsford22-coder/ai-pm-research

---

## Key Files to Reference in New Chats

### Context Files (Define scope and filters)
- `context/companies.md` - 19 tracked companies with what to watch for
- `context/people.md` - 38 tracked people with RSS feeds and platforms
- `context/prefs.md` - Research preferences and quality bars
- `context/open-questions.md` - 12 PM-relevant questions to watch for

### Daily Research Prompt
- `tooling/prompts/daily-research.md` - Complete prompt for running daily research (enriched format)

### Tooling Scripts
- `scripts/check-people-activity.js` - Check people activity across blogs, RSS, and Twitter/X (~80s for 38 people)
- `scripts/check-company-updates.js` - Check company changelogs and news
- `scripts/synthesize-daily-update.js` - Generate daily update via Claude API
- `scripts/generate-monthly-summary.js` - Generate monthly summaries
- `tooling/find-rss-feeds.js` - Discover RSS feeds using Puppeteer
- `tooling/package.json` - Node.js dependencies

### Daily Updates
- `updates/daily/YYYY/YYYY-MM-DD.md` - Daily research updates

### Monthly Summaries
- `updates/monthly/YYYY-MM.md` - Executive-style monthly research summaries (auto-generated)
- One-page summaries with top 3 themes and max 3 essential resources
- Generate with: `node scripts/generate-monthly-summary.js`
- Web app sidebar shows months linking directly to summaries

---

## How to Use in a New Chat

**To start a new research session, say:**
> "I'm working on the AI PM Research Assistant at ~/Documents/ai-pm-research. Please read the context files and run today's research using the prompt in tooling/prompts/daily-research.md"

**Or reference specific files:**
> "Read context/companies.md and context/people.md, then check for recent posts using tooling/check-recent-posts.py"

---

## Quick Commands

**Check people activity (RSS + blogs + Twitter/X):**
```bash
cd ~/Documents/ai-pm-research
node scripts/check-people-activity.js --days 14 --format markdown
```

**Check company updates:**
```bash
node scripts/check-company-updates.js --days 14 --format markdown
```

**Run full data collection + synthesis (automated):**
```bash
./scripts/run-daily-research-data-collection.sh
node scripts/synthesize-daily-update.js
```

**Generate monthly summary:**
```bash
node scripts/generate-monthly-summary.js 2026 1  # Year, Month
```

**Find RSS feeds:**
```bash
cd ~/Documents/ai-pm-research/tooling
node find-rss-feeds.js
```

---

## System Status

✅ All context files created and configured
✅ 38 people tracked with RSS feeds and platforms
✅ 19 companies tracked with changelogs
✅ People activity pipeline: ~80s for 38 people (parallel processing)
✅ LinkedIn skipped (always requires auth), Twitter/X enabled
✅ Enriched daily update format with critical questions & action items
✅ GitHub Actions workflow for automated daily research
✅ Netlify deployment from `web/` directory
✅ Git repository connected to GitHub

