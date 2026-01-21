# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated tasks.

## daily-update.yml

**Purpose**: Automatically generate daily PM research updates

**Schedule**: Daily at 9:00 AM PT (17:00 UTC)

**What it does**:
1. Checks out the repository
2. Installs Node.js dependencies
3. Runs data collection scripts
4. Generates daily update using Claude API
5. Validates frontmatter format
6. Commits and pushes update to main branch
7. Triggers Netlify rebuild (automatic via git push)

## Setup Instructions

### 1. Add GitHub Secrets

The workflow requires the following secrets to be configured:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

**Required:**
- **Name**: `ANTHROPIC_API_KEY`
- **Value**: Your Claude API key from https://console.anthropic.com

**Optional:**
- **Name**: `NOTIFICATION_EMAIL`
- **Value**: Your email address for failure notifications

### 2. Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions", select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

### 3. Test the Workflow

You can manually trigger the workflow to test it:

1. Go to **Actions** tab in your repository
2. Click on **Daily Research Update** workflow
3. Click **Run workflow** → **Run workflow**
4. Monitor the execution in real-time

### 4. Monitor Scheduled Runs

The workflow runs automatically at 9:00 AM PT every day. To monitor:

1. Go to **Actions** tab
2. Look for runs triggered by **schedule**
3. Click on any run to see detailed logs

## Workflow Details

### Schedule

The workflow uses cron syntax to run at specific times:

```yaml
schedule:
  - cron: '0 17 * * *'  # 9am PT (standard time)
```

**Important**: GitHub Actions uses UTC timezone.
- 9:00 AM PT = 5:00 PM UTC (in standard time)
- Adjust for daylight saving time if needed

### Manual Trigger

You can manually trigger the workflow at any time:

```bash
# Using GitHub CLI
gh workflow run daily-update.yml

# Or through the GitHub web UI
# Go to Actions → Daily Research Update → Run workflow
```

### Validation

The workflow includes validation steps to prevent the Jan 20 incident:

1. **File creation check**: Verifies update file was created
2. **Frontmatter validation**: Ensures first line is `---`
3. **Build test**: Runs `npm run build` to catch TypeScript errors (TODO)

### Error Handling

If the workflow fails:
1. GitHub will send an email notification (if configured)
2. Check the Actions tab for error logs
3. Review the specific step that failed
4. Fix the issue and re-run the workflow

## Troubleshooting

### Workflow doesn't run at scheduled time

**Possible causes:**
- GitHub Actions has occasional delays (up to 15 minutes)
- Repository is private and out of Actions minutes
- Workflow is disabled in repository settings

**Solutions:**
- Wait a few extra minutes for delayed execution
- Check **Settings** → **Actions** to ensure workflows are enabled
- Manually trigger the workflow to test

### Commits fail with permission error

**Error**: `Permission denied (publickey)` or `403 Forbidden`

**Solution:**
1. Go to **Settings** → **Actions** → **General**
2. Enable "Read and write permissions"
3. Save and re-run the workflow

### API key error

**Error**: `ANTHROPIC_API_KEY not set` or `API request failed`

**Solutions:**
1. Verify secret is named exactly `ANTHROPIC_API_KEY`
2. Check that the API key is valid at https://console.anthropic.com
3. Ensure the key has sufficient credits

### Update file not created

**Possible causes:**
- Synthesis script failed
- No data collected from sources
- Output directory doesn't exist

**Debug steps:**
1. Check workflow logs for script errors
2. Look for `updates/daily/YYYY/YYYY-MM-DD.md` in the commit
3. Review the data collection step output

### Frontmatter validation fails

**Error**: `File does not start with frontmatter delimiter '---'`

**Cause**: The synthesis script created a file with content before frontmatter

**Solution:**
1. Update the synthesis script to ensure frontmatter is first
2. Check the prompt template in `scripts/synthesize-daily-update.js`
3. Verify the Claude API response includes proper formatting

## Monitoring & Alerts

### GitHub Actions Email Notifications

GitHub automatically sends email notifications when:
- A workflow fails (if you're watching the repository)
- A scheduled workflow fails repeatedly

To enable:
1. Go to **Settings** → **Notifications**
2. Enable "Actions" under "Email notification preferences"

### Custom Notifications

To add custom email notifications on failure:
1. Add `NOTIFICATION_EMAIL` secret
2. Modify the workflow to use a notification service (e.g., SendGrid, Mailgun)
3. Update the "Send notification on failure" step

## Comparison: GitHub Actions vs Netlify Functions vs Local Cron

| Feature | GitHub Actions | Netlify Functions | Local Cron |
|---------|---------------|-------------------|------------|
| **Reliability** | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐⭐ High | ⭐⭐ Low (computer must be on) |
| **Setup Complexity** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Complex | ⭐⭐ Easy |
| **Cost** | Free (public repos) | Uses build minutes | Free |
| **Git Integration** | ⭐⭐⭐⭐⭐ Native | ⭐⭐⭐ API required | ⭐⭐⭐⭐ Local git |
| **Debugging** | ⭐⭐⭐⭐⭐ Excellent logs | ⭐⭐⭐ Good logs | ⭐⭐ Manual logging |
| **Monitoring** | ⭐⭐⭐⭐ Built-in UI | ⭐⭐⭐ Netlify UI | ⭐ Manual checks |

**Recommendation**: GitHub Actions is the best choice for this project.

## Next Steps

1. ✅ Add `ANTHROPIC_API_KEY` to GitHub Secrets
2. ✅ Enable workflow permissions
3. ✅ Test with manual trigger
4. ⏳ Monitor first scheduled run
5. ⏳ Set up email notifications for failures

## Files Modified by This Workflow

The workflow modifies:
- `updates/daily/YYYY/YYYY-MM-DD.md` - Created daily
- `.git/` - Commits and pushes changes

The workflow does NOT modify:
- Source code
- Configuration files
- Other content files
