#!/bin/bash
# Daily Research Data Collection Script
# Collects all data needed for daily research update
# Output saved to /tmp/daily-research-YYYY-MM-DD.txt

set -e

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Set environment variables to disable Chrome crashpad (avoids permission issues)
export CHROME_CRASHPAD_HANDLER_PATH=""
export GOOGLE_CHROME_CRASHPAD_HANDLER_PATH=""

# Get today's date
TODAY=$(date +%Y-%m-%d)
OUTPUT_FILE="/tmp/daily-research-${TODAY}.txt"

echo "=========================================="
echo "Daily Research Data Collection"
echo "Date: ${TODAY}"
echo "Output: ${OUTPUT_FILE}"
echo "=========================================="
echo ""

# Create output file
cat > "$OUTPUT_FILE" << EOF
# Daily Research Data Collection
# Date: ${TODAY}
# Generated: $(date)

This file contains all collected data for today's research update.
Use this data with the research prompt in tooling/prompts/daily-research.md

==========================================
EOF

# Section 1: People Activity
echo "Collecting people activity data..."
echo "" >> "$OUTPUT_FILE"
echo "## People Activity (Last 14 Days)" >> "$OUTPUT_FILE"
echo "==========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

node scripts/check-people-activity.js --days 14 --format markdown >> "$OUTPUT_FILE" 2>&1 || {
    echo "ERROR: Failed to collect people activity data" >> "$OUTPUT_FILE"
    echo "Continuing with other data sources..."
}

echo "" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Section 2: Company Updates
echo "Collecting company updates..."
echo "" >> "$OUTPUT_FILE"
echo "## Company Updates (Last 14 Days)" >> "$OUTPUT_FILE"
echo "==========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

node scripts/check-company-updates.js --days 14 --format markdown >> "$OUTPUT_FILE" 2>&1 || {
    echo "ERROR: Failed to collect company updates" >> "$OUTPUT_FILE"
    echo "Continuing..."
}

echo "" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Section 3: Research Prompt Reference
echo "Adding research prompt reference..."
CURRENT_YEAR=$(date +%Y)
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_DATETIME=$(date)

cat >> "$OUTPUT_FILE" << EOF

==========================================
## Research Prompt Reference
==========================================

See: tooling/prompts/daily-research.md for complete research prompt and guidelines.

Key requirements:
- Maximum 3-5 items per day
- Must meet all quality criteria from context/prefs.md
- Output format: updates/daily/${CURRENT_YEAR}/${CURRENT_DATE}.md
- Include reflection challenge at end

Context files:
- context/companies.md - Tracked companies
- context/people.md - Tracked people
- context/prefs.md - Quality bars and filters
- context/open-questions.md - Questions to watch for

==========================================
## Next Steps
==========================================

1. Review the data above
2. In Cursor, open this file and use the research prompt
3. Generate the daily update file: updates/daily/${CURRENT_YEAR}/${CURRENT_DATE}.md
4. Review and commit the file

Generated: ${CURRENT_DATETIME}
EOF

echo ""
echo "✅ Data collection complete!"
echo "📄 Output saved to: ${OUTPUT_FILE}"
echo ""

# Synthesize the daily update using Claude API
echo "=========================================="
echo "Synthesizing Daily Update with Claude"
echo "=========================================="
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set - skipping synthesis"
    echo ""
    echo "To enable automatic synthesis:"
    echo "  1. Get your API key from https://console.anthropic.com/"
    echo "  2. Export it: export ANTHROPIC_API_KEY='your-key-here'"
    echo "  3. Or add to ~/.zshrc or ~/.bashrc for persistence"
    echo ""
    echo "Manual synthesis:"
    echo "  cursor ${OUTPUT_FILE}"
    echo ""
else
    # Run synthesis script
    node "${SCRIPT_DIR}/synthesize-daily-update.js"
    SYNTHESIS_EXIT_CODE=$?
fi

# Send email notification if configured (only works locally with Gmail OAuth setup)
if [ -n "$NOTIFICATION_EMAIL" ] && [ -f "${SCRIPT_DIR}/../.gmail-credentials.json" ]; then
    echo ""
    echo "=========================================="
    echo "Sending Email Notification"
    echo "=========================================="
    echo ""

    if [ $SYNTHESIS_EXIT_CODE -eq 0 ] || [ -z "$ANTHROPIC_API_KEY" ]; then
        node "${SCRIPT_DIR}/send-email-notification.js" \
            --status=success \
            --date="${TODAY}" \
            --log="/tmp/daily-research-cron-${TODAY}.log"
    else
        node "${SCRIPT_DIR}/send-email-notification.js" \
            --status=failed \
            --date="${TODAY}" \
            --log="/tmp/daily-research-cron-${TODAY}.log"
    fi
else
    echo ""
    echo "📧 Gmail notifications not configured (GitHub Actions uses workflow email instead)"
    echo "   Local setup: Run scripts/setup-gmail-notifications.js"
    echo ""
fi
