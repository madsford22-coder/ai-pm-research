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

The app reads markdown files from `/content` at the repository root. See `/content/README.md` for details on file structure and frontmatter schema.

## Features

- **Dynamic Routing**: Markdown files automatically become pages
- **Sidebar Navigation**: Auto-generated from folder structure
- **Search**: Client-side search with keyword matching
- **Table of Contents**: Auto-generated from h2/h3 headings
- **Responsive Design**: Mobile-friendly with collapsible sidebar

