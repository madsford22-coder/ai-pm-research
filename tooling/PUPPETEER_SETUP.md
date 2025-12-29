# Puppeteer Setup and Troubleshooting

This document explains how to ensure Puppeteer works correctly for all scripts that use it.

## Scripts Using Puppeteer

Puppeteer is used by several scripts in this project:

1. **Company Updates** (`scripts/check-company-updates.js`) - Checks RSS feeds and changelogs from tracked companies
2. **People Activity** (`scripts/check-people-activity.js`) - Checks RSS feeds, blogs, LinkedIn, and Twitter/X posts from tracked people
3. **Company News** (`scripts/check-company-news.js`) - Searches for news mentions of tracked companies
4. **Find RSS Feeds** (`scripts/find-rss-feeds.js`) - Discovers RSS feeds for people's blogs

## Quick Fix

If Puppeteer fails to launch, the script now includes better error handling and additional launch flags. However, if you're running in a sandboxed environment (like Cursor's AI assistant), you may need to run with full permissions.

## Running the Scripts

### From Command Line

```bash
# From project root - all scripts use the same Puppeteer setup
node scripts/check-company-updates.js
node scripts/check-people-activity.js
node scripts/check-company-news.js
node scripts/find-rss-feeds.js

# Or from tooling directory (legacy scripts)
cd tooling && node check-company-updates.js
cd tooling && node check-people-activity.js
```

### In Sandboxed Environments

If running in a sandboxed environment (like Cursor), ensure the script has:
- Network access permissions
- File system write access to temp directory  
- Ability to launch browser processes

The script will automatically use Puppeteer's bundled Chromium, which should work in most environments.

## Common Issues

### Browser Launch Fails

**Error:** `Failed to launch the browser process`

**Solutions:**
1. Ensure Puppeteer is installed: `cd tooling && npm install`
2. Check that you have write permissions to the temp directory
3. If running in a sandbox, ensure full permissions are granted
4. Try running with `--no-sandbox` flag (already included in script)

### Certificate Errors

**Error:** `error setting certificate verify locations`

**Solution:** The script now includes `ignoreHTTPSErrors: true` to handle certificate issues in development environments.

### Permission Errors

**Error:** `Operation not permitted`

**Solution:** The script uses a temporary user data directory. If you see permission errors, ensure:
- The temp directory is writable
- You're not running as a restricted user
- In sandboxed environments, full permissions may be required

## Launch Options

The script uses optimized launch options for sandboxed environments:

- `--no-sandbox`: Disables Chrome sandbox (required in some environments)
- `--disable-setuid-sandbox`: Additional sandbox disable
- `--disable-dev-shm-usage`: Prevents shared memory issues
- `ignoreHTTPSErrors: true`: Handles certificate issues

These options are automatically applied and should work in most environments.

## Testing

To test if Puppeteer is working:

```bash
cd tooling
node -e "const puppeteer = require('puppeteer'); puppeteer.launch({headless: true, args: ['--no-sandbox']}).then(b => {console.log('✓ Puppeteer works!'); b.close();}).catch(e => console.error('✗ Error:', e.message));"
```

If this test passes, all Puppeteer-based scripts should work.

## What Each Script Does

- **check-company-updates.js**: Scrapes company blogs and changelogs for product updates
- **check-people-activity.js**: Checks RSS feeds, scrapes blogs, LinkedIn, and Twitter/X for posts from tracked people
- **check-company-news.js**: Searches news sources for mentions of tracked companies
- **find-rss-feeds.js**: Visits blog URLs to discover RSS feed links

## Dependencies

- Node.js >= 16.0.0
- Puppeteer (installed via `npm install` in `tooling/` directory)

## Notes

- The script uses Puppeteer's bundled Chromium, so you don't need Chrome installed
- A temporary user data directory is created and cleaned up automatically
- The script includes delays between requests to be polite to servers

