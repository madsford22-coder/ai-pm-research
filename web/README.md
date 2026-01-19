# Web App

Next.js web application for browsing markdown content.

## Setup

```bash
cd web
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
npm start
```

## Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - React components (Sidebar, Search, TableOfContents)
- `/lib/content` - Content processing utilities
  - `loader.ts` - File system operations for loading markdown
  - `parser.ts` - Markdown parsing and HTML conversion
  - `types.ts` - TypeScript type definitions

See `DEVELOPMENT_NOTES.md` for important learnings and development patterns.

## Content Location

The app reads markdown files from:
- `/content` at the repository root (general content)
- `/updates/daily/YYYY/` for daily research updates
- `/updates/monthly/` for monthly research summaries

See `/content/README.md` for details on file structure and frontmatter schema.

### Monthly Summaries

Monthly summaries are auto-generated executive-style summaries using `scripts/generate-monthly-summary.js`. They are concise, one-page summaries (chief of staff style) that include:
- Executive summary paragraph synthesizing key themes
- "What Matters" section with top 3 themes
- "Essential Resources" section with max 3 links to most important resources
- Footer with link to view all daily updates for the month

Generate or update monthly summaries:
```bash
node scripts/generate-monthly-summary.js  # All months
node scripts/generate-monthly-summary.js 2026 1  # Specific month
```

## Features

- **Dynamic Routing**: Markdown files automatically become pages
- **Monthly Navigation**: Sidebar shows months (e.g., "January 2026", "December 2025") linking directly to executive-style monthly summaries
- **Dashboard**: Home page shows latest daily updates with quick links
- **Monthly Summaries**: Executive-style one-page summaries with top 3 themes and max 3 essential resources
- **Sidebar Navigation**: Auto-generated from folder structure, organized chronologically by month (newest first)
- **Search**: Client-side search with keyword matching
- **Table of Contents**: Auto-generated from h2/h3 headings
- **Responsive Design**: Mobile-friendly with collapsible sidebar

