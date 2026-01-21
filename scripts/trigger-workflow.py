#!/usr/bin/env python3
"""
Trigger GitHub Actions workflow via API
Simpler alternative to the bash script
"""

import os
import sys
import requests

def trigger_workflow():
    """Trigger the daily-update workflow"""

    # Get GitHub token from environment
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("❌ ERROR: GITHUB_TOKEN not set")
        print()
        print("To trigger the workflow, you need a GitHub Personal Access Token.")
        print()
        print("Quick setup:")
        print("1. Go to: https://github.com/settings/tokens")
        print("2. Click 'Generate new token (classic)'")
        print("3. Give it a name: 'Trigger Workflows'")
        print("4. Select scopes: 'repo' and 'workflow'")
        print("5. Click 'Generate token'")
        print("6. Copy the token and run:")
        print("   export GITHUB_TOKEN='your-token-here'")
        print("   python3 scripts/trigger-workflow.py")
        print()
        sys.exit(1)

    # API endpoint
    url = "https://api.github.com/repos/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml/dispatches"

    # Headers
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {token}",
    }

    # Payload
    data = {"ref": "main"}

    print("=" * 50)
    print("Triggering GitHub Actions Workflow")
    print("=" * 50)
    print()
    print("Workflow: Daily Research Update")
    print("Repository: madsford22-coder/ai-pm-research")
    print("Branch: main")
    print()

    # Make request
    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 204:
        print("✅ Workflow triggered successfully!")
        print()
        print("View the run at:")
        print("https://github.com/madsford22-coder/ai-pm-research/actions/workflows/daily-update.yml")
        print()
    else:
        print(f"❌ Error triggering workflow (status {response.status_code}):")
        print(response.text)
        print()
        sys.exit(1)

if __name__ == "__main__":
    trigger_workflow()
