#!/bin/bash
# Update crontab to include email notifications
# This script adds environment variables to your cron job

set -e

echo "Updating crontab with email notification support..."
echo ""

# Get the current .env values
if [ -f ".env" ]; then
    source .env
else
    echo "❌ .env file not found!"
    echo "Create .env file with:"
    echo "  ANTHROPIC_API_KEY=your-key"
    echo "  NOTIFICATION_EMAIL=your-email@gmail.com"
    exit 1
fi

# Check required variables
if [ -z "$NOTIFICATION_EMAIL" ]; then
    echo "❌ NOTIFICATION_EMAIL not set in .env file"
    exit 1
fi

# Create new crontab entry with environment variables
CRON_ENTRY="0 9 * * * export ANTHROPIC_API_KEY='${ANTHROPIC_API_KEY}' && export NOTIFICATION_EMAIL='${NOTIFICATION_EMAIL}' && cd \"/Users/madisonford/Documents/ai-pm-research\" && \"/Users/madisonford/Documents/ai-pm-research/scripts/run-daily-research-data-collection.sh\" > /tmp/daily-research-cron-\$(date +\\%Y-\\%m-\\%d).log 2>&1"

# Show the new entry
echo "New cron job entry:"
echo "---"
echo "$CRON_ENTRY"
echo "---"
echo ""

# Backup current crontab
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M%S).txt 2>/dev/null || true
echo "✅ Backed up current crontab to /tmp/crontab-backup-*.txt"

# Remove old daily-research entry and add new one
(crontab -l 2>/dev/null | grep -v "daily-research-data-collection.sh"; echo "$CRON_ENTRY") | crontab -

echo "✅ Crontab updated successfully!"
echo ""
echo "Your daily research script will now:"
echo "  - Run at 9:00 AM every day"
echo "  - Collect data from tracked sources"
echo "  - Generate daily update using Claude API"
echo "  - Send email notification to: ${NOTIFICATION_EMAIL}"
echo ""
echo "To verify: crontab -l"
