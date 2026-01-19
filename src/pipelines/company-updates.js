/**
 * Pipeline for checking company updates
 * 
 * This orchestrates the adapters, transforms, and domain logic
 * to check updates from tracked companies.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const { parseCompaniesFile } = require('../adapters/markdown');
const { fetchRSSFeed, findRSSFeedFromBlog } = require('../adapters/rss');
const { scrapeChangelog } = require('../adapters/scraper');
const { filterUpdatesByDate, dedupeUpdates } = require('../transforms/filter');
const { sortUpdatesByDate } = require('../transforms/sort');
const { validatePositiveInteger, validateOneOf, validateFilePath } = require('../utils/validation');

const DEFAULT_DAYS_BACK = 14;

/**
 * Check updates for a single company
 * @param {Object} browser - Puppeteer browser instance
 * @param {import('../domain/types').Company} company - Company object
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {Promise<import('../domain/types').UpdateItem[]>}
 */
async function checkCompanyUpdates(browser, company, options = {}) {
  const { daysBack = DEFAULT_DAYS_BACK } = options;
  
  console.log(`\nChecking ${company.name}...`);
  
  const page = await browser.newPage();
  const updates = [];
  
  try {
    // Check blogs via RSS
    for (const blogUrl of company.blogs) {
      console.log(`  Checking blog: ${blogUrl}`);
      
      // Try to find RSS feed
      const rssFeed = await findRSSFeedFromBlog(page, blogUrl);
      if (rssFeed) {
        console.log(`    Found RSS feed: ${rssFeed}`);
        const { posts } = await fetchRSSFeed(page, rssFeed, { daysBack });
        updates.push(...posts.map(item => ({
          title: item.title,
          link: item.link,
          published: item.published,
          source: 'blog',
          sourceUrl: blogUrl,
          description: item.description,
          company: company.name,
          category: company.category,
        })));
      } else {
        console.log(`    No RSS feed found, skipping blog`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Be polite
    }
    
    // Check changelogs
    for (const changelogUrl of company.changelogs) {
      console.log(`  Checking changelog: ${changelogUrl}`);
      const entries = await scrapeChangelog(page, changelogUrl, { daysBack });
      updates.push(...entries.map(entry => ({
        title: entry.title,
        link: entry.link,
        published: entry.published,
        source: 'changelog',
        sourceUrl: changelogUrl,
        description: entry.description,
        company: company.name,
        category: company.category,
      })));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error(`  ✗ Error checking ${company.name}: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return updates;
}

/**
 * Main pipeline function for checking company updates
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @param {string} options.companiesFile - Path to companies.md file
 * @param {string} options.format - Output format ('json' | 'markdown')
 * @returns {Promise<{updates: import('../domain/types').UpdateItem[], output: string}>}
 */
async function checkCompanyUpdatesPipeline(options = {}) {
  const {
    daysBack = DEFAULT_DAYS_BACK,
    companiesFile = path.join(__dirname, '../../context/companies.md'),
    format = 'markdown',
  } = options;
  
  // Validate inputs
  validatePositiveInteger(daysBack, 'daysBack', 1);
  validateFilePath(companiesFile, '.md', false); // File may not exist yet
  validateOneOf(format, ['json', 'markdown'], 'format');
  
  console.log(`Checking company updates from last ${daysBack} days...\n`);
  
  // Load data
  const companies = parseCompaniesFile(companiesFile);
  console.log(`Found ${companies.length} companies with sources\n`);
  
  // Setup browser - use workspace directory instead of system temp to avoid permission issues
  const fs = require('fs');
  const puppeteerDataDir = path.join(__dirname, '../../.puppeteer-data');
  if (!fs.existsSync(puppeteerDataDir)) {
    fs.mkdirSync(puppeteerDataDir, { recursive: true });
  }
  const userDataDir = path.join(puppeteerDataDir, 'puppeteer-user-data-' + Date.now());
  
  // Launch options optimized for sandboxed environments
  // These flags help Puppeteer work in restricted environments
  const launchOptions = {
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
      '--disable-crashpad',
      '--crashpad-handler=',
      '--disable-component-extensions-with-background-pages',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-pings',
      '--no-zygote',
      // Additional flags for better compatibility in restricted environments
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-crash-upload',
      '--disable-background-downloads',
      '--disable-client-side-phishing-detection',
      '--disable-hang-monitor',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-translate',
      '--disable-web-resources',
      '--safebrowsing-disable-auto-update',
    ],
    // Ignore HTTPS errors (useful for development/local environments)
    ignoreHTTPSErrors: true,
  };
  
  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (error) {
    // Provide helpful error message if launch fails
    console.error('\n✗ Failed to launch browser. This may be due to:');
    console.error('  1. Missing permissions (try running with elevated permissions)');
    console.error('  2. Chrome/Chromium installation issues');
    console.error('  3. Sandbox restrictions');
    console.error(`\nError: ${error.message}\n`);
    console.error('If running in a sandboxed environment, ensure the script has:');
    console.error('  - Network access permissions');
    console.error('  - File system write access to temp directory');
    console.error('  - Ability to launch browser processes\n');
    throw error;
  }
  
  // Check all companies
  const allUpdates = [];
  
  for (const company of companies) {
    const updates = await checkCompanyUpdates(browser, company, { daysBack });
    allUpdates.push(...updates);
    
    // Small delay between companies
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await browser.close();
  
  // Clean up
  try {
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  
  // Transform data
  let processedUpdates = filterUpdatesByDate(allUpdates, { daysBack });
  processedUpdates = dedupeUpdates(processedUpdates);
  processedUpdates = sortUpdatesByDate(processedUpdates);
  
  // Format output
  let output;
  if (format === 'json') {
    output = JSON.stringify(processedUpdates, null, 2);
  } else {
    const { formatCompanyUpdatesMarkdown } = require('../transforms/format');
    output = formatCompanyUpdatesMarkdown(processedUpdates);
  }
  
  return {
    updates: processedUpdates,
    output,
  };
}

module.exports = {
  checkCompanyUpdatesPipeline,
  checkCompanyUpdates,
};

