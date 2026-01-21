# How to Manually Run the GitHub Actions Workflow

## Method 1: GitHub Web UI (Easiest)

### Step-by-Step with Screenshots:

1. **Go to the workflow page:**
   - Open: https://github.com/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml
   - OR navigate: Repository → Actions tab → "Daily Research Update" (in left sidebar)

2. **Find the "Run workflow" button:**
   - It's a blue/green button on the right side of the page
   - Located near the top, next to the search box that says "Filter workflow runs"
   - If you don't see it, try:
     - Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
     - Make sure you're viewing the workflow page, not a specific run
     - Check that you're logged into GitHub

3. **Click the button:**
   - Click "Run workflow" dropdown
   - Ensure "Branch: main" is selected
   - Click the green "Run workflow" button

4. **Watch it run:**
   - The page will refresh and show a new workflow run
   - Click on it to see real-time logs
   - It takes about 2-3 minutes to complete

## Method 2: Using GitHub CLI (If Installed)

If you have `gh` CLI installed:

```bash
gh workflow run daily-update.yml
```

To install GitHub CLI:
- Mac: `brew install gh`
- Or download from: https://cli.github.com/

## Method 3: Using API with Personal Access Token

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Name: "Trigger Workflows"
   - Select scopes: `repo` and `workflow`
   - Click "Generate token"
   - Copy the token

2. **Run the trigger script:**
   ```bash
   export GITHUB_TOKEN='your-token-here'
   ./scripts/trigger-github-workflow.sh
   ```

## Method 4: Test Locally First

If you want to test the workflow logic locally before running on GitHub:

```bash
export ANTHROPIC_API_KEY='your-api-key-here'
./scripts/test-github-workflow-locally.sh
```

This will:
- Run the same data collection and synthesis
- Create the update file locally
- Validate frontmatter format
- Show you a preview

Then you can manually commit:
```bash
git add updates/daily/
git commit -m "Add daily research update for $(date +%Y-%m-%d)"
git push origin main
```

## Troubleshooting

### "Run workflow" button not visible

**Possible causes:**
1. Page not refreshed - Try Cmd+Shift+R (hard refresh)
2. Viewing a specific run instead of the workflow - Navigate back to the workflow page
3. Workflow file syntax error - Check the Actions tab for any errors

**Quick fix:**
- Go directly to: https://github.com/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml
- Hard refresh (Cmd+Shift+R)

### Workflow fails with "Bad credentials"

This means the `ANTHROPIC_API_KEY` secret isn't set correctly.

**Fix:**
1. Go to: https://github.com/madsford22-coder/ai-pm-research/settings/secrets/actions
2. Check that `ANTHROPIC_API_KEY` is listed
3. If not, add it with your Claude API key

### Workflow fails with "Permission denied"

This means GitHub Actions doesn't have write permissions.

**Fix:**
1. Go to: https://github.com/madsford22-coder/ai-pm-research/settings/actions
2. Under "Workflow permissions", select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"
4. Click Save

## What Happens When Workflow Runs

1. ✅ Checks out repository
2. ✅ Installs Node.js dependencies
3. ✅ Runs data collection scripts
4. ✅ Generates daily update using Claude API
5. ✅ Validates frontmatter format
6. ✅ Commits update file to repository
7. ✅ Pushes to GitHub
8. ✅ Netlify automatically rebuilds site

Total time: ~2-3 minutes

## Expected Output

After successful run:
- New file created: `updates/daily/2026/2026-01-20.md`
- Commit pushed to main branch
- Netlify build triggered
- Site updates with new content in ~3-5 minutes

## Need Help?

If you're still having trouble:
1. Take a screenshot of what you see at: https://github.com/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml
2. Check the Actions tab for any error messages
3. Try the local test script first to verify everything works
