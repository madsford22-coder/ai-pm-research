#!/usr/bin/env node
/**
 * Send Email Notification for Daily Research Status
 *
 * Generates a newsletter-style preview email with the day's content.
 * Supports two modes:
 *   - Direct send via Gmail OAuth (local use)
 *   - --generate-only --output <path>: writes HTML to a file (for CI)
 */

const fs = require('fs');
const path = require('path');

const toolingNodeModules = path.join(__dirname, '..', 'tooling', 'node_modules');
if (fs.existsSync(toolingNodeModules)) {
  if (!process.env.NODE_PATH) {
    process.env.NODE_PATH = toolingNodeModules;
  } else if (!process.env.NODE_PATH.includes(toolingNodeModules)) {
    process.env.NODE_PATH = toolingNodeModules + path.delimiter + process.env.NODE_PATH;
  }
  require('module')._initPaths();
}

const { google } = require('googleapis');

const CONFIG = {
  recipientEmail: process.env.NOTIFICATION_EMAIL || 'YOUR_EMAIL@gmail.com',
  siteUrl: (process.env.SITE_URL || '').replace(/\/$/, ''),
  tokenPath: path.join(__dirname, '..', '.gmail-token.json'),
  credentialsPath: path.join(__dirname, '..', '.gmail-credentials.json'),
};

