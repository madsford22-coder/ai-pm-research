# Email Notifications Setup Guide

Get a beautifully formatted email notification each morning with your daily research updates, including full summaries and all discovered items.

## Quick Setup (10 minutes)

### Step 1: Enable Gmail API

1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Click "Enable APIs and Services"
4. Search for "Gmail API" and **enable it** (critical step!)
5. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
6. Choose "Desktop app" as the application type
7. Download the credentials JSON file
8. Save it as `.gmail-credentials.json` in the project root

### Step 2: Run the Setup Script

```bash
# Make sure you have the credentials file
ls .gmail-credentials.json

# Run the setup script
node scripts/setup-gmail-notifications.js
```

This will:
1. Show you an authorization URL
2. Ask you to visit it in your browser
3. Google will redirect you with a code in the URL
4. Copy the code from the URL (everything after `?code=`)
5. Paste it into the terminal
6. Save the token for future use

**Alternative**: If you get the code in a URL, use the quick completion script:
```bash
node scripts/complete-gmail-auth.js "YOUR_CODE_HERE"
```

### Step 3: Configure Environment Variables

Add your settings to `.env` file in the project root:

```bash
# .env file
ANTHROPIC_API_KEY=your-api-key-here
NOTIFICATION_EMAIL=your@gmail.com
```

### Step 4: Update Crontab with Environment Variables

Use the automated script to update your crontab:

```bash
./scripts/update-cron-with-email.sh
```

This will:
- Read your `.env` file
- Update your crontab with the necessary environment variables
- Configure the 9 AM daily run with automatic email notifications

### Step 5: Test It

```bash
# Test with a real date that has a generated file
NOTIFICATION_EMAIL="your@gmail.com" node scripts/send-email-notification.js --status=success --date=2026-01-19
```

Check your email! You should receive a beautifully formatted HTML email with:
- ✅ Properly encoded subject line (emojis display correctly!)
- 📊 Full summary of the day's research
- 📰 Individual cards for each item with titles, authors, and tl;dr
- 📈 Stats showing number of items found
- 📄 Path to generated file

## What the Email Contains

### Success Email
- **Subject**: "✅ Daily Research Complete - YYYY-MM-DD" (with proper emoji encoding)
- **Summary Section**: Full summary paragraph from the daily update
- **Today's Updates**: Individual cards for each research item including:
  - Item title (e.g., "Lenny Rachitsky - Claude Code for Product Managers")
  - Author/source information
  - tl;dr summary
- **Stats Section**:
  - Number of items found
  - Status (Complete)
- **File Location**: Path to the generated markdown file
- **Beautiful HTML formatting** with modern design

### Failure Email
- **Subject**: "❌ Daily Research Failed - YYYY-MM-DD"
- **Error details**: What went wrong
- **Debugging info**: From the log file

## How It Works

The email notification system:
1. **Reads the generated markdown file** automatically
2. **Parses the summary** from the `## Summary` section
3. **Extracts all items** from the `## Items` section
4. **Formats everything beautifully** in HTML
5. **Sends via Gmail API** with proper UTF-8 encoding

No manual configuration needed - it automatically adapts to whatever content is in the daily update!

## Automatic Daily Flow

Every day at 9:00 AM, your system will:
1. ✅ Collect data from tracked sources
2. ✅ Generate daily update using Claude API
3. ✅ Parse the markdown file
4. ✅ Send formatted email with full content
5. ✅ Log everything for debugging

## Troubleshooting

### "Gmail API has not been used in project"
- Go to the URL in the error message
- Click "Enable" button for Gmail API
- Wait a few minutes for it to propagate
- Try sending test email again

### "Credentials file not found"
- Make sure `.gmail-credentials.json` is in the project root
- Re-download from Google Cloud Console if needed

### "Token expired"
- Delete `.gmail-token.json`
- Run `node scripts/setup-gmail-notifications.js` again
- Or use `node scripts/complete-gmail-auth.js "YOUR_CODE"`

### "Subject line has weird characters"
- This is fixed! The script now uses proper UTF-8 base64 encoding
- Emojis in subject lines display correctly

### "Email is empty/bare"
- The script now always reads the generated markdown file
- Make sure the file exists at `updates/daily/YYYY/YYYY-MM-DD.md`
- Check that the file has `## Summary` and `## Items` sections

### "Email not received"
- Check spam folder
- Verify `NOTIFICATION_EMAIL` is set correctly in `.env`
- Check Gmail API is enabled in Google Cloud Console
- Run test command to debug

## Security Notes

- `.gmail-credentials.json` and `.gmail-token.json` are in `.gitignore`
- `.env` file is in `.gitignore` (contains API keys)
- Never commit these files to git
- The token allows sending emails from your Gmail account
- Revoke access anytime in Google Account settings

## Disabling Notifications

To stop receiving emails:

```bash
# Option 1: Remove from .env file
nano .env
# Delete or comment out: NOTIFICATION_EMAIL=your@gmail.com

# Option 2: Update crontab without email
crontab -e
# Remove the NOTIFICATION_EMAIL export from the cron line
```

The scripts will detect the missing email address and skip sending notifications.

## Advanced: Custom Email Format

The email format is defined in `scripts/send-email-notification.js`. The `generateStatusEmail()` function creates the HTML. You can customize:
- Colors (change `statusColor` variable)
- Layout (modify the HTML template)
- Sections (add/remove content blocks)
- Styling (update the `<style>` block)

The `parseItemsFromMarkdown()` function extracts items from the markdown. It looks for:
- `## Items` section
- `### Title` headers for each item
- `**Author:** ` or `**Source:** ` fields
- `**tl;dr:** ` descriptions

Customize these patterns if your markdown format differs.
