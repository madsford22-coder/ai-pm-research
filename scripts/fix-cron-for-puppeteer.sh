#!/bin/bash
# Quick setup script to fix cron for Puppeteer on macOS

set -e

echo "=========================================="
echo "Puppeteer Cron Setup for macOS"
echo "=========================================="
echo ""

# Step 1: Check if Full Disk Access is needed
echo "Step 1: Full Disk Access Setup"
echo "----------------------------------------"
echo ""
echo "⚠️  CRITICAL: You need to grant Full Disk Access to cron manually."
echo ""
echo "Here's how:"
echo "1. Open System Settings > Privacy & Security > Privacy"
echo "2. Select 'Full Disk Access' from sidebar"
echo "3. Click the '+' button"
echo "4. Press Command+Shift+G to open 'Go to Folder'"
echo "5. Type: /usr/sbin"
echo "6. Select 'cron' executable and click Open"
echo ""
echo "After granting Full Disk Access, restart your Mac or run:"
echo "  sudo launchctl stop com.apple.cron"
echo "  sudo launchctl start com.apple.cron"
echo ""
read -p "Have you granted Full Disk Access to cron? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please grant Full Disk Access first, then run this script again."
    echo ""
    exit 1
fi

# Step 2: Find Node.js path
echo ""
echo "Step 2: Finding Node.js Installation"
echo "----------------------------------------"
NODE_PATH=$(which node 2>/dev/null || echo "/usr/local/bin/node")
if [ ! -f "$NODE_PATH" ]; then
    # Try common locations
    if [ -f "/opt/homebrew/bin/node" ]; then
        NODE_PATH="/opt/homebrew/bin/node"
    elif [ -f "/usr/local/bin/node" ]; then
        NODE_PATH="/usr/local/bin/node"
    else
        echo "❌ Error: Could not find node. Please install Node.js."
        exit 1
    fi
fi

echo "Found Node.js at: $NODE_PATH"
NODE_DIR=$(dirname "$NODE_PATH")

# Step 3: Update crontab with proper environment
echo ""
echo "Step 3: Updating Crontab"
echo "----------------------------------------"

PROJECT_DIR="/Users/madisonford/Documents/ai-pm-research"
SCRIPT_PATH="$PROJECT_DIR/scripts/run-daily-research-data-collection.sh"

# Create temporary crontab file
TEMP_CRON=$(mktemp)

# Save existing crontab (if any), removing old daily-research entries
crontab -l 2>/dev/null | grep -v "run-daily-research-data-collection.sh" | grep -v "^PATH=" | grep -v "^HOME=" | grep -v "^SHELL=" | grep -v "^USER=" > "$TEMP_CRON" || touch "$TEMP_CRON"

# Add environment variables and cron job
cat >> "$TEMP_CRON" << EOF

# Environment variables for Puppeteer/cron
PATH=${NODE_DIR}:/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin
HOME=/Users/madisonford
SHELL=/bin/bash
USER=madisonford
# Disable Chrome crashpad to avoid permission issues
CHROME_CRASHPAD_HANDLER_PATH=""
GOOGLE_CHROME_CRASHPAD_HANDLER_PATH=""

# Daily Research Data Collection - runs at 9 AM every day
0 9 * * * cd "$PROJECT_DIR" && "$SCRIPT_PATH" > /tmp/daily-research-cron-\$(date +\\%Y-\\%m-\\%d).log 2>&1
EOF

# Install the new crontab
crontab "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo "✅ Crontab updated successfully!"
echo ""

# Step 4: Test Puppeteer
echo "Step 4: Testing Puppeteer Launch"
echo "----------------------------------------"
echo ""

cd "$PROJECT_DIR"

TEST_SCRIPT=$(cat << 'TESTEOF'
const puppeteer = require('puppeteer');
(async () => {
  try {
    console.log('Attempting to launch Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-crash-reporter',
        '--disable-breakpad',
        '--no-crash-upload',
        '--disable-dev-shm-usage',
      ],
    });
    console.log('✅ SUCCESS: Puppeteer launched successfully!');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    if (error.message.includes('crashpad') || error.message.includes('Operation not permitted')) {
      console.error('');
      console.error('This error suggests Full Disk Access may not be properly granted.');
      console.error('Try:');
      console.error('1. Restart your Mac');
      console.error('2. Or run: sudo launchctl stop com.apple.cron && sudo launchctl start com.apple.cron');
      console.error('3. Verify cron is in Full Disk Access in System Settings');
    }
    process.exit(1);
  }
})();
TESTEOF
)

if "$NODE_PATH" -e "$TEST_SCRIPT"; then
    echo ""
    echo "✅ Puppeteer test PASSED!"
else
    echo ""
    echo "❌ Puppeteer test FAILED. Check the error above."
    echo ""
    echo "Common fixes:"
    echo "- Make sure you granted Full Disk Access to cron in System Settings"
    echo "- Restart your Mac after granting permissions"
    echo "- Check that Puppeteer is installed: npm list puppeteer (in tooling directory)"
    exit 1
fi

# Step 5: Summary
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Cron job configured to run daily at 9:00 AM"
echo "Logs will be saved to: /tmp/daily-research-cron-YYYY-MM-DD.log"
echo ""
echo "To verify your crontab:"
echo "  crontab -l"
echo ""
echo "To test the cron job manually:"
echo "  $SCRIPT_PATH"
echo ""
echo "To check cron logs:"
echo "  cat /tmp/daily-research-cron-\$(date +%Y-%m-%d).log"
echo ""
echo "To view scheduled jobs:"
echo "  crontab -l"
echo ""
