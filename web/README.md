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

## Content Location

The app reads markdown files from:
- `/content` at the repository root (general content)
- `/updates/daily/YYYY/` for daily research updates
- `/updates/monthly/` for monthly research summaries

See `/content/README.md` for details on file structure and frontmatter schema.

### Monthly Summaries

Monthly summaries are auto-generated using `scripts/generate-monthly-summary.js`. They include:
- Overview and statistics for the month
- Key themes extracted from daily updates
- List of daily updates with summaries and links
- Aggregated resources and links
- Monthly statistics

Generate or update monthly summaries:
```bash
node scripts/generate-monthly-summary.js  # All months
node scripts/generate-monthly-summary.js 2026 1  # Specific month
```

## Features

- **Dynamic Routing**: Markdown files automatically become pages
- **Monthly Navigation**: Sidebar organizes daily updates by month with monthly summaries
- **Monthly Summaries**: Aggregate summaries with key themes, resources, and links to daily updates
- **Sidebar Navigation**: Auto-generated from folder structure, grouped by months
- **Search**: Client-side search with keyword matching
- **Table of Contents**: Auto-generated from h2/h3 headings
- **Responsive Design**: Mobile-friendly with collapsible sidebar

