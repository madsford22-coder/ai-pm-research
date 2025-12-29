#!/usr/bin/env node
/**
 * Fix invalid URLs in people.md
 * Uses Puppeteer to find correct URLs when needed
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.join(__dirname, '..');
const PEOPLE_FILE = path.join(PROJECT_ROOT, 'context', 'people.md');

async function findRSSFeed(page, blogUrl) {
  try {
    await page.goto(blogUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for RSS link in HTML
    const rssLink = await page.evaluate(() => {
      // Check link tags
      const linkTag = document.querySelector('link[type*="rss"], link[type*="atom"], link[type*="xml"]');
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
      try {
        return new URL(rssLink, blogUrl).href;
      } catch (e) {
        return rssLink.startsWith('http') ? rssLink : `${blogUrl}${rssLink}`;
      }
    }
    
    // Try common paths
    const commonPaths = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/atom.xml', '/index.xml'];
    for (const rssPath of commonPaths) {
      try {
        const testUrl = new URL(rssPath, blogUrl).href;
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

async function fixURLs() {
  console.log('Fixing invalid URLs in people.md...\n');
  
  const userDataDir = path.join(os.tmpdir(), 'puppeteer-fix-urls-' + Date.now());
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
  
  const page = await browser.newPage();
  const fixes = [];
  
  // Fix Gibson Biddle RSS feed
  console.log('Checking Gibson Biddle blog for RSS feed...');
  try {
    const rssFeed = await findRSSFeed(page, 'https://gibsonbiddle.com');
    if (rssFeed) {
      fixes.push({
        name: 'Gibson Biddle',
        type: 'RSS feed',
        old: 'https://gibsonbiddle.com/feed',
        new: rssFeed,
      });
      console.log(`  Found RSS feed: ${rssFeed}`);
    } else {
      console.log('  No RSS feed found');
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  
  // Check Ravi Mehta blog (might just be slow)
  console.log('\nChecking Ravi Mehta blog...');
  try {
    await page.goto('https://ravi-mehta.com', { waitUntil: 'networkidle2', timeout: 20000 });
    const title = await page.title();
    console.log(`  Blog accessible, title: ${title}`);
    // Try to find RSS
    const rssFeed = await findRSSFeed(page, 'https://ravi-mehta.com');
    if (rssFeed) {
      fixes.push({
        name: 'Ravi Mehta',
        type: 'RSS feed',
        old: null,
        new: rssFeed,
      });
      console.log(`  Found RSS feed: ${rssFeed}`);
    }
  } catch (error) {
    console.log(`  Blog still timing out: ${error.message}`);
  }
  
  // Check Paul Graham RSS feed - try alternative
  console.log('\nChecking Paul Graham RSS feed alternatives...');
  try {
    // Try the blog directly for RSS
    const rssFeed = await findRSSFeed(page, 'https://paulgraham.com');
    if (rssFeed) {
      fixes.push({
        name: 'Paul Graham',
        type: 'RSS feed',
        old: 'http://www.aaronsw.com/2002/feeds/pgessays.rss',
        new: rssFeed,
      });
      console.log(`  Found RSS feed: ${rssFeed}`);
    } else {
      // Try common paths on paulgraham.com
      const testPaths = ['/rss.xml', '/feed.xml', '/atom.xml'];
      for (const testPath of testPaths) {
        try {
          const testUrl = `https://paulgraham.com${testPath}`;
          const response = await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
          if (response.status() === 200) {
            fixes.push({
              name: 'Paul Graham',
              type: 'RSS feed',
              old: 'http://www.aaronsw.com/2002/feeds/pgessays.rss',
              new: testUrl,
            });
            console.log(`  Found RSS feed: ${testUrl}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  
  await browser.close();
  
  // Clean up
  try {
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  } catch (e) {}
  
  // Apply fixes to people.md
  if (fixes.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\nApplying fixes to people.md...\n');
    
    let content = fs.readFileSync(PEOPLE_FILE, 'utf-8');
    
    for (const fix of fixes) {
      console.log(`Fixing ${fix.name} - ${fix.type}:`);
      console.log(`  Old: ${fix.old || 'None'}`);
      console.log(`  New: ${fix.new}`);
      
      if (fix.type === 'RSS feed') {
        if (fix.old) {
          // Replace existing RSS feed URL
          const oldPattern = new RegExp(`(RSS Feed:.*?)${fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          content = content.replace(oldPattern, `$1${fix.new}`);
        } else {
          // Add RSS feed if it doesn't exist
          const personSection = content.match(new RegExp(`## ${fix.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## |$)`, 'm'));
          if (personSection) {
            const section = personSection[0];
            // Add RSS feed after blog or LinkedIn line
            if (section.includes('Blog:') && !section.includes('RSS Feed:')) {
              content = content.replace(
                new RegExp(`(Blog:.*?\\n)`, 'm'),
                `$1- RSS Feed: ${fix.new}\n`
              );
            }
          }
        }
      }
    }
    
    // Write backup
    fs.writeFileSync(PEOPLE_FILE + '.backup', fs.readFileSync(PEOPLE_FILE, 'utf-8'));
    
    // Write fixed content
    fs.writeFileSync(PEOPLE_FILE, content);
    
    console.log('\n✓ Fixes applied! Backup saved to people.md.backup');
  } else {
    console.log('\nNo fixes to apply.');
  }
  
  // Handle Julie Zhuo - Medium blogs often require login, suggest removing or noting
  console.log('\n' + '='.repeat(80));
  console.log('\nNote about Julie Zhuo:');
  console.log('Medium blog URLs often return 403 without login.');
  console.log('Consider removing the blog URL or noting it requires login.');
  console.log('Medium blogs typically have RSS feeds at: https://medium.com/feed/@username');
}

fixURLs().catch(console.error);

