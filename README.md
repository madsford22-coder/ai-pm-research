# AI Product Management Research Assistant

System of record and long-term memory for tracking AI product signals and translating them into actionable PM insights.

## Structure

- `context/` - Configuration files that define scope, priorities, and filters
  - `companies.md` - Tracked companies and their product areas
  - `people.md` - Tracked individuals and their roles
  - `prefs.md` - Research preferences and filters
  - `open-questions.md` - Open questions to investigate
- `updates/daily/YYYY/` - Daily research updates organized by year
  - Format: `YYYY-MM-DD.md`
- `updates/monthly/` - Monthly research summaries (executive-style, one-page)
  - Format: `YYYY-MM.md`
  - Auto-generated from daily updates using `scripts/generate-monthly-summary.js`
  - Includes top 3 themes and max 3 essential resources per month
- `src/` - Modular, testable source code (see [src/README.md](src/README.md))
  - `domain/` - Domain type definitions
  - `adapters/` - I/O adapters (markdown, RSS, scraping)
  - `transforms/` - Pure transform functions
  - `pipelines/` - Orchestration pipelines
  - `utils/` - Shared utilities (file ops, frontmatter, validation)
- `scripts/` - Thin wrapper scripts (CLI entry points)
- `tooling/` - Legacy scripts (deprecated, use `scripts/` instead)

## Operating Principles

- Prefer shipped product changes over announcements
- Separate facts from interpretation
- Ignore anything that does not meaningfully inform product decisions
- Optimize for PM usefulness, not novelty

## Required Synthesis Format

Every item must answer:
- **PM Takeaway**: Brief summary
- **User problem impacted**: What user need does this address/change
- **Product surface area**: What part of the product ecosystem is affected
- **Decision this informs**: What product decision does this signal inform
- **Pattern to note**: Any broader pattern or trend this represents

## Daily Output

- Maximum 3–5 items per day
- It is acceptable (and correct) to output "No meaningful PM-relevant updates today"
- Never dump raw research—only curated, synthesized markdown

## Development

### Running Scripts

```bash
# Check people activity
node scripts/check-people-activity.js --days 30

# Check company updates
node scripts/check-company-updates.js --days 14

# Find RSS feeds
node scripts/find-rss-feeds.js

# Generate monthly summaries (from daily updates)
node scripts/generate-monthly-summary.js
# Or for a specific month:
node scripts/generate-monthly-summary.js 2026 1
```

### Testing

```bash
# JavaScript tests
cd tooling && npm test

# Python tests
pytest tooling/
```

### Web App

The repository includes a Next.js web app for browsing markdown content:

```bash
cd web
npm install
npm run dev
```

See [web/README.md](web/README.md) for details. The web app reads markdown files from `/content` at the repository root. See [content/README.md](content/README.md) for information on migrating existing markdown files.

**Development Notes**: See [web/DEVELOPMENT_NOTES.md](web/DEVELOPMENT_NOTES.md) for important learnings about Tailwind CSS, TypeScript patterns, UI/UX best practices, and more.

See [MIGRATION.md](MIGRATION.md) for details on the modular architecture.

<!-- Deploy test: 2026-01-25 -->
