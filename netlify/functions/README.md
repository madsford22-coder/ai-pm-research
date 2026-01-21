# Netlify Scheduled Functions

This directory contains Netlify serverless functions that run on a schedule.

## scheduled-daily-update.js

**Purpose**: Automatically generate daily PM research updates

**Schedule**: Daily at 9:00 AM PT

**What it does**:
1. Collects research data from RSS feeds and sources
2. Generates daily update using Claude API
3. Commits update file to repository
4. Triggers Netlify rebuild

## Setup Instructions

### 1. Enable Scheduled Functions in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Functions** → **Scheduled functions**
3. Click **Add scheduled function**
4. Select `scheduled-daily-update`
5. Set schedule: `0 9 * * *` (9:00 AM daily)
6. Set timezone: `America/Los_Angeles`
7. Click **Save**

### 2. Configure Environment Variables

In Netlify dashboard → **Site settings** → **Environment variables**, add:

**Required:**
- `ANTHROPIC_API_KEY` - Your Claude API key from https://console.anthropic.com
- `GITHUB_TOKEN` - GitHub personal access token with `repo` scope

**Optional:**
- `NOTIFICATION_EMAIL` - Email address for error notifications

### 3. Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Give it a name: "Netlify Daily Updates"
4. Select scopes: `repo` (full control of private repositories)
5. Click **Generate token**
6. Copy the token and add to Netlify environment variables

### 4. Test the Function

You can test the function manually:

```bash
# In Netlify UI, go to Functions → scheduled-daily-update → Trigger function
# Or use Netlify CLI:
netlify functions:invoke scheduled-daily-update
```

## Current Status

⚠️ **Function is created but not fully implemented**

The current implementation is a skeleton that:
- ✅ Handles Claude API communication
- ✅ Generates update content
- ❌ Needs data collection logic (RSS, people, companies)
- ❌ Needs GitHub API integration to commit files
- ❌ Needs rebuild trigger logic

## Next Steps to Complete Implementation

### Phase 1: Data Collection (Required)
- [ ] Port RSS feed collection logic from `scripts/check-people-activity.js`
- [ ] Port company updates logic from `scripts/check-company-updates.js`
- [ ] Make data collection work in serverless environment

### Phase 2: File Creation (Required)
- [ ] Implement GitHub API integration to create/commit files
- [ ] Use GitHub API to write to `updates/daily/YYYY/YYYY-MM-DD.md`
- [ ] Handle authentication with GitHub token

### Phase 3: Rebuild Trigger (Optional)
- [ ] Trigger Netlify rebuild after commit
- [ ] Use Netlify Build Hooks or Deploy API

### Phase 4: Notifications (Nice to have)
- [ ] Email notifications on success/failure
- [ ] Slack webhook integration (optional)

## Alternative: GitHub Actions

If Netlify scheduled functions are complex to implement, consider GitHub Actions instead:

**Pros:**
- Free for public repos
- Better for git operations
- Easy secrets management
- Built-in cron scheduling

**Implementation:**
Create `.github/workflows/daily-update.yml`:

```yaml
name: Daily Research Update

on:
  schedule:
    - cron: '0 16 * * *'  # 9am PT = 4pm UTC (adjust for DST)
  workflow_dispatch:  # Allow manual trigger

jobs:
  generate-update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd tooling && npm ci

      - name: Generate daily update
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd tooling
          node ../scripts/synthesize-daily-update.js

      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add updates/
          git commit -m "Add daily research update for $(date +%Y-%m-%d)" || echo "No changes"
          git push
```

**Advantages:**
- Simpler to implement (no GitHub API needed, just git commands)
- Free and reliable
- Easy to debug with action logs
- Can reuse existing scripts

**Disadvantages:**
- Runs in UTC (need to convert to PT)
- Separate from Netlify infrastructure
- Uses GitHub Actions minutes (but free for public repos)

## Recommendation

Given the complexity of implementing the GitHub API integration in a Netlify function, **GitHub Actions is the recommended approach** for automatic daily updates.

The Netlify function can remain as a manual trigger option or for future enhancements.
