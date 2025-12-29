# Tooling

Tools and scripts for the AI PM Research Assistant.

## New Modular Structure

The codebase has been refactored to a modular, testable architecture. **Use the new scripts in `../scripts/`**:

- `scripts/check-people-activity.js` - Check activity from tracked people
- `scripts/check-company-updates.js` - Check updates from tracked companies
- `scripts/find-rss-feeds.js` - Find RSS feeds for people's blogs

See [../src/README.md](../src/README.md) for architecture details.

## Legacy Scripts (Deprecated)

The following scripts in this directory are deprecated but kept for reference:
- `check-people-activity.js` → Use `scripts/check-people-activity.js`
- `check-company-updates.js` → Use `scripts/check-company-updates.js`
- `find-rss-feeds.js` → Use `scripts/find-rss-feeds.js`

## Setup

### JavaScript Dependencies

```bash
npm install
```

### Python Dependencies

```bash
pip install -r requirements.txt
```

Or install individually:

```bash
pip install feedparser requests beautifulsoup4 pytest pytest-cov
```

## Usage

### Check People Activity

```bash
# Using new modular script
node ../scripts/check-people-activity.js --days 30

# Or using npm script
npm run check-people
```

### Check Company Updates

```bash
# Using new modular script
node ../scripts/check-company-updates.js --days 14

# Or using npm script
npm run check-companies
```

### Find RSS Feeds

```bash
# Using new modular script
node ../scripts/find-rss-feeds.js

# Or using npm script
npm run find-feeds
```

### Python Scripts

Some Python scripts are still available:

```bash
# Check recent posts (Python version)
python3 check-recent-posts.py --days 14

# Check company updates (Python version)
python3 check-company-updates.py --days 7
```

## Testing

### JavaScript Tests

```bash
npm test
```

Runs Jest tests for the modular code in `../src/`.

### Python Tests

```bash
pytest ../tooling/
```

Runs pytest tests for Python code.

## Other Scripts

### Utility Scripts

- `verify-people-urls.js` - Verify URLs in people.md
- `fix-people-urls.js` - Fix invalid URLs in people.md
- `check-company-news.js` - Check news mentions (not yet modularized)

### Documentation

- `COMPANY_UPDATES_GUIDE.md` - Guide for company updates automation
- `PEOPLE_ACTIVITY_TRACKING.md` - Guide for people activity tracking

## Architecture

The codebase follows a 4-layer architecture:

1. **Domain** (`../src/domain/`) - Type definitions
2. **Adapters** (`../src/adapters/`) - I/O (markdown, RSS, scraping)
3. **Transforms** (`../src/transforms/`) - Pure functions (filter, sort, format)
4. **Pipelines** (`../src/pipelines/`) - Orchestration functions

Scripts in `../scripts/` are thin wrappers that parse args and call pipelines.

See [../src/README.md](../src/README.md) for more details.
