# Content Directory

This directory contains the markdown files that power the web app.

## Structure

Markdown files in this directory will be automatically converted to web pages. The folder structure determines the URL routing:

- `/content/index.md` → `/` (home page)
- `/content/ai/tools/foo.md` → `/ai/tools/foo`
- `/content/updates/2025-12-29.md` → `/updates/2025-12-29`

## Frontmatter Schema

Each markdown file should include YAML frontmatter at the top:

```yaml
---
title: Page Title
date: 2025-12-29
tags:
  - tag1
  - tag2
summary: A brief summary of the content
source_url: https://example.com
---
```

### Required Fields
- `title`: Display title for the page (used in navigation and page header)

### Optional Fields
- `date`: Publication or last updated date
- `tags`: Array of tags for categorization
- `summary`: Brief description (used in search results)
- `source_url`: Original source URL if applicable

## Migration Note

**Current markdown files are located in:**
- `context/` - Configuration and context files
- `updates/daily/YYYY/` - Daily research updates
- `research/` - Research prompts and documentation
- Root level - Various documentation files (README.md, MIGRATION.md, etc.)

To migrate existing markdown files:
1. Copy files from their current locations to `/content`
2. Add YAML frontmatter with at least a `title` field
3. Organize files in folders as desired (folder structure becomes URL structure)

Example migration:
- `context/people.md` → `/content/context/people.md` (add frontmatter)
- `updates/daily/2025/2025-12-29.md` → `/content/updates/daily/2025-12-29.md` (add frontmatter)

