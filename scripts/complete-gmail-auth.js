#!/usr/bin/env node
/**
 * Complete Gmail API Authorization
 * Usage: node scripts/complete-gmail-auth.js "YOUR_AUTH_CODE"
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(__dirname, '..', '.gmail-token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', '.gmail-credentials.json');

async function completeAuth(code) {
  // Read credentials
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ Credentials file not found:', CREDENTIALS_PATH);
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  // Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  console.log('📋 Exchanging authorization code for access token...');

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Save the token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('✅ Token saved to:', TOKEN_PATH);

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
  } catch (error) {
    console.error('❌ Failed to exchange code for token:', error.message);
    console.error('\nThe authorization code may have expired or is invalid.');
    console.error('Please run: node scripts/setup-gmail-notifications.js');
    process.exit(1);
  }
}

// Get authorization code from command line
const code = process.argv[2];

if (!code) {
  console.error('Usage: node scripts/complete-gmail-auth.js "YOUR_AUTH_CODE"');
  console.error('\nExtract the code from your OAuth redirect URL.');
  console.error('Example: http://localhost/?code=YOUR_CODE_HERE&scope=...');
  process.exit(1);
}

completeAuth(code);
