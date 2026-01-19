#!/usr/bin/env node
/**
 * Setup Gmail API for Email Notifications
 *
 * This script helps you set up Gmail API authentication for email notifications.
 * Run this once to authorize the app to send emails on your behalf.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(__dirname, '..', '.gmail-token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', '.gmail-credentials.json');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          Gmail API Setup for Email Notifications              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

This script will help you set up Gmail API authentication.

Prerequisites:
1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable Gmail API for your project
4. Create OAuth 2.0 credentials (Desktop app)
5. Download the credentials JSON file
6. Save it as .gmail-credentials.json in this directory

Press Ctrl+C to exit if you haven't done this yet.
`);

/**
 * Get OAuth2 client
 */
function getOAuth2Client() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`❌ Credentials file not found: ${CREDENTIALS_PATH}`);
    console.error('\nPlease follow these steps:');
    console.error('1. Go to https://console.cloud.google.com/');
    console.error('2. Create OAuth 2.0 credentials (Desktop app)');
    console.error('3. Download the JSON file');
    console.error('4. Save it as .gmail-credentials.json in the project root\n');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
}

/**
 * Get authorization URL
 */
function getAuthUrl(oAuth2Client) {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

/**
 * Get access token from authorization code
 */
async function getAccessToken(oAuth2Client, code) {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Save the token
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('\n✅ Token saved to:', TOKEN_PATH);

  return tokens;
}

/**
 * Main setup flow
 */
async function setup() {
  const oAuth2Client = getOAuth2Client();

  // Check if token already exists
  if (fs.existsSync(TOKEN_PATH)) {
    console.log('⚠️  Token already exists at:', TOKEN_PATH);
    console.log('Delete it if you want to re-authorize.\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    await new Promise(resolve => {
      rl.question('Re-authorize? (y/N): ', answer => {
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log('\nSetup cancelled. Using existing token.');
          process.exit(0);
        }
        resolve();
      });
    });

    fs.unlinkSync(TOKEN_PATH);
  }

  // Generate auth URL
  const authUrl = getAuthUrl(oAuth2Client);

  console.log('\n📋 Step 1: Authorize this app');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n─────────────────────────────────────────────────────────────\n');

  // Get authorization code from user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise(resolve => {
    rl.question('📋 Step 2: Enter the authorization code from the browser:\n> ', answer => {
      rl.close();
      resolve(answer.trim());
    });
  });

  // Exchange code for token
  console.log('\n📋 Step 3: Exchanging code for access token...');
  await getAccessToken(oAuth2Client, code);

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║                    ✅ Setup Complete!                          ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('Your Gmail API is now configured for email notifications.\n');
  console.log('Next steps:');
  console.log('1. Set your email address: export NOTIFICATION_EMAIL="your@gmail.com"');
  console.log('2. Test the notification: node scripts/send-email-notification.js');
  console.log('3. The cron job will automatically send emails after each run.\n');
}

setup().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
});
