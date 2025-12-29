# People Activity Tracking Guide

This guide explains how to track activity from people across blogs, LinkedIn, and Twitter/X using Puppeteer.

## Overview

The `check-people-activity.js` script extends beyond RSS feeds to track activity across multiple platforms:

1. **Blogs** - RSS feeds (preferred) or web scraping (fallback)
2. **LinkedIn** - Scraping public profile posts
3. **Twitter/X** - Scraping public profile tweets

## Usage

```bash
cd tooling
node check-people-activity.js --days 30 --format markdown
```

Options:
- `--days N` - Number of days back to check (default: 30)
- `--format json|markdown` - Output format (default: markdown)

## How It Works

### 1. RSS Feeds (Preferred)

For people with RSS feeds configured:
- Parses RSS/Atom XML feeds
- Extracts posts with titles, links, and publication dates
- Filters posts within the date range

**Advantages:**
- Fast and reliable
- Structured data
- No scraping needed

### 2. Blog Scraping (Fallback)

For people with blogs but no RSS feeds:
- Uses Puppeteer to visit the blog homepage
- Looks for common blog post patterns (articles, post containers)
- Extracts titles, links, and dates
- Filters by date range

**Limitations:**
- Less reliable than RSS (site structure changes)
- May miss posts if site structure is unusual
- Slower than RSS feeds

### 3. LinkedIn Scraping

For people with LinkedIn profiles:
- Uses Puppeteer to visit public LinkedIn profile
- Attempts to scrape recent posts/activity

**Important Limitations:**
- **LinkedIn requires authentication for most content** - public scraping is very limited
- Most profiles show a login wall or limited content without authentication
- For reliable LinkedIn tracking, you would need:
  - LinkedIn API access (limited availability)
  - Authenticated browser session
  - Third-party service with LinkedIn access

**Current Status:** This is included but will likely show "login required" errors for most profiles.

### 4. Twitter/X Scraping

For people with Twitter/X handles:
- Uses Puppeteer to visit `twitter.com/@username`
- Attempts to scrape recent tweets

**Important Limitations:**
- **Twitter/X requires authentication for most content** - public scraping is limited
- Twitter shows a login wall for unauthenticated access
- For reliable Twitter tracking, you would need:
  - Twitter API access (requires API keys)
  - Authenticated browser session
  - Third-party service with Twitter access

**Current Status:** This is included but will likely show "login required" errors for most profiles.

## Platform-Specific Notes

### LinkedIn

**Challenges:**
- Login walls block most content
- Dynamic loading requires waiting for content
- Anti-scraping measures
- Limited public content

**Alternatives:**
1. **LinkedIn API** (if you can get access)
2. **Manual checking** - Set up LinkedIn alerts
3. **Third-party services** - Brandwatch, Sprout Social, etc.
4. **Focus on blogs/newsletters** - Many thought leaders post on blogs more than LinkedIn

### Twitter/X

**Challenges:**
- Login walls block most content
- Rate limiting
- Anti-scraping measures
- Dynamic content loading

**Alternatives:**
1. **Twitter API** (requires API keys)
2. **Twitter RSS feeds** - Some third-party services provide RSS for Twitter accounts
3. **Nitter instances** - Public Twitter mirrors (may violate ToS)
4. **Manual checking** - For high-priority people
5. **Focus on blogs/newsletters** - Many thought leaders cross-post important content

## Recommendations

### For Most Reliable Tracking

1. **Prioritize RSS feeds:**
   - Use `find-rss-feeds.js` to discover RSS feeds
   - Most blogs have RSS feeds available
   - Many newsletters (Substack, etc.) have RSS feeds

2. **Use blog scraping as fallback:**
   - When RSS feed isn't available
   - Works for most standard blog platforms

3. **Consider alternatives for social media:**
   - Many thought leaders cross-post to blogs/newsletters
   - Focus on platforms they actively use (if they blog, prioritize that)
   - Use manual checking for high-priority social-only people

### For People Without RSS Feeds

Run the RSS feed finder:
```bash
node find-rss-feeds.js
```

This will:
- Visit blog homepages
- Look for RSS feed links
- Try common RSS feed paths
- Output discovered feeds for adding to `people.md`

## Example Output

```
Checking people activity from last 30 days...

Checking Lenny Rachitsky...
  Checking RSS feed: https://www.lennysnewsletter.com/feed
    Found 10 posts from RSS

Checking Shreyas Doshi...
  Checking RSS feed: https://shreyas.io/feed
    Found 0 posts from RSS
  Checking Twitter/X: @shreyas
    Found 15 posts from Twitter/X

## Active People (2)

### Lenny Rachitsky
**Posts:** 10
**From blog_rss:**
- [Post title 1...](url) (2025-12-28)
- [Post title 2...](url) (2025-12-27)
```

## Future Enhancements

Potential improvements:

1. **Twitter API integration** - If API keys are available
2. **LinkedIn API integration** - If API access is available
3. **Caching** - Cache results to avoid re-scraping
4. **Better error handling** - More graceful handling of login walls
5. **Authentication support** - Optional browser session persistence for authenticated access
6. **RSS feed discovery** - Automatically discover RSS feeds during checks

## Troubleshooting

### "LinkedIn login required" errors

This is expected - LinkedIn blocks most public scraping. Options:
- Focus on blog/newsletter content instead
- Use manual checking for LinkedIn
- Consider LinkedIn API if available

### "Twitter login required" errors

This is expected - Twitter blocks most public scraping. Options:
- Use Twitter API if you have access
- Focus on blog content
- Use manual checking for high-priority people

### RSS feed errors

- Verify the RSS feed URL is correct
- Check if the feed is publicly accessible
- Try visiting the feed URL in a browser
- Use `find-rss-feeds.js` to discover correct feed URLs

### Blog scraping returns no posts

- The blog structure may not match common patterns
- Try checking the blog manually to see its structure
- Consider finding an RSS feed instead
- The person may not have posted recently

## Integration with Daily Research

Update your daily research workflow:

1. **Check people activity:**
   ```bash
   node tooling/check-people-activity.js --days 14 --format markdown
   ```

2. **Review output** for recent posts from tracked people

3. **For items that meet quality bar**, read full content and include in daily update

4. **Combine with company updates** for comprehensive daily research

