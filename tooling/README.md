# Tooling

Tools and scripts for the AI PM Research Assistant.

## check-recent-posts.py

Script to check recent blog posts from tracked people in `context/people.md`.

### Setup

Install required dependencies:

```bash
pip install -r requirements.txt
```

Or install individually:

```bash
pip install feedparser requests beautifulsoup4
```

### Usage

Check recent posts from tracked people (last 7 days, default):

```bash
python3 tooling/check-recent-posts.py
```

Check posts from last 14 days:

```bash
python3 tooling/check-recent-posts.py --days 14
```

Output in markdown format:

```bash
python3 tooling/check-recent-posts.py --format markdown
```

### How it works

1. Parses `context/people.md` to find people with RSS feeds or blogs
2. Checks RSS feeds for recent posts (within specified days)
3. If no RSS feed is listed, attempts to find one by:
   - Checking common RSS feed paths (`/feed`, `/rss`, etc.)
   - Looking for RSS links in blog HTML
4. Outputs recent posts in JSON or Markdown format

### Output format

**JSON (default):**
```json
[
  {
    "name": "Shreyas Doshi",
    "posts": [
      {
        "title": "Post Title",
        "link": "https://...",
        "published": "2025-12-27T10:00:00",
        "summary": "Post summary..."
      }
    ],
    "errors": [],
    "sources_checked": {
      "rss_feed": "https://shreyas.io/feed",
      "blog": "https://shreyas.io"
    }
  }
]
```

**Markdown:**
```markdown
# Recent Posts from Tracked People

## Shreyas Doshi

### Post Title
**Link:** https://...
**Published:** 2025-12-27T10:00:00
**Summary:** Post summary...
```

### Adding RSS feeds to people.md

Add RSS feed URLs to entries in `context/people.md`:

```markdown
## Person Name
**Primary platforms:**
- Blog: https://example.com/blog
- RSS Feed: https://example.com/feed
```

If no RSS feed is listed, the script will attempt to find one automatically.

---

## find-rss-feeds.js

Script to automatically find RSS feed URLs for people in `context/people.md` using Puppeteer.

### Setup

Install Node.js dependencies:

```bash
cd tooling
npm install
```

This will install Puppeteer and Chromium.

### Usage

Find RSS feeds for all people with blogs but no RSS feeds listed:

```bash
cd tooling
node find-rss-feeds.js
```

Or use npm script:

```bash
npm run find-feeds
```

### How it works

1. Parses `context/people.md` to find people with blogs but no RSS feeds
2. Uses Puppeteer to visit each blog URL
3. Searches for RSS feed links in the HTML (link tags, anchor tags)
4. Tries common RSS feed paths (`/feed`, `/rss`, `/atom.xml`, etc.)
5. Outputs found RSS feeds in markdown format for easy copy-paste

### Output

The script outputs:
- Progress messages as it checks each blog
- Found RSS feeds in markdown format (ready to add to people.md)
- JSON format for programmatic use

Example output:
```
## Shreyas Doshi
- RSS Feed: https://shreyas.io/rss

## Lenny Rachitsky
- RSS Feed: https://www.lennysnewsletter.com/feed
```

### Notes

- The script visits each blog sequentially with a 1-second delay
- Some blogs may not have RSS feeds (especially if they're primarily social media)
- The script will skip blogs that already have RSS feeds listed

---

## check-company-updates.js

Script to check recent product updates from tracked companies in `context/companies.md` using Puppeteer.

### Setup

Install Node.js dependencies (if not already installed):

```bash
cd tooling
npm install
```

This will install Puppeteer and Chromium.

### Usage

Check recent updates from tracked companies (last 14 days, default):

```bash
cd tooling
node check-company-updates.js
```

Or use npm script:

```bash
npm run check-companies
```

Check updates from last 7 days:

```bash
node check-company-updates.js --days 7
```

Output in JSON format:

```bash
node check-company-updates.js --format json
```

### How it works

1. Parses `context/companies.md` to find companies and their primary sources
2. For each company:
   - Checks blog RSS feeds (finds RSS feeds automatically if not listed)
   - Scrapes changelog pages for recent entries
   - Extracts dates and content from recent updates
3. Outputs recent updates in Markdown or JSON format

### Output format

**Markdown (default):**
```markdown
# Recent Company Updates

## OpenAI
*Category: Foundation models / AI platforms*

### New GPT-4 Model Release
**Link:** https://openai.com/blog/...
**Published:** 2025-12-28T10:00:00
**Source:** blog (https://openai.com/blog)
**Summary:** OpenAI announced...
```

**JSON:**
```json
[
  {
    "company": "OpenAI",
    "category": "Foundation models / AI platforms",
    "title": "New GPT-4 Model Release",
    "link": "https://openai.com/blog/...",
    "published": "2025-12-28T10:00:00",
    "source": "blog",
    "sourceUrl": "https://openai.com/blog",
    "description": "OpenAI announced..."
  }
]
```

### What it checks

- **Blogs**: Automatically finds and checks RSS feeds from company blogs listed in `companies.md`
- **Changelogs**: Scrapes changelog pages for recent entries (looks for date patterns)
- **Primary sources**: Uses the "Primary sources" section from each company entry in `companies.md`

### Notes

- The script visits each source sequentially with delays to be respectful
- Changelog scraping uses heuristics to find recent entries (may need tuning per site)
- Some sites may require authentication or have anti-scraping measures
- The script respects rate limits with delays between requests

### Future enhancements

Potential additions:
- LinkedIn trending topics (requires LinkedIn API or scraping)
- News search integration (via news APIs)
- Twitter/X monitoring (requires API access)
- More sophisticated changelog parsing per site

