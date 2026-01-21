/**
 * Netlify Scheduled Function - Daily Research Update
 *
 * This function runs daily at 9am PT to:
 * 1. Collect research data from RSS feeds and sources
 * 2. Generate daily update using Claude API
 * 3. Commit to repository
 * 4. Trigger Netlify rebuild
 *
 * Schedule: Set in netlify.toml or Netlify UI
 * Required Environment Variables:
 * - ANTHROPIC_API_KEY: Claude API key
 * - GITHUB_TOKEN: GitHub personal access token with repo access
 * - NOTIFICATION_EMAIL: Email for notifications (optional)
 */

const https = require('https');
const { execSync } = require('child_process');

// Helper to make Claude API request
async function callClaudeAPI(prompt, systemPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  const data = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            resolve(response.content[0].text);
          } catch (error) {
            reject(new Error(`Failed to parse API response: ${error.message}`));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Main handler
exports.handler = async (event) => {
  console.log('Starting daily research update...');

  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const year = today.split('-')[0];

    console.log(`Generating update for ${today}`);

    // TODO: Implement data collection
    // For now, this is a placeholder that would:
    // 1. Fetch RSS feeds
    // 2. Collect people activity
    // 3. Collect company updates

    const collectedData = `
# Daily Research Data Collection
# Date: ${today}

## Sample Data
This is a placeholder. In production, this would contain:
- RSS feed updates from tracked sources
- People activity from social media
- Company updates from news sources
    `.trim();

    // Load the research prompt
    const researchPrompt = `
You are helping to create a daily PM research update.

Data collected for ${today}:
${collectedData}

Create a daily update following this EXACT format:

---
title: "Main Theme of Today's Update"
date: ${today}
tags:
  - daily-update
  - ai-pm-research
---

# Daily PM Research Update: ${today}

## Summary

Brief 2-3 sentence summary of today's signals.

## Items

### [Item Title]
**Source:** [URL]

**tl;dr:** Brief summary

**What changed:** What's new

**PM Takeaway:** Key insight for PMs

**PM problem addressed:** What problem this solves

**How to apply:** Practical application

**Decision this informs:** What decisions this helps with

**Pattern to note:** Broader pattern or trend

---

CRITICAL: The frontmatter (between --- markers) MUST be at the very beginning of the file.
Do not include any text, comments, or headings before the frontmatter.
    `.trim();

    const systemPrompt = 'You are a product management researcher creating daily research updates. Always follow the exact format provided, with frontmatter at the beginning.';

    console.log('Calling Claude API to generate update...');
    const updateContent = await callClaudeAPI(researchPrompt, systemPrompt);

    console.log('Update generated successfully');
    console.log('Content preview:', updateContent.substring(0, 200));

    // In production, this would:
    // 1. Write file to updates/daily/${year}/${today}.md
    // 2. Commit to repository using GitHub API
    // 3. Trigger Netlify rebuild

    // For now, just log success
    console.log(`Daily update generated for ${today}`);
    console.log('File path would be: updates/daily/${year}/${today}.md');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily update generated successfully',
        date: today,
        preview: updateContent.substring(0, 500)
      })
    };

  } catch (error) {
    console.error('Error generating daily update:', error);

    // Send error notification if email configured
    if (process.env.NOTIFICATION_EMAIL) {
      console.log(`Would send error notification to ${process.env.NOTIFICATION_EMAIL}`);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
};
