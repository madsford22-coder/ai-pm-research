# Quick Email Setup - Do This Now

Follow these steps to get email notifications for your daily research.

## Step 1: Enable Gmail API (5 minutes)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project**:
   - Click "Select a project" → "New Project"
   - Name it "AI PM Research" (or whatever you like)
   - Click "Create"
3. **Enable Gmail API**:
   - Click "Enable APIs and Services" (top of page)
   - Search for "Gmail API"
   - Click "Gmail API" → "Enable"
4. **Create OAuth Credentials**:
   - Click "Credentials" in the left sidebar
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure OAuth consent screen:
     - Choose "External"
     - Fill in app name: "AI PM Research"
     - Add your email
     - Skip everything else, click "Save and Continue"
   - Back to "Create OAuth client ID":
     - Application type: **Desktop app**
     - Name: "AI PM Research Desktop"
     - Click "Create"
5. **Download the credentials**:
   - Click the download icon (⬇️) next to your new credential
   - Save the JSON file
   - Rename it to `.gmail-credentials.json`
   - Move it to your project root: `/Users/madisonford/Documents/ai-pm-research/`

## Step 2: Run the Setup Script (2 minutes)

```bash
cd /Users/madisonford/Documents/ai-pm-research

# Verify credentials file is there
ls -la .gmail-credentials.json

# Run setup
node scripts/setup-gmail-notifications.js
```

The script will:
1. Show you a URL - **open it in your browser**
2. You'll see "Google hasn't verified this app" - click "Advanced" → "Go to AI PM Research (unsafe)"
3. Click "Allow" to give permission to send emails
4. Copy the authorization code from the browser
5. Paste it back into the terminal

## Step 3: Set Your Email Address

Tell me your Gmail address, and I'll add it to your crontab.

Or you can do it manually:

```bash
crontab -e

# Add this line at the top (replace with your email):
NOTIFICATION_EMAIL=your@gmail.com
```

## Step 4: Test It

```bash
# Set your email temporarily
export NOTIFICATION_EMAIL="your@gmail.com"

# Run a test
node scripts/send-email-notification.js \
  --status=success \
  --date=$(date +%Y-%m-%d) \
  --log=/tmp/daily-research-cron-2026-01-19.log
```

Check your email! You should see a nicely formatted notification with:
- ✅ Success status
- 📊 Summary of today's research
- 📈 Token stats
- 📄 Path to the file

## What the Email Looks Like

**Subject**: ✅ Daily Research Complete - 2026-01-19

**Body**:
- Green header with success icon
- Summary of findings
- Stats (tokens used, status)
- Path to generated file
- Clean, readable HTML formatting

## After Setup

Every morning at 9 AM, you'll get an email notification automatically. You can then:
1. Check your email
2. Review the file in Cursor (if it looks good based on the summary)
3. Commit

No more checking log files or wondering if it ran!

## Troubleshooting

**Can't find .gmail-credentials.json**
- Make sure you downloaded it from Google Cloud Console
- Make sure you renamed it correctly (starts with a dot!)
- Make sure it's in the project root directory

**"Token expired" error**
- Delete `.gmail-token.json`
- Run the setup script again

**Email not received**
- Check your spam folder
- Make sure NOTIFICATION_EMAIL is set
- Try the test command again

## Next Step

Please provide your Gmail address, and I'll help you complete the setup!
