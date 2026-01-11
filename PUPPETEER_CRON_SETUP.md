# Getting Puppeteer to Work in Cron on macOS

## The Problem

Puppeteer fails in cron because macOS blocks browser processes launched from background processes. The error is:
```
ERROR:third_party/crashpad/crashpad/util/mac/xattr.cc:41] getxattr size org.chromium.crashpad.database.initialized...Operation not permitted (1)
```

This happens because:
1. macOS security restricts what cron can do
2. Puppeteer's Chrome needs to access crashpad (crash reporting)
3. Cron doesn't have the necessary permissions

## Solution: Multi-Step Approach

### Step 1: Grant Full Disk Access to Cron (Required)

**This is the critical step that usually fixes it:**

1. Open **System Settings** (or System Preferences on older macOS)
2. Go to **Privacy & Security** > **Privacy**
3. Select **Full Disk Access** from the sidebar
4. Click the **+** button (or lock icon to unlock if needed)
5. Press `Command + Shift + G` to open "Go to Folder"
6. Type: `/usr/sbin`
7. Select the `cron` executable
8. Click **Open** to add it

**Restart cron** after granting permissions:
```bash
sudo launchctl stop com.apple.cron
sudo launchctl start com.apple.cron
```

Or just restart your Mac (easiest way to ensure cron picks up new permissions).

### Step 2: Update Puppeteer Launch Options

Add these additional flags to disable crashpad entirely (the source of the permission error):

```javascript
const launchOptions = {
  headless: true,
  userDataDir: userDataDir,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    
    // CRITICAL: Disable crashpad completely
    '--disable-crash-reporter',
    '--disable-breakpad',
    '--disable-background-networking',
    '--no-crash-upload',
    
    // Additional flags for restricted environments
    '--disable-software-rasterizer',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-pings',
    '--no-zygote',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-default-apps',
    '--disable-sync',
    '--metrics-recording-only',
    '--mute-audio',
    '--disable-background-downloads',
    '--disable-client-side-phishing-detection',
    '--disable-hang-monitor',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-translate',
    '--disable-web-resources',
    '--safebrowsing-disable-auto-update',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
  ],
  ignoreHTTPSErrors: true,
};
```

### Step 3: Update Cron Job with Proper Environment

Update your crontab to include necessary environment variables:

```bash
crontab -e
```

Add environment variables at the top:
```bash
PATH=/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin
HOME=/Users/madisonford
SHELL=/bin/bash
USER=madisonford

# Daily Research Data Collection - runs at 9 AM every day
0 9 * * * cd /Users/madisonford/Documents/ai-pm-research && /Users/madisonford/Documents/ai-pm-research/scripts/run-daily-research-data-collection.sh > /tmp/daily-research-cron-$(date +\%Y-\%m-\%d).log 2>&1
```

**Important:** Make sure to use full paths to `node` in your scripts, or ensure `/usr/local/bin` or `/opt/homebrew/bin` is in the PATH (wherever your Node.js is installed).

### Step 4: Test Cron Environment

Create a test script to verify cron can launch Puppeteer:

```bash
# Create test script
cat > /tmp/test-puppeteer-cron.sh << 'EOF'
#!/bin/bash
cd /Users/madisonford/Documents/ai-pm-research
export PATH=/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin
export HOME=/Users/madisonford

node -e "
const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-crash-reporter',
        '--disable-breakpad',
        '--no-crash-upload',
      ],
    });
    console.log('SUCCESS: Puppeteer launched!');
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error('FAILED:', error.message);
    process.exit(1);
  }
})();
"
EOF

chmod +x /tmp/test-puppeteer-cron.sh

# Test it by running it manually first
/tmp/test-puppeteer-cron.sh

# If that works, add a one-time cron job to test
# (wait 1 minute, then check /tmp/test-cron.log)
echo "* * * * * /tmp/test-puppeteer-cron.sh >> /tmp/test-cron.log 2>&1" | crontab -

# After 2 minutes, check the log
sleep 120
cat /tmp/test-cron.log

# Remove the test cron job
crontab -l | grep -v test-puppeteer-cron | crontab -
```

## Alternative: Use launchd Instead of Cron

If cron still doesn't work after granting Full Disk Access, use launchd (macOS's preferred method):

### Create launchd Plist

```bash
cat > ~/Library/LaunchAgents/com.ai-pm-research.daily-research.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ai-pm-research.daily-research</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/madisonford/Documents/ai-pm-research/scripts/run-daily-research-data-collection.sh</string>
    </array>
    <key>StandardOutPath</key>
    <string>/tmp/daily-research-launchd.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/daily-research-launchd-error.log</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
        <key>HOME</key>
        <string>/Users/madisonford</string>
        <key>USER</key>
        <string>madisonford</string>
    </dict>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
EOF

# Load the launchd job
launchctl load ~/Library/LaunchAgents/com.ai-pm-research.daily-research.plist

# Test it immediately
launchctl start com.ai-pm-research.daily-research

# Check logs
tail -f /tmp/daily-research-launchd.log
tail -f /tmp/daily-research-launchd-error.log
```

### Manage launchd Job

```bash
# Check if it's loaded
launchctl list | grep ai-pm-research

# Unload (to disable)
launchctl unload ~/Library/LaunchAgents/com.ai-pm-research.daily-research.plist

# Reload (after making changes)
launchctl unload ~/Library/LaunchAgents/com.ai-pm-research.daily-research.plist
launchctl load ~/Library/LaunchAgents/com.ai-pm-research.daily-research.plist
```

## Verify Node.js Path in Scripts

Make sure your scripts use the full path to `node`, or the PATH in cron includes it:

```bash
# Find where node is installed
which node
# Output might be: /usr/local/bin/node or /opt/homebrew/bin/node

# Update your scripts to use full path, or ensure PATH is set in crontab
```

## Troubleshooting

### Check if Cron is Running

```bash
# macOS
sudo launchctl list | grep cron

# Check cron logs
grep CRON /var/log/system.log
```

### Check Logs

```bash
# Your cron job log
cat /tmp/daily-research-cron-$(date +%Y-%m-%d).log

# System logs
log show --predicate 'subsystem == "com.apple.cron"' --last 1h
```

### Common Issues

1. **"node: command not found"**
   - Add full path to node or set PATH in crontab

2. **"Cannot find module 'puppeteer'"**
   - Make sure script changes to project directory before running
   - Or install puppeteer globally (not recommended)

3. **Still getting permission errors**
   - Restart Mac after granting Full Disk Access
   - Try launchd instead of cron
   - Check System Settings > Privacy & Security for any new permission prompts

## Recommended Order of Attempts

1. **First:** Grant Full Disk Access to cron (Step 1) + update Puppeteer flags (Step 2)
2. **If that fails:** Update cron environment variables (Step 3)
3. **If still failing:** Switch to launchd (Alternative solution)
4. **Last resort:** Run script manually or use CI/CD

## Testing Checklist

- [ ] Granted Full Disk Access to cron in System Settings
- [ ] Restarted cron or Mac
- [ ] Updated Puppeteer launch options with crashpad flags disabled
- [ ] Updated crontab with PATH and environment variables
- [ ] Tested script manually - works?
- [ ] Tested via cron/launchd - works?
- [ ] Checked logs for errors

## Next Steps

After getting it working:
1. Monitor logs for a few days
2. Set up log rotation if logs get large
3. Consider adding error notifications (email, Slack, etc.)
