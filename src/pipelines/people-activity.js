/**
 * Pipeline for checking people activity
 * 
 * This orchestrates the adapters, transforms, and domain logic
 * to check activity from tracked people.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const { parsePeopleFile } = require('../adapters/markdown');
const { fetchRSSFeed } = require('../adapters/rss');
const { scrapeBlogPosts, scrapeLinkedInPosts, scrapeTwitterPosts } = require('../adapters/scraper');
const { filterByDate, dedupePosts } = require('../transforms/filter');
const { sortPostsByDate } = require('../transforms/sort');

const DEFAULT_DAYS_BACK = 30;

/**
 * Check activity for a single person
 * @param {Object} browser - Puppeteer browser instance
 * @param {import('../domain/types').Person} person - Person object
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {Promise<import('../domain/types').PersonActivity>}
 */
async function checkPersonActivity(browser, person, options = {}) {
  const { daysBack = DEFAULT_DAYS_BACK } = options;
  
  console.log(`\nChecking ${person.name}...`);
  
  const page = await browser.newPage();
  const activity = {
    name: person.name,
    posts: [],
    errors: [],
  };
  
  try {
    // 1. Check RSS feed if available
    if (person.rss_feed) {
      console.log(`  Checking RSS feed: ${person.rss_feed}`);
      const { posts, error } = await fetchRSSFeed(page, person.rss_feed, { daysBack });
      if (error) {
        activity.errors.push(`RSS feed error: ${error}`);
      } else {
        activity.posts.push(...posts);
        console.log(`    Found ${posts.length} posts from RSS`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 2. Scrape blog if no RSS or as backup
    if (person.blog && activity.posts.length === 0) {
      console.log(`  Scraping blog: ${person.blog}`);
      const posts = await scrapeBlogPosts(page, person.blog, { daysBack });
      activity.posts.push(...posts);
      console.log(`    Found ${posts.length} posts from blog scrape`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Check LinkedIn if available
    if (person.linkedin) {
      console.log(`  Checking LinkedIn: ${person.linkedin}`);
      const { posts, error } = await scrapeLinkedInPosts(page, person.linkedin, { daysBack });
      if (error) {
        activity.errors.push(`LinkedIn error: ${error}`);
      } else {
        activity.posts.push(...posts);
        console.log(`    Found ${posts.length} posts from LinkedIn`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 4. Check Twitter/X if available
    if (person.twitter) {
      console.log(`  Checking Twitter/X: @${person.twitter}`);
      const { posts, error } = await scrapeTwitterPosts(page, person.twitter, { daysBack });
      if (error) {
        activity.errors.push(`Twitter error: ${error}`);
      } else {
        activity.posts.push(...posts);
        console.log(`    Found ${posts.length} posts from Twitter/X`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    activity.errors.push(`Error checking ${person.name}: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return activity;
}

/**
 * Main pipeline function for checking people activity
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @param {string} options.peopleFile - Path to people.md file
 * @param {string} options.format - Output format ('json' | 'markdown')
 * @returns {Promise<{activities: import('../domain/types').PersonActivity[], output: string}>}
 */
async function checkPeopleActivityPipeline(options = {}) {
  const {
    daysBack = DEFAULT_DAYS_BACK,
    peopleFile = path.join(__dirname, '../../context/people.md'),
    format = 'markdown',
  } = options;
  
  console.log(`Checking people activity from last ${daysBack} days...\n`);
  
  // Load data
  const people = parsePeopleFile(peopleFile);
  console.log(`Found ${people.length} people to check\n`);
  
  // Setup browser
  const userDataDir = path.join(os.tmpdir(), 'puppeteer-people-activity-' + Date.now());
  
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-gpu',
      '--disable-crash-reporter',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-pings',
      '--no-zygote',
    ]
  });
  
  // Check all people
  const allActivity = [];
  
  for (const person of people) {
    const activity = await checkPersonActivity(browser, person, { daysBack });
    allActivity.push(activity);
  }
  
  await browser.close();
  
  // Clean up
  try {
    const fs = require('fs');
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  } catch (e) {}
  
  // Transform data
  for (const activity of allActivity) {
    activity.posts = filterByDate(activity.posts, { daysBack });
    activity.posts = dedupePosts(activity.posts);
    activity.posts = sortPostsByDate(activity.posts);
  }
  
  // Format output
  let output;
  if (format === 'json') {
    output = JSON.stringify(allActivity, null, 2);
  } else {
    const { formatPersonActivityMarkdown } = require('../transforms/format');
    output = formatPersonActivityMarkdown(allActivity);
  }
  
  return {
    activities: allActivity,
    output,
  };
}

module.exports = {
  checkPeopleActivityPipeline,
  checkPersonActivity,
};

