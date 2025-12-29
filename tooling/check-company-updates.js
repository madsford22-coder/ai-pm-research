#!/usr/bin/env node
/**
 * @deprecated This script has been replaced by the modular version.
 * Please use: node scripts/check-company-updates.js
 * 
 * Check recent product updates from tracked companies
 * 
 * This script:
 * 1. Parses context/companies.md to find companies and their primary sources
 * 2. Checks RSS feeds from company blogs
 * 3. Scrapes changelog pages for recent updates
 * 4. Optionally checks for news mentions
 * 5. Outputs recent updates in markdown format
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PROJECT_ROOT = path.join(__dirname, '..');
const COMPANIES_FILE = path.join(PROJECT_ROOT, 'context', 'companies.md');

// Number of days to look back
const DEFAULT_DAYS_BACK = 14;

function parseCompaniesFile() {
  const content = fs.readFileSync(COMPANIES_FILE, 'utf-8');
  const companies = [];
  
  // Split by company sections (## Company Name)
  const sections = content.split(/\n## /);
  
  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const name = lines[0].trim();
    
    const company = {
      name,
      blogs: [],
      changelogs: [],
      twitter: null,
      category: null,
    };
    
    // Extract category
    const categoryMatch = section.match(/\*\*Category:\*\* (.+)/);
    if (categoryMatch) {
      company.category = categoryMatch[1];
    }
    
    // Extract primary sources
    let inPrimarySources = false;
    for (const line of lines) {
      if (line.includes('**Primary sources:**')) {
        inPrimarySources = true;
        continue;
      }
      if (inPrimarySources) {
        // Stop at next section or empty line after sources
        if (line.trim() === '' && company.blogs.length > 0) {
          break;
        }
        if (line.startsWith('---')) {
          break;
        }
        
        // Extract URLs
        const urlMatch = line.match(/https?:\/\/[^\s\)]+/g);
        if (urlMatch) {
          for (const url of urlMatch) {
            const cleanUrl = url.replace(/\)$/, '').replace(/,$/, '');
            
            // Categorize URLs
            if (cleanUrl.includes('blog') || cleanUrl.includes('news') || cleanUrl.includes('updates')) {
              company.blogs.push(cleanUrl);
            } else if (cleanUrl.includes('changelog') || cleanUrl.includes('release-notes') || cleanUrl.includes('docs/changelog')) {
              company.changelogs.push(cleanUrl);
            } else if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
              company.twitter = cleanUrl;
            } else if (!cleanUrl.includes('docs') || cleanUrl.includes('changelog')) {
              // Default to blog if it's not clearly a changelog
              company.blogs.push(cleanUrl);
            }
          }
        }
        
        // Extract Twitter handles
        const twitterMatch = line.match(/@[\w]+/);
        if (twitterMatch) {
          company.twitter = `https://twitter.com/${twitterMatch[0].replace('@', '')}`;
        }
      }
    }
    
    if (company.blogs.length > 0 || company.changelogs.length > 0) {
      companies.push(company);
    }
  }
  
  return companies;
}

async function checkRSSFeed(page, feedUrl, daysBack) {
  try {
    await page.goto(feedUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    
    // Try to parse RSS feed
    const content = await page.content();
    
    // Simple RSS parsing (could be improved with a proper RSS parser)
    const items = [];
    const itemMatches = content.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    
    for (const match of itemMatches) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>(.*?)<\/title>/i);
      const linkMatch = itemContent.match(/<link>(.*?)<\/link>/i);
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/i);
      const descriptionMatch = itemContent.match(/<description>(.*?)<\/description>/i);
      
      if (titleMatch && linkMatch) {
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : null;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        
        if (!pubDate || pubDate >= cutoffDate) {
          items.push({
            title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1'),
            link: linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1'),
            published: pubDate ? pubDate.toISOString() : null,
            description: descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').substring(0, 300) : null,
          });
        }
      }
      
      if (items.length >= 10) break; // Limit to 10 most recent
    }
    
    return items;
  } catch (error) {
    console.error(`  ✗ Error checking RSS feed ${feedUrl}: ${error.message}`);
    return [];
  }
}

async function scrapeChangelog(page, changelogUrl, daysBack) {
  try {
    await page.goto(changelogUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find recent entries
    const entries = await page.evaluate((daysBack) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      
      const results = [];
      
      // Look for common changelog patterns
      // Try to find date-based sections or recent entries
      const allElements = document.querySelectorAll('article, .changelog-entry, .release, [class*="changelog"], [class*="release"], h2, h3');
      
      for (const el of allElements) {
        const text = el.textContent || '';
        const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i);
        
        if (dateMatch) {
          let entryDate;
          try {
            entryDate = new Date(dateMatch[0]);
          } catch (e) {
            continue;
          }
          
          if (entryDate >= cutoffDate) {
            // Find link if available
            const linkEl = el.querySelector('a') || el.closest('a');
            const link = linkEl ? linkEl.href : window.location.href;
            
            // Get title
            const titleEl = el.querySelector('h1, h2, h3, h4, .title, [class*="title"]') || el;
            const title = titleEl.textContent.trim().substring(0, 200);
            
            if (title && title.length > 10) {
              results.push({
                title: title,
                link: link,
                published: entryDate.toISOString(),
                description: el.textContent.substring(0, 300),
              });
            }
          }
        }
      }
      
      // If no date-based entries found, try to get first few entries
      if (results.length === 0) {
        const firstEntries = document.querySelectorAll('article, .changelog-entry, .release, [class*="changelog"]');
        for (let i = 0; i < Math.min(5, firstEntries.length); i++) {
          const el = firstEntries[i];
          const linkEl = el.querySelector('a') || el.closest('a');
          const link = linkEl ? linkEl.href : window.location.href;
          const title = el.textContent.trim().substring(0, 200);
          
          if (title && title.length > 10) {
            results.push({
              title: title,
              link: link,
              published: null,
              description: el.textContent.substring(0, 300),
            });
          }
        }
      }
      
      return results.slice(0, 10); // Limit to 10
    }, daysBack);
    
    return entries;
  } catch (error) {
    console.error(`  ✗ Error scraping changelog ${changelogUrl}: ${error.message}`);
    return [];
  }
}

async function findRSSFeedFromBlog(page, blogUrl) {
  try {
    await page.goto(blogUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Look for RSS link
    const rssLink = await page.evaluate(() => {
      // Check link tags
      const linkTag = document.querySelector('link[type*="rss"], link[type*="atom"]');
      if (linkTag && linkTag.href) {
        return linkTag.href;
      }
      
      // Check anchor tags
      const anchorTag = document.querySelector('a[href*="feed"], a[href*="rss"], a[href*="atom"]');
      if (anchorTag && anchorTag.href) {
        return anchorTag.href;
      }
      
      return null;
    });
    
    if (rssLink) {
      // Make absolute URL if relative
      try {
        return new URL(rssLink, blogUrl).href;
      } catch (e) {
        return rssLink.startsWith('http') ? rssLink : `${blogUrl}${rssLink}`;
      }
    }
    
    // Try common paths
    const commonPaths = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/atom.xml'];
    for (const path of commonPaths) {
      try {
        const testUrl = new URL(path, blogUrl).href;
        const response = await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
        const contentType = response.headers()['content-type'] || '';
        if (response.status() === 200 && (contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom'))) {
          return testUrl;
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function checkCompanyUpdates(browser, company, daysBack) {
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
        const items = await checkRSSFeed(page, rssFeed, daysBack);
        updates.push(...items.map(item => ({ ...item, source: 'blog', sourceUrl: blogUrl })));
      } else {
        console.log(`    No RSS feed found, skipping blog`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Be polite
    }
    
    // Check changelogs
    for (const changelogUrl of company.changelogs) {
      console.log(`  Checking changelog: ${changelogUrl}`);
      const entries = await scrapeChangelog(page, changelogUrl, daysBack);
      updates.push(...entries.map(entry => ({ ...entry, source: 'changelog', sourceUrl: changelogUrl })));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error(`  ✗ Error checking ${company.name}: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return updates;
}

async function main() {
  const args = process.argv.slice(2);
  const daysBack = args.includes('--days') 
    ? parseInt(args[args.indexOf('--days') + 1]) 
    : DEFAULT_DAYS_BACK;
  const format = args.includes('--format') 
    ? args[args.indexOf('--format') + 1] 
    : 'markdown';
  
  console.log(`Checking company updates from last ${daysBack} days...\n`);
  
  const companies = parseCompaniesFile();
  console.log(`Found ${companies.length} companies with sources\n`);
  
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
  
  // Use Puppeteer's bundled Chromium for better compatibility
  console.log('Using Puppeteer\'s bundled Chromium\n');
  
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
    process.exit(1);
  }
  
  const allUpdates = [];
  
  for (const company of companies) {
    const updates = await checkCompanyUpdates(browser, company, daysBack);
    for (const update of updates) {
      allUpdates.push({
        company: company.name,
        category: company.category,
        ...update
      });
    }
    
    // Small delay between companies
    await new Promise(resolve => setTimeout(resolve, 2000));
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
  
  // Sort by date (most recent first)
  allUpdates.sort((a, b) => {
    if (!a.published && !b.published) return 0;
    if (!a.published) return 1;
    if (!b.published) return -1;
    return new Date(b.published) - new Date(a.published);
  });
  
  // Output results
  if (format === 'json') {
    console.log(JSON.stringify(allUpdates, null, 2));
  } else {
    console.log('# Recent Company Updates\n');
    
    // Group by company
    const byCompany = {};
    for (const update of allUpdates) {
      if (!byCompany[update.company]) {
        byCompany[update.company] = [];
      }
      byCompany[update.company].push(update);
    }
    
    for (const [companyName, updates] of Object.entries(byCompany)) {
      console.log(`## ${companyName}`);
      if (updates[0].category) {
        console.log(`*Category: ${updates[0].category}*\n`);
      }
      
      for (const update of updates) {
        console.log(`### ${update.title}`);
        console.log(`**Link:** ${update.link}`);
        if (update.published) {
          console.log(`**Published:** ${update.published}`);
        }
        console.log(`**Source:** ${update.source} (${update.sourceUrl})`);
        if (update.description) {
          console.log(`**Summary:** ${update.description}`);
        }
        console.log('');
      }
    }
  }
}

main().catch(console.error);

