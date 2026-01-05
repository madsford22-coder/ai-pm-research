#!/usr/bin/env node
/**
 * @deprecated This script has been replaced by the modular version.
 * Please use: node scripts/check-company-news.js
 * 
 * Check news mentions and trending topics for tracked companies
 * 
 * This script:
 * 1. Parses context/companies.md to find companies
 * 2. Searches for recent news mentions using web search
 * 3. Can be extended to check LinkedIn trends (requires API access)
 * 4. Outputs recent news in markdown format
 * 
 * Note: This is a companion to check-company-updates.js
 * For LinkedIn trends, you would need:
 * - LinkedIn API access (limited availability)
 * - Or a service like Brandwatch, Sprout Social, etc.
 * - Or manual monitoring
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const COMPANIES_FILE = path.join(PROJECT_ROOT, 'context', 'companies.md');

const DEFAULT_DAYS_BACK = 7;

function parseCompaniesFile() {
  const content = fs.readFileSync(COMPANIES_FILE, 'utf-8');
  const companies = [];
  
  const sections = content.split(/\n## /);
  
  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const name = lines[0].trim();
    
    const company = {
      name,
      category: null,
    };
    
    const categoryMatch = section.match(/\*\*Category:\*\* (.+)/);
    if (categoryMatch) {
      company.category = categoryMatch[1];
    }
    
    companies.push(company);
  }
  
  return companies;
}

async function searchNewsForCompany(page, companyName, daysBack) {
  try {
    // Use Google News search
    const searchQuery = `${companyName} AI product update OR launch OR feature`;
    const newsUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws&tbs=qdr:w`; // Last week
    
    await page.goto(newsUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = await page.evaluate(() => {
      const items = [];
      
      // Google News structure
      const articles = document.querySelectorAll('div[data-ved] a[href^="http"]');
      
      for (const article of articles) {
        const title = article.textContent.trim();
        const link = article.href;
        
        if (title && link && title.length > 10) {
          // Find the parent container for date/source
          let source = '';
          let date = '';
          
          const parent = article.closest('div[data-ved]');
          if (parent) {
            const sourceEl = parent.querySelector('span, cite');
            if (sourceEl) {
              source = sourceEl.textContent.trim();
            }
            
            // Look for date
            const text = parent.textContent;
            const dateMatch = text.match(/(\d+\s+(hour|hours|day|days|week|weeks)\s+ago)|(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i);
            if (dateMatch) {
              date = dateMatch[0];
            }
          }
          
          items.push({
            title,
            link,
            source,
            date,
          });
        }
        
        if (items.length >= 10) break;
      }
      
      return items;
    });
    
    return results;
  } catch (error) {
    console.error(`  ✗ Error searching news for ${companyName}: ${error.message}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const daysBack = args.includes('--days') 
    ? parseInt(args[args.indexOf('--days') + 1]) 
    : DEFAULT_DAYS_BACK;
  const format = args.includes('--format') 
    ? args[args.indexOf('--format') + 1] 
    : 'markdown';
  
  console.log(`Checking news mentions for companies from last ${daysBack} days...\n`);
  console.log('Note: This uses web search and may have rate limits.\n');
  
  const companies = parseCompaniesFile();
  console.log(`Found ${companies.length} companies to check\n`);
  
  // Use a temporary user data directory to avoid permission issues
  const os = require('os');
  const userDataDir = path.join(os.tmpdir(), 'puppeteer-user-data-' + Date.now());
  
  const launchOptions = {
    headless: true,
    userDataDir: userDataDir, // Use a temporary user data directory
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
  };
  
  // Use Puppeteer's bundled Chromium for better compatibility
  console.log('Using Puppeteer\'s bundled Chromium\n');
  
  const browser = await puppeteer.launch(launchOptions);
  
  const allNews = [];
  
  for (const company of companies) {
    console.log(`Checking news for ${company.name}...`);
    const page = await browser.newPage();
    try {
      const news = await searchNewsForCompany(page, company.name, daysBack);
      
      for (const item of news) {
        allNews.push({
          company: company.name,
          category: company.category,
          ...item
        });
      }
    } catch (error) {
      console.error(`  ✗ Error searching news for ${company.name}: ${error.message}`);
    } finally {
      await page.close();
    }
    
    // Delay between searches
    await new Promise(resolve => setTimeout(resolve, 3000));
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
  
  // Output results
  if (format === 'json') {
    console.log(JSON.stringify(allNews, null, 2));
  } else {
    console.log('# Recent News Mentions\n');
    
    const byCompany = {};
    for (const item of allNews) {
      if (!byCompany[item.company]) {
        byCompany[item.company] = [];
      }
      byCompany[item.company].push(item);
    }
    
    for (const [companyName, items] of Object.entries(byCompany)) {
      console.log(`## ${companyName}`);
      if (items[0].category) {
        console.log(`*Category: ${items[0].category}*\n`);
      }
      
      for (const item of items) {
        console.log(`### ${item.title}`);
        console.log(`**Link:** ${item.link}`);
        if (item.source) {
          console.log(`**Source:** ${item.source}`);
        }
        if (item.date) {
          console.log(`**Date:** ${item.date}`);
        }
        console.log('');
      }
    }
  }
}

main().catch(console.error);

