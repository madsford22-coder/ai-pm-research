# Automated Daily Research Synthesis Setup

This guide shows you how to fully automate your daily research workflow using Claude API.

## What Gets Automated

✅ **Data collection** - Puppeteer scrapes blogs, RSS feeds, company updates
✅ **AI synthesis** - Claude API generates the daily markdown file
❌ **Review & commit** - You still review and commit manually for quality control

## Quick Setup (5 minutes)

### 1. Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key and copy it

### 2. Set Your API Key

Add your API key to your shell environment:

```bash
# For bash users (~/.bashrc or ~/.bash_profile)
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc

# For zsh users (~/.zshrc) - recommended for macOS
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

**Or** create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit it and add your key
nano .env
# Add: ANTHROPIC_API_KEY=your-actual-key-here
```

**Important for cron**: If you want cron to use the API key, add it to your crontab:

```bash
crontab -e

# Add these lines at the top:
ANTHROPIC_API_KEY=your-api-key-here
```

### 3. Install Dependencies

```bash
npm install
```

This installs the `@anthropic-ai/sdk` package needed for synthesis.

### 4. Test the Workflow

Run the full workflow manually to test:

```bash
./scripts/run-daily-research-data-collection.sh
```

This will:
1. Collect data from all sources (blogs, RSS, company updates)
2. Automatically call Claude API to synthesize the daily update
3. Save the output to `updates/daily/YYYY/YYYY-MM-DD.md`

### 5. Review the Generated File

```bash
# Open in Cursor to review
cursor updates/daily/$(date +%Y)/$(date +%Y-%m-%d).md
```

### 6. Commit if Satisfied

```bash
git add updates/daily/$(date +%Y)/$(date +%Y-%m-%d).md
git commit -m "Add daily research update for $(date +%Y-%m-%d)"
git push
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│ Cron Job (runs daily at 9 AM)          │
│ scripts/run-daily-research-data-        │
│          collection.sh                   │
└────────────────┬────────────────────────┘
                 │
                 ├─► 1. Collect people activity (Puppeteer)
                 │      → /tmp/daily-research-YYYY-MM-DD.txt
                 │
                 ├─► 2. Collect company updates (Puppeteer)
                 │      → appends to same file
                 │
                 └─► 3. Synthesize with Claude API
                        scripts/synthesize-daily-update.js
                        │
                        ├─► Reads: /tmp/daily-research-YYYY-MM-DD.txt
                        ├─► Reads: context/*.md (prefs, people, companies, etc.)
                        ├─► Reads: previous 14 days for deduplication
                        ├─► Calls: Claude API (claude-sonnet-4-5)
                        └─► Writes: updates/daily/YYYY/YYYY-MM-DD.md
```

### What the Synthesis Script Does

The `scripts/synthesize-daily-update.js` script:

1. **Loads all context files**:
   - `context/companies.md` - which companies to track
   - `context/people.md` - which people to track
   - `context/prefs.md` - quality bars and preferences
   - `context/open-questions.md` - questions to watch for

2. **Loads collected data**: Reads `/tmp/daily-research-YYYY-MM-DD.txt`

3. **Checks for duplicates**: Reads previous 14 days of updates to avoid repeating items

4. **Calls Claude API**: Sends everything to Claude with the research prompt from `tooling/prompts/daily-research.md`

5. **Saves output**: Writes the generated markdown to `updates/daily/YYYY/YYYY-MM-DD.md`

### Cost Estimate

- **Data collection**: Free (Puppeteer scraping)
- **AI synthesis**: ~$0.10-0.30 per day (depends on data volume)
  - Input: ~50-80K tokens (context files + collected data + previous updates)
  - Output: ~3-5K tokens (generated markdown)
  - Model: Claude Sonnet 4.5 ($3/M input tokens, $15/M output tokens)

**Monthly cost estimate**: ~$3-9/month for daily automated synthesis

## Cron Setup

Your cron job should already be set up from previous configuration. Verify it's configured correctly:

```bash
crontab -l
```

You should see something like:

