#!/bin/bash
# Setup script for daily research automation cron job

echo "Setting up daily research automation cron job..."
echo ""

# Check if crontab already exists
EXISTING_CRON=$(crontab -l 2>/dev/null | grep "run-daily-research-data-collection.sh" || true)

if [ -n "$EXISTING_CRON" ]; then
    echo "⚠️  Found existing cron job:"
    echo "$EXISTING_CRON"
    echo ""
    read -p "Do you want to replace it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing cron job. Exiting."
        exit 0
    fi
fi

# Get the project directory
PROJECT_DIR="/Users/madisonford/Documents/ai-pm-research"
SCRIPT_PATH="$PROJECT_DIR/scripts/run-daily-research-data-collection.sh"

# Verify script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: Script not found at $SCRIPT_PATH"
    exit 1
fi

# Verify script is executable
if [ ! -x "$SCRIPT_PATH" ]; then
    echo "Making script executable..."
    chmod +x "$SCRIPT_PATH"
fi

# Create temporary crontab file
TEMP_CRON=$(mktemp)

# Save existing crontab (if any)
crontab -l 2>/dev/null > "$TEMP_CRON" || touch "$TEMP_CRON"

# Remove any existing daily research cron entries
grep -v "run-daily-research-data-collection.sh" "$TEMP_CRON" > "$TEMP_CRON.new" || true
mv "$TEMP_CRON.new" "$TEMP_CRON"

# Add the new cron job (runs at 9 AM daily)
echo "" >> "$TEMP_CRON"
echo "# Daily Research Data Collection - runs at 9 AM every day" >> "$TEMP_CRON"
echo "0 9 * * * cd $PROJECT_DIR && $SCRIPT_PATH > /tmp/daily-research-cron-\$(date +\\%Y-\\%m-\\%d).log 2>&1" >> "$TEMP_CRON"

# Install the new crontab
crontab "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo "✅ Cron job installed successfully!"
echo ""
echo "Schedule: Daily at 9:00 AM"
echo "Output: /tmp/daily-research-YYYY-MM-DD.txt"
echo "Logs: /tmp/daily-research-cron-YYYY-MM-DD.log"
echo ""
echo "To verify, run: crontab -l"
echo "To remove, run: crontab -e (then delete the line)"
