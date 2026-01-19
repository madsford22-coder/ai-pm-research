# Cron Job Troubleshooting Guide

## Issue: Cron Job Not Running (January 11, 2026)

### Problem Summary

The daily research data collection cron job is installed but failing to execute. The cron job runs at 9 AM daily but is failing because Puppeteer cannot launch the browser in the macOS cron environment due to security restrictions.

### Root Cause

**macOS Security Restrictions Blocking Puppeteer:**
- macOS blocks browser processes launched from cron due to security policies
- Puppeteer attempts to launch Chrome/Chromium but fails with permission errors
- The cron environment has a minimal PATH and doesn't have access to user's security permissions
- Browser crashpad (crash reporting) requires filesystem permissions that cron doesn't have

### Error Symptoms

When the cron job runs, you'll see errors like:
```
Failed to launch the browser process: Code: null
ERROR:third_party/crashpad/crashpad/util/mac/xattr.cc:41] getxattr size org.chromium.crashpad.database.initialized on file...Operation not permitted (1)
```

### Verification Steps

1. **Check if cron job is installed:**
   ```bash
   crontab -l
   ```
   Should show:
   ```
   0 9 * * * cd /Users/madisonford/Documents/ai-pm-research && /Users/madisonford/Documents/ai-pm-research/scripts/run-daily-research-data-collection.sh > /tmp/daily-research-cron-$(date +\%Y-\%m-\%d).log 2>&1
   ```

2. **Check if cron job ran (look for log file):**
   ```bash
   ls -la /tmp/daily-research-cron-*.log
   ```
   If no log file exists, cron didn't run or failed before writing output.

3. **Test the script manually:**
   ```bash
   cd /Users/madisonford/Documents/ai-pm-research
   ./scripts/run-daily-research-data-collection.sh
   ```
   If this works manually but fails in cron, it's an environment/permissions issue.

4. **Check cron service status (macOS):**
   ```bash
   sudo launchctl list | grep cron
   ```
   Or check system logs:
   ```bash
   grep CRON /var/log/system.log
   ```

## Solutions

### Solution 1: Use launchd Instead of cron (Recommended for macOS)

macOS prefers `launchd` over cron. Create a launchd plist file:

1. **Create the plist file:**
   ```bash
   nano ~/Library/LaunchAgents/com.ai-pm-research.daily-research.plist
   ```

2. **Add this content:**
   ```xml
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
       <string>/tmp/daily-research-launchd-$(date +\%Y-\%m-\%d).log</string>
       <key>StandardErrorPath</key>
       <string>/tmp/daily-research-launchd-$(date +\%Y-\%m-\%d).log</string>
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
   </dict>
   </plist>
   ```

3. **Load the launchd job:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.ai-pm-research.daily-research.plist
   ```

4. **Verify it's loaded:**
   ```bash
   launchctl list | grep ai-pm-research
   ```

5. **Test run it:**
   ```bash
   launchctl start com.ai-pm-research.daily-research
   ```

**Note:** launchd still may have permission issues with Puppeteer. See Solution 2 below.

### Solution 2: Modify Scripts to Use HTTP Fetch Instead of Puppeteer for RSS

The core issue is that Puppeteer requires browser launch, which cron/launchd can't do. For RSS feeds, we don't need a browser - we can use HTTP fetch.

**Option A: Modify RSS Adapter to Support Node Fetch**

1. Update `src/adapters/rss.js` to support both Puppeteer and fetch:
   ```javascript
   const https = require('https');
   const http = require('http');
   
   async function fetchRSSFeedHTTP(feedUrl, options = {}) {
     return new Promise((resolve, reject) => {
       const url = new URL(feedUrl);
       const client = url.protocol === 'https:' ? https : http;
       
       client.get(feedUrl, (res) => {
         let data = '';
         res.on('data', (chunk) => { data += chunk; });
         res.on('end', () => {
           const { posts, error } = parseRSSFeed(data, options);
           resolve({ posts, error });
         });
       }).on('error', (error) => {
         resolve({ posts: [], error: error.message });
       });
     });
   }
   ```

2. Update pipelines to use HTTP fetch when Puppeteer fails:
   - Try Puppeteer first
   - Fall back to HTTP fetch if Puppeteer fails
   - For RSS feeds, HTTP fetch should work for most sources

**Option B: Create a Separate RSS-Only Script**

Create `scripts/check-rss-feeds-only.sh` that:
- Only checks RSS feeds (doesn't need Puppeteer)
- Uses curl or Node fetch to get RSS XML
- Parses RSS feeds directly
- Skips blog scraping and social media scraping (which require Puppeteer)

Then update cron/launchd to use this script instead.

### Solution 3: Run Script as User Agent Instead of Cron

Instead of running in background, have the script run with user permissions:

1. **Use a GUI automation tool like Keyboard Maestro or Hazel** to:
   - Run the script at 9 AM
   - Run it with user permissions
   - Handle errors and notifications

2. **Or use macOS Calendar with AppleScript:**
   - Create a recurring calendar event at 9 AM
   - Attach an AppleScript that runs the bash script
   - AppleScript runs with user permissions

### Solution 4: Grant Additional Permissions to Terminal/Cron

This may require disabling some macOS security features:

1. **Grant Full Disk Access to Terminal:**
   - System Settings > Privacy & Security > Full Disk Access
   - Add Terminal.app (or the terminal you use)

2. **Grant Automation Permissions:**
   - System Settings > Privacy & Security > Automation
   - Allow cron/Terminal to control other apps if needed

**Warning:** This reduces security and may not fully solve the issue.

### Solution 5: Run Script from Remote Server or CI/CD

If local automation is too difficult:

1. **Use a remote Linux server** where cron works better
2. **Use GitHub Actions** with a scheduled workflow (cron syntax)
3. **Use a cloud cron service** like EasyCron or cron-job.org

These environments typically don't have the same browser launch restrictions.

## Recommended Approach

**Immediate Fix:** Use Solution 2 (HTTP Fetch for RSS) + Solution 1 (launchd)

1. Modify the RSS adapter to support HTTP fetch as fallback
2. Switch from cron to launchd for better macOS integration
3. For sources that require Puppeteer (blogs without RSS, LinkedIn, Twitter), either:
   - Skip them in automated runs
   - Create a separate manual script
   - Use API alternatives when available

**Long-term:** Consider Solution 5 (CI/CD) if local automation continues to be problematic.

## Testing Your Fix

1. **Remove the cron job:**
   ```bash
   crontab -e
   # Delete the line with daily-research
   ```

2. **Test the modified script manually:**
   ```bash
   ./scripts/run-daily-research-data-collection.sh
   ```

3. **Verify it works without Puppeteer errors**

4. **Set up launchd or your chosen solution**

5. **Monitor logs for a few days to ensure it's working**

## Related Files

- `scripts/run-daily-research-data-collection.sh` - Main collection script
- `scripts/setup-cron.sh` - Cron setup script (needs update)
- `src/adapters/rss.js` - RSS fetching adapter (needs HTTP fallback)
- `src/pipelines/people-activity.js` - People activity pipeline
- `src/pipelines/company-updates.js` - Company updates pipeline

## Additional Resources

- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
- [macOS launchd Tutorial](https://www.launchd.info/)
- [Node.js HTTP Module](https://nodejs.org/api/http.html)