```bash
# Environment variables for Puppeteer/cron
ANTHROPIC_API_KEY=your-api-key-here
PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin
HOME=/Users/madisonford
SHELL=/bin/bash
USER=madisonford

# Daily Research Data Collection - runs at 9 AM every day
0 9 * * * cd "/Users/madisonford/Documents/ai-pm-research" && "/Users/madisonford/Documents/ai-pm-research/scripts/run-daily-research-data-collection.sh" > /tmp/daily-research-cron-$(date +\%Y-\%m-\%d).log 2>&1
```

**Important**: Make sure the `ANTHROPIC_API_KEY` line is in your crontab!

## Daily Workflow (After Automation)

### Morning (after 9 AM)

1. **Check if it ran successfully**:
   ```bash
   ls -la /tmp/daily-research-cron-$(date +%Y-%m-%d).log
   cat /tmp/daily-research-cron-$(date +%Y-%m-%d).log
   ```

2. **Review the generated file**:
   ```bash
   cursor updates/daily/$(date +%Y)/$(date +%Y-%m-%d).md
   ```

3. **Check quality**:
   - Does it meet the quality bar from `context/prefs.md`?
   - Are there any duplicates from previous days?
   - Are the insights PM-relevant?
   - Is the reflection challenge specific and actionable?

4. **Edit if needed** (in Cursor):
   - Fix any issues
   - Adjust framing or synthesis
   - Remove low-signal items

5. **Commit when satisfied**:
   ```bash
   git add updates/daily/$(date +%Y)/$(date +%Y-%m-%d).md
   git commit -m "Add daily research update for $(date +%Y-%m-%d)"
   git push
   ```

That's it! The entire workflow takes ~5-10 minutes of review time instead of 30-60 minutes of manual synthesis.

## Manual Runs

If you want to run the workflow manually (outside of cron):

### Full workflow (collection + synthesis)
```bash
./scripts/run-daily-research-data-collection.sh
```

### Collection only
```bash
./scripts/run-daily-research-data-collection.sh
# Then manually review /tmp/daily-research-YYYY-MM-DD.txt
```

### Synthesis only (after manual collection)
```bash
node scripts/synthesize-daily-update.js
```

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable not set"

Make sure you've exported the key in your shell:
```bash
export ANTHROPIC_API_KEY="your-key-here"
```

Or add it to your crontab:
```bash
crontab -e
# Add at the top: ANTHROPIC_API_KEY=your-key-here
```

### "Data file not found"

Run the collection script first:
```bash
./scripts/run-daily-research-data-collection.sh
```

### Synthesis produces low-quality output

Check:
1. Is the collected data comprehensive? (`/tmp/daily-research-YYYY-MM-DD.txt`)
2. Are context files up to date? (`context/*.md`)
3. Is the research prompt clear? (`tooling/prompts/daily-research.md`)

You can always manually edit the generated file in Cursor before committing.

### Cron job not running

See `CRON_TROUBLESHOOTING.md` for detailed debugging steps.

## Opting Out of Automation

If you want to go back to manual synthesis:

1. **Remove API key from environment**:
   ```bash
   # Remove from ~/.zshrc or ~/.bashrc
   nano ~/.zshrc  # or ~/.bashrc
   # Delete the ANTHROPIC_API_KEY line
   ```

2. **Remove from crontab**:
   ```bash
   crontab -e
   # Delete the ANTHROPIC_API_KEY line
   ```

The collection script will detect the missing key and skip synthesis, giving you the manual workflow again.

## Next Steps

1. ✅ Set up your API key
2. ✅ Run a test to verify it works
3. ✅ Let cron run for a few days and monitor quality
4. ✅ Adjust context files (`context/*.md`) as needed to improve output
5. ✅ Update the research prompt (`tooling/prompts/daily-research.md`) if you want different framing

## Questions?

- Check `AUTOMATION_SETUP.md` for the overall automation strategy
- Check `CRON_TROUBLESHOOTING.md` for cron-specific issues
- Check `AUTOMATION_QUICKSTART.md` for a quick reference
