#!/usr/bin/env node
/**
 * Send January 19 update email with full content
 */

const fs = require('fs');
const path = require('path');
const { sendEmail, generateStatusEmail } = require('./send-email-notification.js');

async function main() {
  const updateFile = path.join(__dirname, '..', 'updates/daily/2026/2026-01-19.md');
  const fileContent = fs.readFileSync(updateFile, 'utf-8');

  // Extract the summary
  const summaryMatch = fileContent.match(/## Summary\n\n([\s\S]*?)\n\n---/);
  const summary = summaryMatch ? summaryMatch[1].trim() : 'Research update generated successfully.';

  // Extract the main items
  const itemsMatch = fileContent.match(/## Items\n\n([\s\S]*?)\n\n---\n\n## Other Notable Updates/);
  const itemsSection = itemsMatch ? itemsMatch[1] : '';

  // Parse items
  const items = [];
  const itemRegex = /### (.+?)\n\*\*(?:Author|Source):\*\* (.+?)\n(?:\*\*Source:\*\* (.+?)\n)?\n\*\*tl;dr:\*\* (.+?)\n/g;
  let match;
  while ((match = itemRegex.exec(itemsSection)) !== null) {
    items.push({
      title: match[1],
      author: match[2],
      source: match[3] || match[2],
      tldr: match[4]
    });
  }

  // Generate HTML with actual content
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; }
    .section { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .section h2 { margin: 0 0 10px 0; font-size: 16px; color: #1f2937; }
    .summary { font-size: 14px; line-height: 1.6; }
    .item { background: white; padding: 15px; border-radius: 6px; margin-bottom: 12px; border-left: 3px solid #3b82f6; }
    .item-title { font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
    .item-meta { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
    .item-tldr { font-size: 14px; color: #374151; }
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
    <h1>✅ Daily Research Complete</h1>
    <p>2026-01-19</p>
  </div>

  <div class="section">
    <h2>📊 Summary</h2>
    <div class="summary">${summary}</div>
  </div>

  <div class="section">
    <h2>📰 Today's Updates</h2>
    ${items.map(item => `
      <div class="item">
        <div class="item-title">${item.title}</div>
        <div class="item-meta">${item.author}</div>
        <div class="item-tldr">${item.tldr}</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>📈 Stats</h2>
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Items</div>
        <div class="stat-value">${items.length}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Status</div>
        <div class="stat-value">Complete</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📄 Generated File</h2>
    <p><code>updates/daily/2026/2026-01-19.md</code></p>
    <p style="font-size: 14px; color: #6b7280;">View the full update in your repository.</p>
  </div>

  <div class="footer">
    <p>AI PM Research • Automated Daily Updates</p>
    <p>To disable notifications, remove the email script from your cron job.</p>
  </div>
</body>
</html>
  `;

  const subject = '✅ Daily Research Complete - 2026-01-19';

  console.log('\n📧 Sending January 19 update email...');
  await sendEmail(subject, htmlBody);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
