/**
 * Adapters for fetching and parsing RSS feeds
 * 
 * These functions handle HTTP requests and RSS parsing.
 * They should be testable by injecting fetch/page operations.
 */

/**
 * Parse RSS/Atom feed content
 * @param {string} feedContent - Raw RSS/Atom XML content
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {{posts: import('../domain/types').Post[], error: string|null}}
 */
function parseRSSFeed(feedContent, options = {}) {
  const { daysBack = 30 } = options;
  
  try {
    const posts = [];
    
    // Try RSS format first
    let itemMatches = feedContent.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    let hasMatches = false;
    const allMatches = Array.from(itemMatches);
    
    // If no RSS items, try Atom format
    if (allMatches.length === 0) {
      itemMatches = feedContent.matchAll(/<entry>([\s\S]*?)<\/entry>/gi);
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
      let descriptionMatch = itemContent.match(/<description>(.*?)<\/description>/i);
      
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
            description: descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').substring(0, 300) : null,
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

/**
 * Fetch RSS feed using Puppeteer page
 * @param {Object} page - Puppeteer page object
 * @param {string} feedUrl - URL of the RSS feed
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {Promise<{posts: import('../domain/types').Post[], error: string|null}>}
 */
async function fetchRSSFeed(page, feedUrl, options = {}) {
  const { daysBack = 30 } = options;
  
  try {
    // Get the raw response text instead of rendered HTML
    const response = await page.goto(feedUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    const text = await response.text();
    
    return parseRSSFeed(text, { daysBack });
  } catch (error) {
    return { posts: [], error: error.message };
  }
}

/**
 * Find RSS feed URL from a blog URL
 * @param {Object} page - Puppeteer page object
 * @param {string} blogUrl - URL of the blog
 * @returns {Promise<string|null>}
 */
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
        const { URL } = require('url');
        return new URL(rssLink, blogUrl).href;
      } catch (e) {
        return rssLink.startsWith('http') ? rssLink : `${blogUrl}${rssLink}`;
      }
    }
    
    // Try common paths
    const commonPaths = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/atom.xml'];
    for (const path of commonPaths) {
      try {
        const { URL } = require('url');
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

module.exports = {
  parseRSSFeed,
  fetchRSSFeed,
  findRSSFeedFromBlog,
};