function getOAuth2Client() {
  const credentials = JSON.parse(fs.readFileSync(CONFIG.credentialsPath, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

async function getGmailClient() {
  const oAuth2Client = getOAuth2Client();
  if (!fs.existsSync(CONFIG.tokenPath)) {
    throw new Error('No token found. Run setup first: node scripts/setup-gmail-notifications.js');
  }
  const token = JSON.parse(fs.readFileSync(CONFIG.tokenPath, 'utf-8'));
  oAuth2Client.setCredentials(token);
  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

function createMessage(to, subject, body) {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const message = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${encodedSubject}`,
    '',
    body
  ].join('\n');
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendEmail(subject, htmlBody) {
  try {
    const gmail = await getGmailClient();
    const raw = createMessage(CONFIG.recipientEmail, subject, htmlBody);
    const result = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${result.data.id}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw error;
  }
}

function parseFrontmatterTitle(fileContent) {
  const match = fileContent.match(/^---\n[\s\S]*?^title:\s*["']?(.+?)["']?\s*$/m);
  return match ? match[1].trim() : null;
}

const STORY_END = /^## (?:Quick Hits|The Thread|Sit With This)\b/m;

// Body of "## The Short Version" up to the next heading (any level) or rule.
function getShortVersionBlock(fileContent) {
  const m = fileContent.match(/^## (?:The Short Version|One-Line Summary)[^\n]*\n([\s\S]*?)(?=^#{2,3} |^---\s*$|(?![\s\S]))/m);
  return m ? m[1] : null;
}

function parseShortVersion(fileContent) {
  const block = getShortVersionBlock(fileContent);
  if (!block) return null;
  // Only the first paragraph: the summary, never the stories that follow it.
  const para = block.trim().split(/\n\s*\n/)[0];
  return para ? para.replace(/\s*\n\s*/g, ' ').trim() : null;
}

// Stories live between the short version and Quick Hits / The Thread.
// They have used "## Items" + "### Title" with **tl;dr:**, and more recently
// bare "### Title" or "## Title" sections with **What happened:**.
function parseItems(fileContent) {
  const svIdx = fileContent.search(/^## (?:The Short Version|One-Line Summary)/m);
  if (svIdx === -1) return [];
  const rest = fileContent.slice(svIdx).replace(/^[^\n]*\n/, '');
  const endIdx = rest.search(STORY_END);
  const region = endIdx === -1 ? rest : rest.slice(0, endIdx);

  const items = [];
  const sections = region.split(/^#{2,3} /m).slice(1);
  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0].trim();
    if (!title || /^Items$/i.test(title)) continue;
    const body = lines.slice(1).join('\n');

    let summary = null;
    const tldr = body.match(/\*\*tl;dr:\*\*\s*([^\n]+)/i);
    const what = body.match(/\*\*What happened:\*\*\s*([\s\S]*?)(?=\n\s*\n|\n\*\*|$)/i);
    if (tldr) summary = tldr[1];
    else if (what) summary = what[1];
    else {
      const para = body.split(/\n\s*\n/).map(p => p.trim())
        .find(p => p && !/^\*\*(Source|Credibility)/i.test(p) && !/^[-*]\s/.test(p) && p !== '---');
      summary = para || null;
    }
    if (summary) items.push({ title, tldr: firstSentences(summary.replace(/\s*\n\s*/g, ' ').trim(), 2) });
  }
  return items;
}

// "- **Name**: description (2026-10-21): https://url" -> { name, text, url }
function parseQuickHits(fileContent) {
  const match = fileContent.match(/^## Quick Hits[^\n]*\n([\s\S]*?)(?=^## |^---\s*$|(?![\s\S]))/m);
  if (!match) return [];
  return match[1]
    .split('\n')
    .filter(l => /^\s*[-*]\s/.test(l))
    .map(l => {
      let line = l.replace(/^\s*[-*]\s+/, '').trim();
      let url = null;
      const urlMatch = line.match(/:?\s*(https?:\/\/\S+)\s*$/);
      if (urlMatch) { url = urlMatch[1]; line = line.slice(0, urlMatch.index).trim(); }
      const linkMatch = !url && line.match(/\[([^\]]+)\]\((https?:[^)]+)\)/);
      if (linkMatch) { url = linkMatch[2]; line = line.replace(linkMatch[0], linkMatch[1]); }
      line = line.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '').replace(/[:\s]+$/, '');
      const nameMatch = line.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
      const name = nameMatch ? nameMatch[1].trim() : null;
      const text = stripMarkdown(nameMatch ? nameMatch[2] : line);
      if (!name && !text) return null;
      return { name, text, url };
    })
    .filter(Boolean);
}

// Keep previews short: the first N sentences of a paragraph.
function firstSentences(text, n) {
  const parts = text.match(/[^.!?]+(?:[.!?]+["')\]]*|$)(?:\s+|$)/g);
  if (!parts || parts.length <= n) return text;
  return parts.slice(0, n).join('').trim();
}

// Turn inline markdown into plain text so nothing like ** or ### leaks into email.
function stripMarkdown(str) {
  return String(str || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^*\w])[*_]([^*_\n]+)[*_](?=[^*\w]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function generatePreviewEmail({ date, title, shortVersion, items, quickHits, readMoreUrl }) {
  const formattedDate = formatDate(date);
  const previewItems = items.slice(0, 3);

  const itemsHtml = previewItems.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      ${previewItems.map(item => `
      <tr>
        <td style="padding:20px 0; border-bottom:1px solid #f0f0f0;">
          <p style="margin:0 0 8px; font-size:15px; font-weight:bold; color:#1a1a1a; line-height:1.4;">${escapeHtml(stripMarkdown(item.title))}</p>
          <p style="margin:0; font-size:14px; line-height:1.6; color:#444;">${escapeHtml(stripMarkdown(item.tldr))}</p>
        </td>
      </tr>`).join('')}
    </table>` : '';

  const quickHitsHtml = quickHits.length > 0 ? `
    <div style="background:#f9f9f9; border-radius:6px; padding:20px 24px; margin:0 0 32px;">
      <p style="margin:0 0 12px; font-size:11px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:#888;">Also today</p>
      <ul style="margin:0; padding-left:18px;">
        ${quickHits.map(h => {
          const label = h.name ? `<strong style="color:#1a1a1a;">${escapeHtml(h.name)}</strong>${h.text ? ': ' : ''}` : '';
          const text = escapeHtml(h.text || '');
          const body = h.url ? `${label}<a href="${escapeHtml(h.url)}" style="color:#555; text-decoration:underline;">${text || 'Link'}</a>` : `${label}${text}`;
          return `<li style="font-size:13px; line-height:1.7; color:#555; margin:0 0 6px;">${body}</li>`;
        }).join('')}
      </ul>
    </div>` : '';

  const ctaBlock = readMoreUrl ? `
    <div style="text-align:center; margin:40px 0;">
      <a href="${readMoreUrl}" style="display:inline-block; background:#1a1a1a; color:#ffffff; text-decoration:none; padding:14px 36px; font-size:14px; font-weight:600; border-radius:4px; letter-spacing:0.02em;">Read the full update →</a>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0; padding:0; background:#ffffff;">
  <div style="max-width:600px; margin:0 auto; padding:40px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#1a1a1a;">

    <div style="border-bottom:2px solid #1a1a1a; padding-bottom:12px; margin-bottom:32px;">
      <p style="margin:0; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#888; font-weight:600;">AI PM Research</p>
      <p style="margin:4px 0 0; font-size:13px; color:#888;">${formattedDate}</p>
    </div>

    <h1 style="font-size:24px; line-height:1.35; margin:0 0 20px; font-weight:700;">${escapeHtml(title || 'Daily PM Research Update')}</h1>

    ${shortVersion ? `<p style="font-size:16px; line-height:1.75; color:#222; margin:0 0 32px; border-left:3px solid #1a1a1a; padding-left:16px;">${escapeHtml(stripMarkdown(shortVersion))}</p>` : ''}

    ${itemsHtml ? `<hr style="border:none; border-top:1px solid #ebebeb; margin:0 0 32px;">` : ''}
    ${itemsHtml}
    ${quickHitsHtml}
    ${ctaBlock}

    <div style="border-top:1px solid #ebebeb; padding-top:20px; margin-top:32px;">
      <p style="margin:0; font-size:12px; color:#aaa;">AI PM Research &middot; Daily updates on AI products and strategy</p>
    </div>
  </div>
</body>
</html>`;
}

function generateFailureEmail({ date, steps = {}, runUrl }) {
  const STEPS = [
    {
      key: 'data-collection',
      label: 'Data collection & synthesis',
      fix: 'Check the <code>ANTHROPIC_API_KEY</code> secret. If the key is valid, the Claude API may have been rate-limited or returned an error — run manually: <code>bash scripts/run-daily-research-data-collection.sh</code>',
    },
    {
      key: 'commit',
      label: 'Commit & push to GitHub',
      fix: 'The post was generated but failed to save. Check GitHub Actions write permissions on the repo.',
    },
    {
      key: 'buttondown',
      label: 'Buttondown subscriber broadcast',
      fix: 'Subscribers didn\'t receive today\'s email. Check the <code>BUTTONDOWN_API_KEY</code> secret and that the Buttondown account is approved.',
    },
  ];

  const stepRows = STEPS.map(s => {
    const outcome = steps[s.key] || 'skipped';
    const icon = outcome === 'success' ? '✅' : outcome === 'failure' ? '❌' : '⏭️';
    const color = outcome === 'success' ? '#166534' : outcome === 'failure' ? '#991b1b' : '#78716c';
    const bg = outcome === 'success' ? '#f0fdf4' : outcome === 'failure' ? '#fef2f2' : '#f9fafb';
    const fix = outcome === 'failure' ? `<div style="margin-top:8px; font-size:12px; color:#374151; background:#fff; border-radius:4px; padding:10px 12px;">${s.fix}</div>` : '';
    return `
      <div style="background:${bg}; border-radius:6px; padding:12px 16px; margin-bottom:10px;">
        <div style="font-size:14px; color:${color}; font-weight:600;">${icon} ${escapeHtml(s.label)}</div>
        ${fix}
      </div>`;
  }).join('');

  const runLink = runUrl
    ? `<p style="margin:24px 0 0;"><a href="${runUrl}" style="font-size:13px; color:#3b82f6;">View full run logs →</a></p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#ffffff;">
  <div style="max-width:600px; margin:0 auto; padding:40px 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="border-bottom:2px solid #1a1a1a; padding-bottom:12px; margin-bottom:28px;">
      <p style="margin:0; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#888; font-weight:600;">AI PM Research</p>
      <p style="margin:4px 0 0; font-size:13px; color:#888;">${escapeHtml(date)}</p>
    </div>
    <h2 style="margin:0 0 20px; font-size:20px; color:#1a1a1a;">Pipeline issue detected</h2>
    <p style="margin:0 0 20px; font-size:14px; color:#555;">One or more steps failed in today's run. Here's what happened:</p>
    ${stepRows}
    ${runLink}
    <div style="border-top:1px solid #ebebeb; padding-top:16px; margin-top:32px;">
      <p style="margin:0; font-size:12px; color:#aaa;">AI PM Research &middot; Daily pipeline alert</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmailFromFile(date, success, errors, steps = {}, runUrl = null) {
  const filePath = path.join(__dirname, '..', `updates/daily/${date.split('-')[0]}/${date}.md`);

  if (!success) {
    return {
      subject: `Daily Research Failed — ${date}`,
      html: generateFailureEmail({ date, steps, runUrl }),
    };
  }

  let title = null;
  let shortVersion = null;
  let items = [];
  let quickHits = [];

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    title = parseFrontmatterTitle(content);
    shortVersion = parseShortVersion(content);
    items = parseItems(content);
    quickHits = parseQuickHits(content);
  }

  const year = date.split('-')[0];
  const readMoreUrl = CONFIG.siteUrl
    ? `${CONFIG.siteUrl}/updates/daily/${year}/${date}`
    : null;

  const subject = title || `Daily PM Research — ${date}`;

  return {
    subject,
    html: generatePreviewEmail({ date, title, shortVersion, items, quickHits, readMoreUrl }),
  };
}

async function main() {
  const args = process.argv.slice(2);

  const statusArg = args.find(a => a.startsWith('--status='));
  const dateArg = args.find(a => a.startsWith('--date='));
  const generateOnly = args.includes('--generate-only');
  const outputArg = args.find(a => a.startsWith('--output='));
  const logFileArg = args.find(a => a.startsWith('--log='));
  const runUrlArg = args.find(a => a.startsWith('--run-url='));
  const steps = {
    'data-collection': (args.find(a => a.startsWith('--step-data-collection=')) || '').split('=')[1],
    'commit': (args.find(a => a.startsWith('--step-commit=')) || '').split('=')[1],
    'buttondown': (args.find(a => a.startsWith('--step-buttondown=')) || '').split('=')[1],
  };

  const today = dateArg ? dateArg.split('=')[1] : new Date().toISOString().split('T')[0];
  const success = statusArg ? statusArg.split('=')[1] === 'success' : true;

  let errors = null;
  if (logFileArg) {
    const logFile = logFileArg.split('=')[1];
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf-8');
      if (logContent.includes('❌') || logContent.includes('Error')) {
        errors = logContent.split('\n').filter(l => l.includes('❌') || l.includes('Error')).join('\n');
      }
    }
  }

  const runUrl = runUrlArg ? runUrlArg.split('=').slice(1).join('=') : null;
  const { subject, html } = buildEmailFromFile(today, success, errors, steps, runUrl);

  if (generateOnly) {
    const outputPath = outputArg ? outputArg.split('=')[1] : '/tmp/email-preview.html';
    fs.writeFileSync(outputPath, html, 'utf-8');
    fs.writeFileSync(outputPath + '.subject', subject, 'utf-8');
    console.log(`✅ Email HTML written to ${outputPath}`);
    console.log(`   Subject: ${subject}`);
    return;
  }

  console.log(`\n📧 Sending notification email to ${CONFIG.recipientEmail}...`);
  await sendEmail(subject, html);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { parseShortVersion, parseItems, parseQuickHits, stripMarkdown, buildEmailFromFile, generatePreviewEmail, generateFailureEmail };
