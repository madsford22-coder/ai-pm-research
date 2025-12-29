/**
 * Pipeline for finding RSS feeds
 * 
 * This orchestrates the adapters to find RSS feeds for people's blogs.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const { parsePeopleFile } = require('../adapters/markdown');

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

/**
 * Find RSS feed in HTML
 * @param {Object} page - Puppeteer page object
 * @param {string} url - URL to check
 * @returns {Promise<string|null>}
 */
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

/**
 * Try common RSS paths
 * @param {Object} page - Puppeteer page object
 * @param {string} baseUrl - Base URL to check
 * @returns {Promise<string|null>}
 */
async function tryCommonRSSPaths(page, baseUrl) {
  const { URL } = require('url');
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

/**
 * Find RSS feed for a person
 * @param {Object} browser - Puppeteer browser instance
 * @param {import('../domain/types').Person} person - Person object
 * @returns {Promise<string|null>}
 */
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

/**
 * Main pipeline function for finding RSS feeds
 * @param {Object} options - Options object
 * @param {string} options.peopleFile - Path to people.md file
 * @returns {Promise<Array<{name: string, blog: string, rss_feed: string}>>}
 */
async function findRSSFeedsPipeline(options = {}) {
  const {
    peopleFile = path.join(__dirname, '../../context/people.md'),
  } = options;
  
  console.log('Finding RSS feeds for people in context/people.md...\n');
  
  // Load data
  const people = parsePeopleFile(peopleFile);
  const peopleWithBlogs = people.filter(p => p.blog && !p.rss_feed);
  console.log(`Found ${peopleWithBlogs.length} people with blogs but no RSS feeds\n`);
  
  // Setup browser
  const userDataDir = path.join(os.tmpdir(), 'puppeteer-user-data-' + Date.now());
  
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: userDataDir,
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
  
  // Find RSS feeds
  const results = [];
  
  for (const person of peopleWithBlogs) {
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
  
  // Clean up
  try {
    const fs = require('fs');
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  
  return results;
}

module.exports = {
  findRSSFeedsPipeline,
  findRSSFeedForPerson,
};

