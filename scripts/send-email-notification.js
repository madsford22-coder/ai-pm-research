#!/usr/bin/env node
/**
 * Send Email Notification for Daily Research Status
 *
 * This script sends an email notification with the status of the daily research run.
 * It uses Gmail API for reliable delivery.
 */

const fs = require('fs');
const path = require('path');

// Add tooling/node_modules to module path so googleapis can be found
// This allows the script to use dependencies installed in tooling/
const toolingNodeModules = path.join(__dirname, '..', 'tooling', 'node_modules');
if (fs.existsSync(toolingNodeModules)) {
  // Add to NODE_PATH so require() can find modules in tooling/node_modules
  if (!process.env.NODE_PATH) {
    process.env.NODE_PATH = toolingNodeModules;
  } else if (!process.env.NODE_PATH.includes(toolingNodeModules)) {
    process.env.NODE_PATH = toolingNodeModules + path.delimiter + process.env.NODE_PATH;
  }
  require('module')._initPaths();
}

const { google } = require('googleapis');

// Configuration
const CONFIG = {
  recipientEmail: process.env.NOTIFICATION_EMAIL || 'YOUR_EMAIL@gmail.com',
  tokenPath: path.join(__dirname, '..', '.gmail-token.json'),
  credentialsPath: path.join(__dirname, '..', '.gmail-credentials.json'),
};

/**
 * Create OAuth2 client
 */
