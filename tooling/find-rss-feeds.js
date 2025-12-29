#!/usr/bin/env node
/**
 * @deprecated This script has been replaced by the modular version.
 * Please use: node scripts/find-rss-feeds.js
 * 
 * Find RSS feeds for people in context/people.md using Puppeteer
 * 
 * This script:
 * 1. Parses context/people.md to find people with blogs
 * 2. Uses Puppeteer to visit each blog and find RSS feed URLs
 * 3. Outputs found RSS feeds in a format that can be added to people.md
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PROJECT_ROOT = path.join(__dirname, '..');
const PEOPLE_FILE = path.join(PROJECT_ROOT, 'context', 'people.md');

// Common RSS feed paths to try
const COMMON_RSS_PATHS = [
  '/feed',
  '/feed.xml',
  '/rss',
  '/rss.xml',
  '/atom.xml',
  '/index.xml',
  '/feed/',
  '/rss/',
];

async function parsePeopleFile() {
  const content = fs.readFileSync(PEOPLE_FILE, 'utf-8');
  const people = [];
  
  // Split by person sections (## Name)
  const sections = content.split(/\n## /);
  
  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const name = lines[0].trim();
    
    const person = {
      name,
      blog: null,
      rss_feed: null,
    };
    
    // Extract blog URL
    for (const line of lines) {
      if (line.includes('Blog:') || line.includes('blog:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.blog = match[0];
        }
      }
      if (line.includes('RSS Feed:') || line.includes('rss feed:') || line.includes('RSS:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.rss_feed = match[0].replace(/\)$/, '');
        }
      }
    }
    
    if (person.blog && !person.rss_feed) {
      people.push(person);
    }
  }
  
  return people;
}

async function findRSSFeedInHTML(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Look for RSS link tags
    const rssLinks = await page.evaluate(() => {
      const links = [];
      // Find <link> tags with RSS/Atom types
      document.querySelectorAll('link[type*="rss"], link[type*="atom"], link[type*="xml"]').forEach(link => {
        if (link.href) {
          links.push(link.href);
        }
      });
      // Find <a> tags that might link to RSS
      document.querySelectorAll('a[href*="feed"], a[href*="rss"], a[href*="atom"]').forEach(link => {
        if (link.href) {
          links.push(link.href);
        }
      });
      return links;
    });
    
    // Return the first valid RSS link
    for (const link of rssLinks) {
      if (link.includes('feed') || link.includes('rss') || link.includes('atom')) {
        return link;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking ${url}: ${error.message}`);
    return null;
  }
}

async function tryCommonRSSPaths(page, baseUrl) {
  const parsed = new URL(baseUrl);
  const base = `${parsed.protocol}//${parsed.host}`;
  
  for (const rssPath of COMMON_RSS_PATHS) {
    const testUrl = base + rssPath;
    try {
      const response = await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
      
      if (response && response.status() === 200) {
        const contentType = response.headers()['content-type'] || '';
        
        if (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom')) {
          return testUrl;
        }
        
        // Also check page content for XML indicators if content-type check fails
        const content = await page.content();
        if (content.trim().startsWith('<?xml') || content.includes('<rss') || content.includes('<feed')) {
          return testUrl;
        }
      }
    } catch (error) {
      // Continue to next path
      continue;
    }
  }
  
  return null;
}

async function findRSSFeedForPerson(browser, person) {
  console.log(`\nChecking ${person.name} - ${person.blog}`);
  
  const page = await browser.newPage();
  let foundFeed = null;
  
  try {
    // First, try to find RSS link in HTML
    foundFeed = await findRSSFeedInHTML(page, person.blog);
    
    if (!foundFeed) {
      // Try common RSS paths
      foundFeed = await tryCommonRSSPaths(page, person.blog);
    }
    
    if (foundFeed) {
      console.log(`  ✓ Found: ${foundFeed}`);
    } else {
      console.log(`  ✗ No RSS feed found`);
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return foundFeed;
}

async function main() {
  console.log('Finding RSS feeds for people in context/people.md...\n');
  
  const people = await parsePeopleFile();
  console.log(`Found ${people.length} people with blogs but no RSS feeds\n`);
  
  // Use a temporary user data directory to avoid permission issues
  const os = require('os');
  const userDataDir = path.join(os.tmpdir(), 'puppeteer-user-data-' + Date.now());
  
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: userDataDir, // Use a temporary user data directory
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-crash-reporter',
      '--disable-breakpad',
      '--no-first-run',
      '--no-default-browser-check',
    ]
  });
  
  const results = [];
  
  for (const person of people) {
    const rssFeed = await findRSSFeedForPerson(browser, person);
    if (rssFeed) {
      results.push({
        name: person.name,
        blog: person.blog,
        rss_feed: rssFeed
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await browser.close();
  
  // Clean up user data directory
  try {
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\nFound RSS Feeds:\n');
  
  // Output in markdown format for easy copy-paste
  for (const result of results) {
    console.log(`## ${result.name}`);
    console.log(`- RSS Feed: ${result.rss_feed}`);
    console.log('');
  }
  
  // Also output JSON
  console.log('\nJSON format:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);

