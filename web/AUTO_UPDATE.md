# Automatic Content Updates

The web app is configured to automatically update when new content is added or modified.

## How It Works

### Development Mode

In development mode (`npm run dev`), Next.js automatically:
- Watches for file changes
- Hot-reloads when content files change
- Updates the UI without manual refresh

**For automatic revalidation**, use the watch script:
```bash
npm run dev:watch
```

This runs both the dev server and a file watcher that triggers revalidation when content changes.

### Production Mode

The app uses **dynamic rendering** with:
- `dynamic = 'force-dynamic'` - Always renders fresh content
- `revalidate = 0` - Never caches, always checks for updates

This means:
- New markdown files appear immediately
- Updated files show changes right away
- No build step needed for content updates

## Manual Revalidation

If you need to manually trigger a revalidation:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"path": "/updates/daily/2025-12-30"}'
```

Or revalidate all content:
```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{}'
```

## File Watcher Script

The `scripts/watch-content.js` script monitors the `/content` directory and automatically triggers revalidation when:
- New markdown files are added
- Existing files are modified
- Files are deleted

**Usage:**
```bash
# Run alongside dev server
npm run dev:watch

# Or run separately
node scripts/watch-content.js
```

## Adding New Content

1. **Add a new markdown file** to `/content` (or subdirectory)
2. **Add YAML frontmatter** with at least a `title` field
3. **Save the file** - it will automatically appear in the app!

The sidebar, search, and all pages will update automatically.

## Notes

- In development, changes appear immediately
- The file watcher is optional but recommended for instant updates
- API routes (`/api/content/metadata`, `/api/search/index`) are also dynamic
- No restart needed when adding new content files

