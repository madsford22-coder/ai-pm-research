#!/usr/bin/env node
/**
 * @deprecated This script has been replaced by the modular version.
 * Please use: node scripts/check-people-activity.js
 * 
 * Check recent activity from tracked people across blogs, LinkedIn, and Twitter/X
 * Uses Puppeteer to scrape content when RSS feeds aren't available
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

const PROJECT_ROOT = path.join(__dirname, '..');
const PEOPLE_FILE = path.join(PROJECT_ROOT, 'context', 'people.md');

const DEFAULT_DAYS_BACK = 30;

function parsePeopleFile() {
  const content = fs.readFileSync(PEOPLE_FILE, 'utf-8');
  const people = [];
  
  const sections = content.split(/\n## /);
  
  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const name = lines[0].trim();
    
    const person = {
      name,
      blog: null,
      rss_feed: null,
      linkedin: null,
      twitter: null,
    };
    
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
      if (line.includes('LinkedIn:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.linkedin = match[0];
        }
      }
      if (line.includes('Twitter/X:') || line.includes('Twitter:')) {
        const match = line.match(/@[\w]+/);
        if (match) {
          person.twitter = match[0].replace('@', '');
        }
      }
    }
    
    people.push(person);
  }
  
  return people;
}

async function checkRSSFeed(page, feedUrl, daysBack = DEFAULT_DAYS_BACK) {
  try {
    // Get the raw response text instead of rendered HTML
    const response = await page.goto(feedUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    const text = await response.text();
    
    // Simple RSS/Atom parsing
    const posts = [];
    
    // Try RSS format first
    let itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    let hasMatches = false;
    const allMatches = Array.from(itemMatches);
    
    // If no RSS items, try Atom format
    if (allMatches.length === 0) {
      itemMatches = text.matchAll(/<entry>([\s\S]*?)<\/entry>/gi);
      allMatches.push(...Array.from(itemMatches));
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    for (const match of allMatches) {
      const itemContent = match[1];
      
      // RSS format
      let titleMatch = itemContent.match(/<title>(.*?)<\/title>/i);
      let linkMatch = itemContent.match(/<link>(.*?)<\/link>/i);
      let pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/i);
      
      // Atom format fallback
      if (!titleMatch) titleMatch = itemContent.match(/<title[^>]*>(.*?)<\/title>/i);
      if (!linkMatch) {
        // Atom links can be in <link href="..."/> format
        const linkEl = itemContent.match(/<link[^>]*href=["']([^"']+)["']/i);
        if (linkEl) linkMatch = [null, linkEl[1]];
      }
      if (!pubDateMatch) pubDateMatch = itemContent.match(/<published>(.*?)<\/published>/i);
      if (!pubDateMatch) pubDateMatch = itemContent.match(/<updated>(.*?)<\/updated>/i);
      
      if (titleMatch && linkMatch) {
        const link = linkMatch[1] || linkMatch[0];
        const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : null;
        if (!pubDate || pubDate >= cutoffDate) {
          posts.push({
            title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim(),
            link: link.replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim(),
            published: pubDate ? pubDate.toISOString() : null,
            source: 'blog_rss',
          });
        }
      }
      if (posts.length >= 10) break;
    }
    
    return { posts, error: null };
  } catch (error) {
    return { posts: [], error: error.message };
  }
}

async function scrapeBlogPosts(page, blogUrl, daysBack = DEFAULT_DAYS_BACK) {
  try {
    await page.goto(blogUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const posts = await page.evaluate((cutoffTimestamp) => {
      const results = [];
      const cutoffDate = new Date(cutoffTimestamp);
      
      // Look for common blog post patterns
      const selectors = [
        'article',
        '.post',
        '.blog-post',
        '[class*="post"]',
        '[class*="article"]',
        'h2 a',
        'h3 a',
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        
        for (const el of elements) {
          let title = '';
          let link = '';
          let date = null;
          
          // Try to get link
          const linkEl = el.querySelector('a') || (el.tagName === 'A' ? el : null);
          if (linkEl) {
            link = linkEl.href;
            title = linkEl.textContent.trim();
          } else {
            title = el.textContent.trim();
          }
          
          // Try to find date nearby
          const parent = el.closest('article, .post, [class*="post"]') || el.parentElement;
          if (parent) {
            const dateEl = parent.querySelector('time, .date, [class*="date"], [datetime]');
            if (dateEl) {
              const dateStr = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
              if (dateStr) {
                date = new Date(dateStr);
              }
            }
          }
          
          if (title && link && title.length > 10) {
            // Only include if date is recent or no date found (include it)
            if (!date || date >= cutoffDate) {
              results.push({
                title: title.substring(0, 200),
                link: link,
                published: date ? date.toISOString() : null,
              });
            }
          }
        }
        
        if (results.length > 0) break;
      }
      
      return results.slice(0, 10);
    }, cutoffDate.getTime());
    
    return posts.map(post => ({ ...post, source: 'blog_scrape' }));
  } catch (error) {
    console.error(`  ✗ Error scraping blog ${blogUrl}: ${error.message}`);
    return [];
  }
}

async function scrapeLinkedInPosts(page, linkedinUrl, daysBack = DEFAULT_DAYS_BACK) {
  try {
    // LinkedIn requires login for most content, but we can try public profile
    // Note: This will be limited without authentication
    await page.goto(linkedinUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // LinkedIn often shows a login wall or limited content
    const hasLoginWall = await page.evaluate(() => {
      return document.body.textContent.includes('Sign in') || 
             document.body.textContent.includes('Join LinkedIn') ||
             document.querySelector('.feed-container') === null;
    });
    
    if (hasLoginWall) {
      return { posts: [], error: 'LinkedIn login required (public scraping limited)' };
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const posts = await page.evaluate((cutoffTimestamp) => {
      const results = [];
      const cutoffDate = new Date(cutoffTimestamp);
      
      // Look for LinkedIn post containers
      const postElements = document.querySelectorAll('.feed-shared-update-v2, .occludable-update, [data-urn*="activity"]');
      
      for (const postEl of postElements) {
        const textEl = postEl.querySelector('.feed-shared-text, .update-components-text');
        const timeEl = postEl.querySelector('time, [datetime]');
        const linkEl = postEl.querySelector('a[href*="/activity-"]');
        
        if (textEl && linkEl) {
          const text = textEl.textContent.trim();
          const link = linkEl.href;
          const timeStr = timeEl ? (timeEl.getAttribute('datetime') || timeEl.textContent.trim()) : null;
          
          let postDate = null;
          if (timeStr) {
            // Parse relative times like "2 days ago" or absolute dates
            postDate = new Date(timeStr);
            if (isNaN(postDate.getTime())) {
              // Try to parse relative time (this is simplified)
              const match = timeStr.match(/(\d+)\s*(day|days|hour|hours|week|weeks)/);
              if (match) {
                const num = parseInt(match[1]);
                const unit = match[2];
                postDate = new Date();
                if (unit.includes('day')) postDate.setDate(postDate.getDate() - num);
                else if (unit.includes('hour')) postDate.setHours(postDate.getHours() - num);
                else if (unit.includes('week')) postDate.setDate(postDate.getDate() - (num * 7));
              }
            }
          }
          
          if (text && text.length > 20 && (!postDate || postDate >= cutoffDate)) {
            results.push({
              title: text.substring(0, 200),
              link: link,
              published: postDate ? postDate.toISOString() : null,
            });
          }
        }
      }
      
      return results.slice(0, 10);
    }, cutoffDate.getTime());
    
    return { posts: posts.map(post => ({ ...post, source: 'linkedin' })), error: null };
  } catch (error) {
    return { posts: [], error: error.message };
  }
}

async function scrapeTwitterPosts(page, twitterHandle, daysBack = DEFAULT_DAYS_BACK) {
  try {
    const twitterUrl = `https://twitter.com/${twitterHandle}`;
    await page.goto(twitterUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for login wall
    const hasLoginWall = await page.evaluate(() => {
      return document.body.textContent.includes('Sign in to Twitter') ||
             document.body.textContent.includes('Create account') ||
             document.querySelector('[data-testid="tweet"]') === null;
    });
    
    if (hasLoginWall) {
      return { posts: [], error: 'Twitter login required (public scraping limited)' };
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    const tweets = await page.evaluate((cutoffTimestamp) => {
      const results = [];
      const cutoffDate = new Date(cutoffTimestamp);
      
      // Look for tweet elements
      const tweetElements = document.querySelectorAll('[data-testid="tweet"], article[data-testid="tweet"]');
      
      for (const tweetEl of tweetElements) {
        const textEl = tweetEl.querySelector('[data-testid="tweetText"]');
        const timeEl = tweetEl.querySelector('time');
        const linkEl = tweetEl.querySelector('a[href*="/status/"]');
        
        if (textEl && timeEl) {
          const text = textEl.textContent.trim();
          const timeStr = timeEl.getAttribute('datetime');
          const link = linkEl ? linkEl.href : (timeEl.closest('a') ? timeEl.closest('a').href : null);
          
          if (timeStr) {
            const tweetDate = new Date(timeStr);
            if (tweetDate >= cutoffDate && text.length > 10) {
              results.push({
                title: text.substring(0, 280),
                link: link || `https://twitter.com${linkEl?.pathname || ''}`,
                published: tweetDate.toISOString(),
              });
            }
          }
        }
      }
      
      return results.slice(0, 20);
    }, cutoffDate.getTime());
    
    return { posts: tweets.map(tweet => ({ ...tweet, source: 'twitter' })), error: null };
  } catch (error) {
    return { posts: [], error: error.message };
  }
}

async function checkPersonActivity(browser, person, daysBack) {
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
      const { posts, error } = await checkRSSFeed(page, person.rss_feed, daysBack);
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
      const posts = await scrapeBlogPosts(page, person.blog, daysBack);
      activity.posts.push(...posts);
      console.log(`    Found ${posts.length} posts from blog scrape`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Check LinkedIn if available
    if (person.linkedin) {
      console.log(`  Checking LinkedIn: ${person.linkedin}`);
      const { posts, error } = await scrapeLinkedInPosts(page, person.linkedin, daysBack);
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
      const { posts, error } = await scrapeTwitterPosts(page, person.twitter, daysBack);
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

async function main() {
  const args = process.argv.slice(2);
  const daysBack = args.includes('--days') 
    ? parseInt(args[args.indexOf('--days') + 1]) 
    : DEFAULT_DAYS_BACK;
  const format = args.includes('--format') 
    ? args[args.indexOf('--format') + 1] 
    : 'markdown';
  
  console.log(`Checking people activity from last ${daysBack} days...\n`);
  
  const people = parsePeopleFile();
  console.log(`Found ${people.length} people to check\n`);
  
  // Use a temporary user data directory
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
  
  const allActivity = [];
  
  for (const person of people) {
    const activity = await checkPersonActivity(browser, person, daysBack);
    allActivity.push(activity);
  }
  
  await browser.close();
  
  // Clean up
  try {
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  } catch (e) {}
  
  // Filter to only recent posts
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  for (const activity of allActivity) {
    activity.posts = activity.posts.filter(post => {
      if (!post.published) return true; // Include posts without dates
      return new Date(post.published) >= cutoffDate;
    });
    // Sort by date, most recent first
    activity.posts.sort((a, b) => {
      if (!a.published) return 1;
      if (!b.published) return -1;
      return new Date(b.published) - new Date(a.published);
    });
  }
  
  // Output results
  if (format === 'json') {
    console.log(JSON.stringify(allActivity, null, 2));
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('# People Activity Report\n');
    
    const active = allActivity.filter(a => a.posts.length > 0);
    const inactive = allActivity.filter(a => a.posts.length === 0);
    
    console.log(`## Active People (${active.length})\n`);
    for (const activity of active) {
      console.log(`### ${activity.name}`);
      console.log(`**Posts:** ${activity.posts.length}`);
      
      // Group by source
      const bySource = {};
      for (const post of activity.posts) {
        if (!bySource[post.source]) bySource[post.source] = [];
        bySource[post.source].push(post);
      }
      
      for (const [source, posts] of Object.entries(bySource)) {
        console.log(`\n**From ${source}:**`);
        for (const post of posts.slice(0, 5)) {
          const date = post.published ? new Date(post.published).toISOString().split('T')[0] : 'No date';
          console.log(`- [${post.title.substring(0, 60)}...](${post.link}) (${date})`);
        }
      }
      console.log('');
    }
    
    console.log(`\n## Inactive People (${inactive.length})\n`);
    for (const activity of inactive) {
      console.log(`- ${activity.name}`);
      if (activity.errors.length > 0) {
        console.log(`  - Errors: ${activity.errors.join('; ')}`);
      }
    }
  }
}

main().catch(console.error);

