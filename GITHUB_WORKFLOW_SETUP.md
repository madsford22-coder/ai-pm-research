# GitHub Actions Workflow Setup Guide

## Overview
Your GitHub Actions workflow is now configured to run daily at 9:00 AM PT. It will:
1. Run Puppeteer scripts to collect people activity and company updates
2. Use Claude API to synthesize the daily update
3. Commit and push the update to your repository
4. Send you an email notification (success or failure)

## Required GitHub Secrets

You need to configure these secrets in your GitHub repository:

### 1. ANTHROPIC_API_KEY (Required)
- Go to: https://github.com/madsford22-coder/ai-pm-research/settings/secrets/actions
- Click "New repository secret"
- Name: `ANTHROPIC_API_KEY`
- Value: Your Anthropic API key from https://console.anthropic.com/
- Click "Add secret"

### 2. NOTIFICATION_EMAIL (Required for email notifications)
- Same page as above
- Click "New repository secret"
- Name: `NOTIFICATION_EMAIL`
- Value: Your email address (e.g., madison@example.com)
- Click "Add secret"

### 3. GMAIL_USERNAME (Required for email notifications)
- Same page as above
- Click "New repository secret"
- Name: `GMAIL_USERNAME`
- Value: Your Gmail address (e.g., madison@gmail.com)
- Click "Add secret"

### 4. GMAIL_APP_PASSWORD (Required for email notifications)
- You need to generate a Gmail App Password (not your regular password)
- Instructions:
  1. Go to: https://myaccount.google.com/apppasswords
  2. You may need to enable 2-factor authentication first
  3. Click "Generate" and create an app password for "Mail"
  4. Copy the 16-character password
- Go back to GitHub secrets page
- Click "New repository secret"
- Name: `GMAIL_APP_PASSWORD`
- Value: The 16-character app password
- Click "Add secret"

## How to Test the Workflow

### Option 1: Trigger Manually via GitHub Web UI
1. Go to: https://github.com/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml
2. Click the "Run workflow" button on the right side (you may need to scroll)
3. Select branch "main"
4. Click the green "Run workflow" button
5. Watch the workflow run in real-time

### Option 2: Install GitHub CLI and Trigger via Command Line
```bash
# Install GitHub CLI (macOS)
brew install gh

# Authenticate
gh auth login

# Trigger the workflow
gh workflow run daily-update.yml --repo madsford22-coder/ai-pm-research

# View workflow runs
gh run list --workflow=daily-update.yml --repo madsford22-coder/ai-pm-research

# Watch the latest run
gh run watch --repo madsford22-coder/ai-pm-research
```

### Option 3: Use the Python Script (Already Created)
```bash
# Set your GitHub token
export GITHUB_TOKEN='your-personal-access-token'

# Run the script
python3 scripts/trigger-workflow.py
```

## What the Workflow Does

1. **Checkout repository** - Gets the latest code
2. **Setup Node.js** - Installs Node.js 20
3. **Install Puppeteer dependencies** - Installs Chrome/Chromium and all required libraries
4. **Install npm dependencies** - Installs Puppeteer and other packages
5. **Run data collection** - Runs your scripts:
   - `check-people-activity.js` - Scrapes people activity (last 14 days)
   - `check-company-updates.js` - Scrapes company updates (last 14 days)
   - `synthesize-daily-update.js` - Uses Claude API to generate the update
6. **Commit and push** - Commits the new update file to the repository
7. **Send email notification** - Emails you the result (success or failure)

## Automated Schedule

The workflow runs automatically every day at:
- **9:00 AM Pacific Time** (17:00 UTC in standard time, 16:00 UTC in daylight time)

Note: The workflow adjusts for DST automatically since we set `TZ=America/Los_Angeles` in the workflow.

## Troubleshooting

### Workflow doesn't appear to run
- Check that the workflow file is on the `main` branch
- Verify GitHub Actions is enabled for your repository
- Check https://github.com/madsford22-coder/ai-pm-research/actions

### Workflow fails
- Check the workflow run logs for error messages
- Common issues:
  - Missing `ANTHROPIC_API_KEY` secret
  - Puppeteer can't launch Chrome (should be fixed now)
  - Network timeouts when scraping websites
  - API rate limits

### Email not received
- Verify all 3 email-related secrets are set correctly
- Check spam folder
- Verify the Gmail App Password is correct
- Check workflow logs for email sending errors

### Puppeteer errors
- The workflow now installs all Chromium dependencies
- Uses `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
- Runs in headless mode automatically

## Monitoring

- View all workflow runs: https://github.com/madsford22-coder/ai-pm-research/actions
- Each run shows detailed logs for debugging
- You'll receive email notifications for both success and failure

## Cost Considerations

- GitHub Actions: Free for public repositories, 2000 minutes/month for private repos
- Anthropic API: Charges per token used (check your usage at https://console.anthropic.com/)
- Gmail: Free
