# Company Updates Automation Guide

This guide explains how to automatically check for product updates from tracked companies, similar to how we check posts from tracked people.

## Overview

We now have two scripts for checking company updates:

1. **`check-company-updates.js`** - Checks official sources (blogs, changelogs)
2. **`check-company-news.js`** - Searches for news mentions (web search)

## Scripts

### check-company-updates.js

**What it does:**
- Parses `context/companies.md` to find companies and their primary sources
- Automatically finds and checks RSS feeds from company blogs
- Scrapes changelog pages for recent entries
- Extracts dates and content from recent updates

**Usage:**
```bash
cd tooling
node check-company-updates.js --days 14 --format markdown
```

**What it checks:**
- Blog RSS feeds (auto-discovers if not listed)
- Changelog pages (scrapes for date-based entries)
- Primary sources listed in `companies.md`

**Output:**
- Markdown format (default) - grouped by company
- JSON format (with `--format json`)

### check-company-news.js

**What it does:**
- Searches Google News for recent mentions of tracked companies
- Finds news articles about product updates, launches, features
- Useful for catching updates not in official blogs/changelogs

**Usage:**
```bash
cd tooling
node check-company-news.js --days 7 --format markdown
```

**What it checks:**
- Google News search results
- Filters for AI/product-related content

**Output:**
- Markdown format (default) - grouped by company
- JSON format (with `--format json`)

## Integration with Daily Research

Update your daily research workflow:

1. **Check people posts:**
   ```bash
   python3 tooling/check-recent-posts.py --days 14 --format markdown
   ```

2. **Check company updates:**
   ```bash
   node tooling/check-company-updates.js --days 14 --format markdown
   ```

3. **Check news mentions (optional):**
   ```bash
   node tooling/check-company-news.js --days 7 --format markdown
   ```

4. Review all outputs and synthesize into daily update

## LinkedIn Trends

**Current Status:** Not yet implemented

**Why it's challenging:**
- LinkedIn requires authentication for most content
- No public API for trending topics
- Anti-scraping measures make automation difficult

**Potential Solutions:**

1. **LinkedIn API** (if available):
   - Requires LinkedIn Developer account
   - Limited access to trending topics
   - May require enterprise partnership

2. **Third-party services:**
   - Brandwatch, Sprout Social, Hootsuite
   - Provide LinkedIn analytics APIs
   - Usually paid services

3. **Manual monitoring:**
   - Set up LinkedIn alerts for company names
   - Use LinkedIn's "Follow" feature
   - Check trending topics manually

4. **Alternative approach:**
   - Use Twitter/X trending topics (if API access available)
   - Monitor hashtags related to companies
   - Use news APIs that aggregate social signals

**Recommendation:**
For now, use `check-company-news.js` to catch news mentions, which often include LinkedIn discussions. For true LinkedIn trends, consider:
- Manual weekly review
- Setting up LinkedIn alerts
- Using a social media monitoring tool if budget allows

## How It Works

### Parsing companies.md

The scripts parse the "Primary sources" section from each company entry:

```markdown
## OpenAI
**Primary sources:**
- https://openai.com/blog
- https://platform.openai.com/docs/changelog
- @OpenAI on Twitter/X
```

The script automatically:
- Categorizes URLs (blog vs changelog)
- Finds RSS feeds for blogs
- Scrapes changelog pages

### RSS Feed Discovery

Similar to `find-rss-feeds.js` for people:
1. Checks for RSS link tags in HTML
2. Tries common paths (`/feed`, `/rss`, `/atom.xml`)
3. Validates RSS feed format

### Changelog Scraping

Uses Puppeteer to:
1. Load changelog pages
2. Wait for dynamic content
3. Find date-based entries
4. Extract titles, links, and descriptions

**Note:** Changelog scraping uses heuristics and may need tuning per site.

## Troubleshooting

### Scripts are slow
- They include delays to be respectful to servers
- Consider running overnight or in background
- You can reduce the number of companies checked

### Missing updates
- Some sites may block automated access
- Changelog formats vary - may need custom parsing
- RSS feeds may not be up-to-date

### Rate limiting
- Scripts include delays between requests
- If you hit limits, increase delays or reduce scope
- Consider using official APIs when available

## Future Enhancements

Potential improvements:
- [ ] LinkedIn API integration (when available)
- [ ] Twitter/X API integration
- [ ] News API integration (NewsAPI, etc.)
- [ ] Custom changelog parsers per site
- [ ] Caching to avoid re-checking same content
- [ ] Email/Slack notifications for important updates
- [ ] Filtering by keywords from "What to watch for"

## Example Workflow

```bash
# Morning research routine
cd ~/Documents/ai-pm-research

# Check people posts
python3 tooling/check-recent-posts.py --days 14 --format markdown > /tmp/people-posts.md

# Check company updates
node tooling/check-company-updates.js --days 14 --format markdown > /tmp/company-updates.md

# Check news (optional, slower)
node tooling/check-company-news.js --days 7 --format markdown > /tmp/company-news.md

# Review all outputs and create daily update
```


