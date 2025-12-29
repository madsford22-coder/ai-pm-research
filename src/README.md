# Source Code Structure

This directory contains the modular, testable source code for the AI PM Research system.

## Architecture

The code is organized into 4 layers following a clean architecture pattern:

### 1. Domain Types (`domain/`)
Pure data structures that represent the business domain:
- `types.js` - JSDoc type definitions for Person, Company, Post, UpdateItem, etc.

### 2. Adapters (`adapters/`)
Functions that handle I/O and external dependencies:
- `markdown.js` - Parse markdown files (people.md, companies.md)
- `rss.js` - Fetch and parse RSS/Atom feeds
- `scraper.js` - Web scraping using Puppeteer

These should be testable by injecting dependencies (e.g., file reading, page objects).

### 3. Pure Transforms (`transforms/`)
Pure functions (no side effects) for data transformation:
- `filter.js` - Filter by date, deduplicate
- `sort.js` - Sort by date
- `format.js` - Format output as markdown or JSON

These are easily unit-testable.

### 4. Pipelines (`pipelines/`)
Orchestration functions that combine adapters and transforms:
- `people-activity.js` - Check activity from tracked people
- `company-updates.js` - Check updates from tracked companies
- `find-rss-feeds.js` - Find RSS feeds for people's blogs

## Testing

### JavaScript Tests
Run with Jest:
```bash
cd tooling
npm test
```

Tests are in `__tests__/` directories next to the code they test.

### Python Tests
Run with pytest:
```bash
pytest tooling/
```

## Key Principles

1. **Scripts are thin wrappers** - Scripts in `scripts/` only parse args and call pipeline functions
2. **No side effects in core functions** - Pure transforms are easily testable
3. **Dependency injection** - Adapters accept options for injecting test doubles
4. **Separation of concerns** - Each layer has a single responsibility

## Adding New Features

1. Define domain types in `domain/types.js`
2. Create adapters in `adapters/` for any I/O
3. Create pure transforms in `transforms/` for data manipulation
4. Create pipeline in `pipelines/` to orchestrate
5. Create thin script wrapper in `scripts/` if needed
6. Add unit tests in `__tests__/` directories

