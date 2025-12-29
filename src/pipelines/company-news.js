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
  
  console.log(`Checking news mentions for companies from last ${daysBack} days...\n`);
  console.log('Note: This uses web search and may have rate limits.\n');
  
  // Load data
  const companies = parseCompaniesFile(companiesFile);
  console.log(`Found ${companies.length} companies to check\n`);
  
  // Setup browser
  const userDataDir = path.join(os.tmpdir(), 'puppeteer-user-data-' + Date.now());
  
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
    const fs = require('fs');
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

