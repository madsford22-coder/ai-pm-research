#!/usr/bin/env node
/**
 * Send daily research preview to Buttondown subscribers.
 * Reuses the same HTML generated for the owner email.
 */

const { buildEmailFromFile } = require('./send-email-notification.js');

async function main() {
  const args = process.argv.slice(2);
  const dateArg = args.find(a => a.startsWith('--date='));
  const today = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    console.error('❌ BUTTONDOWN_API_KEY not set — skipping broadcast');
    process.exit(1);
  }

  const { subject, html } = buildEmailFromFile(today, true, null);

  console.log(`📧 Sending Buttondown broadcast: "${subject}"`);

  const res = await fetch('https://api.buttondown.email/v1/emails', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Buttondown-Live-Dangerously': 'true',
    },
    body: JSON.stringify({ subject, body: html, status: 'about_to_send' }),
  });

  if (res.ok) {
    console.log('✅ Buttondown broadcast sent!');
  } else {
    const error = await res.json().catch(() => ({}));
    console.error('⚠️ Buttondown broadcast failed (non-fatal):', JSON.stringify(error));
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
