# Quick Reference Guide

## Repository Location

**Local Path:** `/Users/madisonford/Documents/ai-pm-research`

**GitHub:** https://github.com/madsford22-coder/ai-pm-research

---

## Key Files to Reference in New Chats

### Context Files (Define scope and filters)
- `context/companies.md` - 19 tracked companies with what to watch for
- `context/people.md` - 34 tracked people with RSS feeds and platforms
- `context/prefs.md` - Research preferences and quality bars
- `context/open-questions.md` - 12 PM-relevant questions to watch for
- `context/session-2025-12-27.md` - Today's setup summary

### Daily Research Prompt
- `tooling/prompts/daily-research.md` - Complete prompt for running daily research

### Tooling Scripts
- `tooling/check-recent-posts.py` - Check RSS feeds for recent posts from tracked people
- `tooling/find-rss-feeds.js` - Discover RSS feeds using Puppeteer
- `tooling/package.json` - Node.js dependencies
- `tooling/requirements.txt` - Python dependencies

### Daily Updates
- `updates/daily/YYYY/YYYY-MM-DD.md` - Daily research updates

### Monthly Summaries
- `updates/monthly/YYYY-MM.md` - Monthly research summaries (auto-generated)
- Generate with: `node scripts/generate-monthly-summary.js`

---

## How to Use in a New Chat

**To start a new research session, say:**
> "I'm working on the AI PM Research Assistant at ~/Documents/ai-pm-research. Please read the context files and run today's research using the prompt in tooling/prompts/daily-research.md"

**Or reference specific files:**
> "Read context/companies.md and context/people.md, then check for recent posts using tooling/check-recent-posts.py"

---

## Quick Commands

**Check recent posts:**
```bash
cd ~/Documents/ai-pm-research
python3 tooling/check-recent-posts.py --days 7 --format markdown
```

**Find RSS feeds:**
```bash
cd ~/Documents/ai-pm-research/tooling
node find-rss-feeds.js
```

**Generate daily update:**
Follow the prompt in `tooling/prompts/daily-research.md`

---

## System Status

✅ All context files created and configured
✅ 12 RSS feeds discovered and added
✅ Tooling scripts operational
✅ Daily research process validated
✅ Git repository connected to GitHub

