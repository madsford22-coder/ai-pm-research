#!/bin/bash
# Trigger GitHub Actions workflow manually via API

set -e

echo "=========================================="
echo "Triggering GitHub Actions Workflow"
echo "=========================================="
echo ""

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ ERROR: GITHUB_TOKEN not set"
    echo ""
    echo "To trigger the workflow via API, you need a GitHub Personal Access Token."
    echo ""
    echo "Quick setup:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Give it a name: 'Trigger Workflows'"
    echo "4. Select scopes: 'repo' and 'workflow'"
    echo "5. Click 'Generate token'"
    echo "6. Copy the token and run:"
    echo "   export GITHUB_TOKEN='your-token-here'"
    echo ""
    echo "Or just use the GitHub web UI:"
    echo "https://github.com/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml"
    echo ""
    exit 1
fi

echo "Triggering workflow: Daily Research Update"
echo "Repository: madsford22-coder/ai-pm-research"
echo "Branch: main"
echo ""

# Trigger the workflow
RESPONSE=$(curl -s -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml/dispatches \
  -d '{"ref":"main"}')

# Check response
if [ -z "$RESPONSE" ]; then
    echo "✅ Workflow triggered successfully!"
    echo ""
    echo "View the run at:"
    echo "https://github.com/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml"
    echo ""
else
    echo "❌ Error triggering workflow:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    echo ""
    exit 1
fi