function getOAuth2Client() {
  const credentials = JSON.parse(fs.readFileSync(CONFIG.credentialsPath, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
}

/**
 * Get authenticated Gmail client
 */
async function getGmailClient() {
  const oAuth2Client = getOAuth2Client();

  // Check if we have a token
  if (!fs.existsSync(CONFIG.tokenPath)) {
    throw new Error('No token found. Run setup first: node scripts/setup-gmail-notifications.js');
  }

  const token = JSON.parse(fs.readFileSync(CONFIG.tokenPath, 'utf-8'));
  oAuth2Client.setCredentials(token);

  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

/**
 * Create email message
 */
function createMessage(to, subject, body) {
  // Encode subject line properly for UTF-8 characters (including emojis)
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;

  const message = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${encodedSubject}`,
    '',
    body
  ].join('\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send email
 */
async function sendEmail(subject, htmlBody) {
  try {
    const gmail = await getGmailClient();
    const raw = createMessage(CONFIG.recipientEmail, subject, htmlBody);

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: raw,
      },
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${result.data.id}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw error;
  }
}

/**
 * Parse items from markdown file
 */
function parseItemsFromMarkdown(fileContent) {
  const items = [];

  // Extract the items section
  const itemsMatch = fileContent.match(/## Items\n\n([\s\S]*?)(?:\n\n---\n\n## Other Notable Updates|\n\n---\n\n## Daily Product|$)/);
  if (!itemsMatch) return items;

  const itemsSection = itemsMatch[1];

  // Split by ### headers to get individual items
  const itemTexts = itemsSection.split(/\n### /).filter(text => text.trim());

  for (const itemText of itemTexts) {
    const lines = itemText.split('\n');
    const title = lines[0].trim();

    // Extract author/source and tl;dr
    const authorMatch = itemText.match(/\*\*(?:Author|Source):\*\* (.+)/);
    const tldrMatch = itemText.match(/\*\*tl;dr:\*\* (.+)/);

    if (title && tldrMatch) {
      items.push({
        title,
        author: authorMatch ? authorMatch[1] : '',
        tldr: tldrMatch[1]
      });
    }
  }

  return items;
}

/**
 * Generate status email HTML
 */
function generateStatusEmail(status) {
  const { success, date, summary, errors, filePath, tokensUsed, items = [] } = status;

  const statusEmoji = success ? '✅' : '❌';
  const statusText = success ? 'Success' : 'Failed';
  const statusColor = success ? '#10b981' : '#ef4444';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; }
    .section { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .section h2 { margin: 0 0 10px 0; font-size: 16px; color: #1f2937; }
    .summary { font-size: 14px; line-height: 1.6; }
    .item { background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #3b82f6; }
    .item-title { font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
    .item-meta { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
    .item-tldr { font-size: 14px; color: #374151; }
    .errors { background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; margin-top: 10px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .stat { background: white; padding: 10px; border-radius: 4px; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .stat-value { font-size: 18px; font-weight: bold; color: #1f2937; margin-top: 5px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${statusEmoji} Daily Research ${statusText}</h1>
    <p>${date}</p>
  </div>

  ${success ? `
  <div class="section">
    <h2>📊 Summary</h2>
    <div class="summary">${summary || 'Research update generated successfully.'}</div>
  </div>

  ${items.length > 0 ? `
  <div class="section">
    <h2>📰 Today's Updates</h2>
    ${items.map(item => `
      <div class="item">
        <div class="item-title">${item.title}</div>
        ${item.author ? `<div class="item-meta">${item.author}</div>` : ''}
        <div class="item-tldr">${item.tldr}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>📈 Stats</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-label">${items.length > 0 ? 'Items' : 'Tokens Used'}</div>
        <div class="stat-value">${items.length > 0 ? items.length : (tokensUsed || 'N/A')}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Status</div>
        <div class="stat-value">Complete</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📄 Generated File</h2>
    <p><code>${filePath || 'updates/daily/YYYY/YYYY-MM-DD.md'}</code></p>
    <p style="font-size: 14px; color: #6b7280;">View the full update in your repository.</p>
  </div>
  ` : `
  <div class="section">
    <h2>❌ Errors</h2>
    <div class="errors">
      ${errors || 'Unknown error occurred.'}
    </div>
  </div>
  `}

  <div class="footer">
    <p>AI PM Research • Automated Daily Updates</p>
    <p>To disable notifications, remove the email script from your cron job.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse status from command line args or read from log file
  const statusArg = args.find(arg => arg.startsWith('--status='));
  const dateArg = args.find(arg => arg.startsWith('--date='));
  const logFileArg = args.find(arg => arg.startsWith('--log='));

  const today = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];

  let status = {
    success: statusArg ? statusArg.split('=')[1] === 'success' : true,
    date: today,
    summary: null,
    errors: null,
    filePath: `updates/daily/${today.split('-')[0]}/${today}.md`,
    tokensUsed: null,
    items: [],
  };

  // Always try to read the generated file first
  const outputFilePath = path.join(__dirname, '..', status.filePath);
  if (fs.existsSync(outputFilePath)) {
    const fileContent = fs.readFileSync(outputFilePath, 'utf-8');

    // Extract summary
    const summaryMatch = fileContent.match(/## Summary\n\n([\s\S]*?)\n\n---/);
    if (summaryMatch) {
      status.summary = summaryMatch[1].trim();
    }

    // Parse items
    status.items = parseItemsFromMarkdown(fileContent);
  }

  // If log file provided, parse it for additional details
  if (logFileArg) {
    const logFile = logFileArg.split('=')[1];
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf-8');

      // Extract tokens used
      const tokensMatch = logContent.match(/Tokens used: (\d+) input, (\d+) output/);
      if (tokensMatch) {
        status.tokensUsed = `${tokensMatch[1]} in, ${tokensMatch[2]} out`;
      }

      // Check for errors
      if (logContent.includes('❌') || logContent.includes('Error')) {
        status.success = false;
        const errorLines = logContent.split('\n').filter(line =>
          line.includes('❌') || line.includes('Error')
        );
        status.errors = errorLines.join('\n');
      }
    }
  }

  // Generate email
  const subject = status.success
    ? `✅ Daily Research Complete - ${status.date}`
    : `❌ Daily Research Failed - ${status.date}`;

  const htmlBody = generateStatusEmail(status);

  // Send email
  console.log(`\n📧 Sending notification email to ${CONFIG.recipientEmail}...`);
  await sendEmail(subject, htmlBody);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { sendEmail, generateStatusEmail };
