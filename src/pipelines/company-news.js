/**
 * Pipeline for checking company news mentions
 * 
 * This orchestrates the adapters, transforms, and domain logic
 * to check news mentions for tracked companies.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const { parseCompaniesFile } = require('../adapters/markdown');
const { searchNewsForCompany } = require('../adapters/news');
const { formatNewsMarkdown } = require('../transforms/format-news');
const { validatePositiveInteger, validateOneOf, validateFilePath } = require('../utils/validation');

const DEFAULT_DAYS_BACK = 7;

/**
 * Main pipeline function for checking company news
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @param {string} options.companiesFile - Path to companies.md file
 * @param {string} options.format - Output format ('json' | 'markdown')
 * @returns {Promise<{news: Array, output: string}>}
 */
async function checkCompanyNewsPipeline(options = {}) {
  const {
    daysBack = DEFAULT_DAYS_BACK,
    companiesFile = path.join(__dirname, '../../context/companies.md'),
    format = 'markdown',
  } = options;
  
  // Validate inputs
  validatePositiveInteger(daysBack, 'daysBack', 1);
  validateFilePath(companiesFile, '.md', false); // File may not exist yet
  validateOneOf(format, ['json', 'markdown'], 'format');
  
  console.log(`Checking news mentions for companies from last ${daysBack} days...\n`);
  console.log('Note: This uses web search and may have rate limits.\n');
  
  // Load data
  const companies = parseCompaniesFile(companiesFile);
  console.log(`Found ${companies.length} companies to check\n`);
  
  // Setup browser - use workspace directory instead of system temp to avoid permission issues
  const fs = require('fs');
  const puppeteerDataDir = path.join(__dirname, '../../.puppeteer-data');
  if (!fs.existsSync(puppeteerDataDir)) {
    fs.mkdirSync(puppeteerDataDir, { recursive: true });
  }
  const userDataDir = path.join(puppeteerDataDir, 'puppeteer-user-data-' + Date.now());
  
  // Launch options optimized for sandboxed environments
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
    ignoreHTTPSErrors: true,
  };
  
  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (error) {
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
  const allNews = [];
  const page = await browser.newPage();
  
  for (const company of companies) {
    console.log(`Checking news for ${company.name}...`);
    const news = await searchNewsForCompany(page, company.name, { daysBack });
    
    for (const item of news) {
      allNews.push({
        company: company.name,
        category: company.category,
        ...item
      });
    }
    
    // Delay between searches
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  await page.close();
  await browser.close();
  
  // Clean up
  try {
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  
  // Format output
  let output;
  if (format === 'json') {
    output = JSON.stringify(allNews, null, 2);
  } else {
    output = formatNewsMarkdown(allNews);
  }
  
  return {
    news: allNews,
    output,
  };
}

module.exports = {
  checkCompanyNewsPipeline,
};

