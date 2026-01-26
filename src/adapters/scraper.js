/**
 * Adapters for web scraping using Puppeteer
 * 
 * These functions handle browser automation and DOM scraping.
 * They should be testable by injecting page objects.
 */

/**
 * Scrape blog posts from a blog URL
 * @param {Object} page - Puppeteer page object
 * @param {string} blogUrl - URL of the blog
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {Promise<import('../domain/types').Post[]>}
 */
async function scrapeBlogPosts(page, blogUrl, options = {}) {
  const { daysBack = 30 } = options;
  
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

/**
 * Scrape LinkedIn posts from a LinkedIn profile URL
 * @param {Object} page - Puppeteer page object
 * @param {string} linkedinUrl - URL of the LinkedIn profile
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {Promise<{posts: import('../domain/types').Post[], error: string|null}>}
 */
async function scrapeLinkedInPosts(page, linkedinUrl, options = {}) {
  const { daysBack = 30 } = options;
  
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

/**
 * Scrape Twitter/X posts from a Twitter handle
 * @param {Object} page - Puppeteer page object
 * @param {string} twitterHandle - Twitter handle (without @)
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {Promise<{posts: import('../domain/types').Post[], error: string|null}>}
 */
async function scrapeTwitterPosts(page, twitterHandle, options = {}) {
  const { daysBack = 30 } = options;

  try {
    const twitterUrl = `https://twitter.com/${twitterHandle}`;
    await page.goto(twitterUrl, { waitUntil: 'networkidle2', timeout: 8000 }); // Reduced timeout
    await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced wait
    
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

/**
 * Scrape changelog entries from a changelog URL
 * @param {Object} page - Puppeteer page object
 * @param {string} changelogUrl - URL of the changelog
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {Promise<import('../domain/types').UpdateItem[]>}
 */
async function scrapeChangelog(page, changelogUrl, options = {}) {
  const { daysBack = 14 } = options;
  
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

module.exports = {
  scrapeBlogPosts,
  scrapeLinkedInPosts,
  scrapeTwitterPosts,
  scrapeChangelog,
};

