# Daily Research Automation Setup

This guide explains how to automate the daily research process.

## Current Workflow

1. **Data Collection** (can be automated)
   - Run `scripts/check-people-activity.js --days 14`
   - Run `scripts/check-company-updates.js --days 14`

2. **AI Synthesis** (requires AI)
   - Use Cursor with the research prompt from `tooling/prompts/daily-research.md`
   - Generate the daily update markdown file

3. **Commit & Push** (can be automated)
   - Commit the new file
   - Push to GitHub

## Automation Options

### Option 1: Local Automation with Helper Script (Recommended)

This option creates a helper script that collects all data and prepares it for easy review in Cursor.

#### Setup

1. **Create the helper script** (already created: `scripts/run-daily-research-data-collection.sh`)

2. **Make it executable:**
   ```bash
   chmod +x scripts/run-daily-research-data-collection.sh
   ```

3. **Run it manually each day, or set up a cron job:**
   ```bash
   # Add to crontab (runs daily at 9 AM)
   crontab -e
   
   # Add this line:
   0 9 * * * cd /Users/madisonford/Documents/ai-pm-research && ./scripts/run-daily-research-data-collection.sh > /tmp/daily-research-output-$(date +\%Y-\%m-\%d).txt 2>&1
   ```

4. **Review the output file** and use Cursor to generate the daily update

#### Manual Trigger

```bash
cd /Users/madisonford/Documents/ai-pm-research
./scripts/run-daily-research-data-collection.sh
```

The script will:
- Collect all research data
- Save output to a dated file
- Display summary for quick review

### Option 2: GitHub Actions with AI API (Fully Automated)

This option fully automates the process using GitHub Actions and an AI API (OpenAI, Anthropic, etc.).

#### Setup

1. **Add API keys to GitHub Secrets:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add: `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`)

2. **Create GitHub Actions workflow** (see `.github/workflows/daily-research.yml`)

3. **The workflow will:**
   - Run daily at a scheduled time
   - Collect research data
   - Call AI API to generate update
   - Commit and push the file

#### Limitations

- Requires API key and credits
- Less interactive (can't review before committing)
- May need tuning of AI prompts

### Option 3: Hybrid Approach (Recommended for Cursor Users)

1. **Automate data collection** with cron + helper script
2. **Use Cursor interactively** for AI synthesis (better quality control)
3. **Automate commit** after you review and approve

#### Setup

1. Set up cron job for data collection (Option 1)
2. Review output in Cursor each day
3. Use Cursor to generate the daily update
4. Optionally: Automate commit/push after file is created

## Recommended Setup for Cursor Users

Since you're using Cursor, I recommend **Option 3 (Hybrid)**:

1. **Automate data collection** with the helper script + cron
2. **Keep AI synthesis in Cursor** for quality control and iteration
3. **Add a post-commit hook** to auto-push (optional)

### Quick Setup Steps

```bash
# 1. Make helper script executable
chmod +x scripts/run-daily-research-data-collection.sh

# 2. Test it
./scripts/run-daily-research-data-collection.sh

# 3. Set up daily cron job (runs at 9 AM)
crontab -e
# Add: 0 9 * * * cd /Users/madisonford/Documents/ai-pm-research && ./scripts/run-daily-research-data-collection.sh > /tmp/daily-research-$(date +\%Y-\%m-\%d).txt 2>&1

# 4. (Optional) Add git hook to auto-push after commit
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
git push
EOF
chmod +x .git/hooks/post-commit
```

## Daily Routine (After Automation)

1. **Morning**: Check `/tmp/daily-research-YYYY-MM-DD.txt` for collected data
2. **In Cursor**: Open the output file and use the research prompt
3. **Generate**: Use Cursor to create the daily update file
4. **Review**: Check the generated file for quality
5. **Commit**: Commit and push (auto-pushes if hook is set up)

## Troubleshooting

### Cron job not running
- Check cron logs: `grep CRON /var/log/system.log`
- Verify PATH in cron: Add `PATH=/usr/local/bin:/usr/bin:/bin` to crontab
- Use full paths in cron commands

### Scripts fail in cron
- Add explicit paths to node/python executables
- Add working directory: `cd /Users/madisonford/Documents/ai-pm-research && ...`
- Redirect output to see errors: `> /tmp/cron-output.txt 2>&1`

### Puppeteer/Chrome issues
- Ensure Chrome/Chromium is installed
- May need `--no-sandbox` flag for headless Chrome
- Check permissions in cron environment

## Next Steps

1. Choose your automation option
2. Set up the helper script
3. Test the workflow manually
4. Set up cron/automation
5. Monitor for a few days and adjust as needed
