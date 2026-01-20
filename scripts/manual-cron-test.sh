#!/bin/bash
# Manual test of the cron job - runs the full script like cron would

set -e

echo "=========================================="
echo "Manual Cron Job Test"
echo "=========================================="
echo ""
echo "This will run the full cron job script to test it works."
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

# Set environment variables (like cron does)
export ANTHROPIC_API_KEY='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'
export NOTIFICATION_EMAIL='madsford22@gmail.com'

# Set minimal PATH like cron (though the script sets it)
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin

echo "Running cron job script..."
echo "This may take several minutes..."
echo ""

# Run the script with output to log file (like cron does)
TODAY=$(date +%Y-%m-%d)
LOG_FILE="/tmp/daily-research-cron-test-${TODAY}.log"

echo "Log file: $LOG_FILE"
echo ""

# Run the script and save output
./scripts/run-daily-research-data-collection.sh > "$LOG_FILE" 2>&1
EXIT_CODE=$?

echo ""
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Script completed successfully!"
else
    echo "❌ Script failed with exit code: $EXIT_CODE"
fi
echo "=========================================="
echo ""

# Show last 30 lines of log
echo "Last 30 lines of log:"
echo "----------------------------------------"
tail -30 "$LOG_FILE"
echo "----------------------------------------"
echo ""

# Check output file
TODAY=$(date +%Y-%m-%d)
OUTPUT_FILE="/tmp/daily-research-${TODAY}.txt"
if [ -f "$OUTPUT_FILE" ]; then
    echo "✅ Output file created: $OUTPUT_FILE"
    echo "   Size: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
    echo ""
    echo "First 20 lines:"
    head -20 "$OUTPUT_FILE"
else
    echo "⚠️  Output file not found: $OUTPUT_FILE"
fi
echo ""

# Check if daily update was generated
DAILY_UPDATE_DIR="$PROJECT_ROOT/updates/daily/$(date +%Y)"
DAILY_UPDATE_FILE="$DAILY_UPDATE_DIR/$(date +%Y-%m-%d).md"
if [ -f "$DAILY_UPDATE_FILE" ]; then
    echo "✅ Daily update generated: $DAILY_UPDATE_FILE"
    echo "   Size: $(ls -lh "$DAILY_UPDATE_FILE" | awk '{print $5}')"
else
    echo "⚠️  Daily update not generated (may require API key or failed)"
fi
echo ""

echo "Full log available at: $LOG_FILE"
echo ""
