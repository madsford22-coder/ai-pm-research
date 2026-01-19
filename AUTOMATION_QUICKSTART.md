# Automated Research Workflow - Quick Start

## TL;DR - 3 Steps to Full Automation

```bash
# 1. Set your API key
export ANTHROPIC_API_KEY="your-key-here"

# 2. Install dependencies
npm install

# 3. Test it
./scripts/run-daily-research-data-collection.sh
```

That's it! Your daily research is now automated.

## What Just Happened?

The script:
1. ✅ Collected data from 38 people (blogs, RSS, Twitter, LinkedIn)
2. ✅ Collected updates from 12 companies (changelogs, blogs)
3. ✅ Called Claude API to synthesize everything
4. ✅ Generated `updates/daily/YYYY/YYYY-MM-DD.md`

**Your job**: Review the file and commit if it looks good.

## Daily Routine (5-10 minutes)

```bash
# 1. Check if cron ran successfully
cat /tmp/daily-research-cron-$(date +%Y-%m-%d).log

# 2. Review the generated file
cursor updates/daily/$(date +%Y)/$(date +%Y-%m-%d).md

# 3. Commit if satisfied
git add updates/daily/$(date +%Y)/$(date +%Y-%m-%d).md
git commit -m "Add daily research update for $(date +%Y-%m-%d)"
git push
```

## Cost

~$0.10-0.30 per day (~$3-9/month)

## Making It Run Automatically

Your cron is already set up! Just add the API key to your crontab:

```bash
crontab -e

# Add at the top:
ANTHROPIC_API_KEY=your-api-key-here
```

Now it runs every day at 9 AM automatically.

## Full Documentation

- **Setup details**: See `AUTOMATED_SYNTHESIS_SETUP.md`
- **Troubleshooting**: See `CRON_TROUBLESHOOTING.md`
- **Architecture**: See `AUTOMATION_SETUP.md`
