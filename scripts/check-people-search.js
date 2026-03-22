#!/usr/bin/env node
/**
 * Check People Activity via Web Search
 *
 * Uses Claude API with web_search to find recent posts/tweets from tracked people.
 * Replaces check-people-activity.js (Puppeteer-based), which couldn't reach Twitter/X.
 *
 * Usage:
 *   node scripts/check-people-search.js [--days N] [--people-file PATH]
 */

const path = require('path');
const fs = require('fs');

// Add tooling/node_modules to module path so @anthropic-ai/sdk can be found
const toolingNodeModules = path.join(__dirname, '..', 'tooling', 'node_modules');
if (fs.existsSync(toolingNodeModules)) {
  if (!process.env.NODE_PATH) {
    process.env.NODE_PATH = toolingNodeModules;
  } else if (!process.env.NODE_PATH.includes(toolingNodeModules)) {
    process.env.NODE_PATH = toolingNodeModules + path.delimiter + process.env.NODE_PATH;
  }
  require('module')._initPaths();
}

const Anthropic = require('@anthropic-ai/sdk');
const { checkPeopleSearchPipeline } = require('../src/pipelines/people-search');

async function main() {
  const args = process.argv.slice(2);

  const daysBack = args.includes('--days')
    ? parseInt(args[args.indexOf('--days') + 1])
    : 2;

  const peopleFile = args.includes('--people-file')
    ? args[args.indexOf('--people-file') + 1]
    : path.join(__dirname, '..', 'context', 'people.md');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set');
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const result = await checkPeopleSearchPipeline({ daysBack, peopleFile, anthropic });
    console.log(result.output);
  } catch (error) {
    // Log the error but exit cleanly so the shell script doesn't discard partial output
    console.error(`## People Activity\n\nPeople search encountered an error: ${error.message}\n`);
    process.exit(0);
  }
}

main().catch(console.error);
