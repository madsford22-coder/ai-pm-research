# Web App Setup Guide

This document provides instructions for running and using the Next.js web app.

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
npm start
```

## File Tree of /web

```
web/
├── app/                          # Next.js App Router
│   ├── [[...slug]]/              # Dynamic route for markdown pages
│   │   └── page.tsx
│   ├── api/                      # API routes
│   │   ├── content/
│   │   │   └── metadata/
│   │   │       └── route.ts      # Content metadata API
│   │   └── search/
│   │       └── index/
│   │           └── route.ts       # Search index API
│   ├── globals.css                # Global styles + markdown prose styles
│   ├── layout.tsx                 # Root layout with sidebar
│   ├── not-found.tsx              # 404 page
│   └── page.tsx                   # Home page (renders /content/index.md)
├── components/                    # React components
│   ├── Search.tsx                 # Client-side search component
│   ├── Sidebar.tsx                # Auto-generated navigation sidebar
│   └── TableOfContents.tsx        # TOC for h2/h3 headings
├── lib/
│   └── content/                   # Content processing utilities
│       ├── loader.ts              # File system operations
│       ├── parser.ts              # Markdown → HTML conversion
│       └── types.ts               # TypeScript definitions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Content Location

Markdown files should be placed in `/content` at the repository root (not inside `/web`).

The app reads from: `/Users/madisonford/Documents/ai-pm-research/content/`

## Frontmatter Schema

Each markdown file should include YAML frontmatter at the top:

```yaml
---
title: Page Title                    # Required: Display title
date: 2025-12-29                     # Optional: Publication date
tags:                                 # Optional: Array of tags
  - tag1
  - tag2
summary: Brief description            # Optional: Used in search results
source_url: https://example.com      # Optional: Original source URL
---
```

### Required Fields
- `title`: Display title for the page (used in navigation and page header)

### Optional Fields
- `date`: Publication or last updated date (ISO format: YYYY-MM-DD)
- `tags`: Array of strings for categorization
- `summary`: Brief description (used in search results)
- `source_url`: Original source URL if applicable

## How to Add a New Page

1. Create a markdown file in `/content` (or a subdirectory)
2. Add YAML frontmatter with at least a `title` field
3. Write your markdown content below the frontmatter
4. The file will automatically become a page at the corresponding URL

### Examples

**File:** `/content/updates/2025-12-30.md`
```yaml
---
title: Daily Update - December 30, 2025
date: 2025-12-30
tags:
  - daily
  - updates
summary: Today's research findings
---
# Content here...
```

**URL:** `/updates/2025-12-30`

**File:** `/content/context/people.md`
```yaml
---
title: Tracked People
tags:
  - context
  - people
---
# Content here...
```

**URL:** `/context/people`

**File:** `/content/index.md`
```yaml
---
title: Home
---
# Content here...
```

**URL:** `/` (home page)

## Routing Rules

- Folder structure determines URL structure
- `/content/index.md` → `/` (home)
- `/content/ai/tools/foo.md` → `/ai/tools/foo`
- File names become URL slugs (without `.md` extension)

## Known Limitations

1. **Content Migration**: Existing markdown files in `context/`, `updates/`, etc. need to be manually migrated to `/content` with frontmatter added. See `/content/README.md` for migration notes.

2. **Build-time Processing**: Markdown is processed at build time (for static generation) and request time (for dynamic routes). Large content directories may slow down builds.

3. **Search Index**: Search index is built on-demand via API route. For better performance, consider pre-building the index at build time.

4. **Markdown Features**: Currently supports:
   - Standard markdown syntax
   - GitHub Flavored Markdown (tables, strikethrough, etc.)
   - Code blocks with syntax highlighting (via rehype)
   - Headings with auto-generated IDs and anchor links

5. **No Image Support**: Images in markdown are not currently optimized. Consider using Next.js Image component for production.

## Next Improvements

1. **Pre-build Search Index**: Generate search index at build time instead of on-demand
2. **Image Optimization**: Add Next.js Image component support for markdown images
3. **Dark Mode**: Add theme toggle for dark/light mode
4. **Breadcrumbs**: Add breadcrumb navigation for nested content
5. **Tag Pages**: Create tag index pages for browsing by tag
6. **Date-based Filtering**: Add date range filters for updates
7. **Full-text Search**: Upgrade to more sophisticated search (e.g., Fuse.js)
8. **RSS Feed**: Generate RSS feed from content
9. **Sitemap**: Auto-generate sitemap.xml
10. **Content Validation**: Add validation for required frontmatter fields

## Troubleshooting

### Content Not Appearing

- Check that files are in `/content` (repo root, not `/web/content`)
- Verify frontmatter is valid YAML
- Check browser console for errors
- Ensure file has `.md` extension

### Search Not Working

- Check that API route `/api/search/index` is accessible
- Verify markdown files have content (not just frontmatter)
- Check browser console for errors

### Sidebar Not Loading

- Check that API route `/api/content/metadata` is accessible
- Verify at least one markdown file exists in `/content`
- Check browser console for errors

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Check that `/content` directory exists
- Verify TypeScript types are correct: `npm run build`

