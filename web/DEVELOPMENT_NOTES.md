# Development Notes & Learnings

This document captures important learnings and patterns discovered during web app development.

## Tailwind CSS Limitations

### @apply Restrictions

**Important**: Tailwind CSS does **not** support arbitrary values or variant utilities inside `@apply` directives.

❌ **Don't do this:**
```css
.prose h2 {
  @apply text-2xl text-[#1a1a1a] group;
}
```

✅ **Do this instead:**
```css
.prose h2 {
  @apply text-2xl;
  color: #1a1a1a;
}

.prose h2.group:hover .anchor-link {
  opacity: 0.4;
}
```

### What's Not Allowed in @apply

- **Arbitrary values**: `text-[#1a1a1a]`, `bg-[#f3f4f6]`, `border-[#e5e7eb]`
- **Variant utilities**: `group`, `hover:text-[#...]`
- **Complex selectors**: Only simple utility classes work

### Solution Pattern

When you need custom colors or variants:
1. Use standard Tailwind utilities in `@apply` where possible
2. Set custom colors using regular CSS properties (`color: #1a1a1a`)
3. Use CSS selectors for hover states and variants
4. Consider defining named colors in `tailwind.config.ts` if you use them frequently

**Example:**
```css
/* Good */
.prose a {
  @apply no-underline transition-colors;
  color: #2563eb;
  border-bottom: 1px solid rgba(37, 99, 235, 0.3);
}

.prose a:hover {
  color: #1d4ed8;
  border-bottom-color: #2563eb;
}
```

## UI/UX Patterns

### Clean, Modern Design

- **Hidden anchor links**: Anchor link symbols (`#`) should be hidden by default and appear on hover
- **Better typography**: Use proper letter-spacing, line-height, and font weights
- **Subtle borders**: Use light borders instead of heavy ones
- **Refined spacing**: Generous spacing between sections (mt-16 for h2, mt-10 for h3)

### Navigation Structure

- **Simplified sidebar**: Show months only, not individual daily updates (daily updates on dashboard)
- **Month grouping**: Group content chronologically by month/year
- **Direct links**: Month headers link directly to monthly summaries
- **Executive summaries**: Monthly summaries should be concise (1-page, max 3 links)

### Content Presentation

- **Header styling**: Clean separation with border-bottom, proper spacing
- **Tag styling**: Subtle, rounded tags with light background
- **Link styling**: Use bottom borders instead of underlines for modern look
- **List styling**: Custom bullet markers for better visual hierarchy

## Monthly Summary Generation

### Best Practices

- **Executive style**: Think "chief of staff" - one page, high-value insights
- **Limit resources**: Maximum 3 essential resources/links per month
- **Key themes**: Top 3 themes extracted from pattern frequency
- **Natural language**: Executive summary should flow naturally, not be bullet points

### Script Usage

```bash
# Generate all monthly summaries
node scripts/generate-monthly-summary.js

# Generate specific month
node scripts/generate-monthly-summary.js 2026 1
```

**Pattern**: Script extracts themes from "Pattern to note" fields, prioritizes most referenced items, and creates concise summaries.

## TypeScript Patterns

### Type Guards for Filtering

When filtering arrays that may contain nulls, use type guards:

```typescript
// Good - with type guard
const items = paths.map((path) => {
  // ... may return null
  return metadata || null;
});

return items.filter((item): item is ContentMetadata => item !== null);
```

This tells TypeScript the resulting array contains only non-null items.

### Date Handling

When parsing dates from strings:
1. **Prefer path extraction** for monthly summaries (most reliable: `YYYY-MM` in filename)
2. **Parse date strings directly** when possible: `YYYY-MM-DD` format can be split
3. **Use UTC methods** when creating Date objects to avoid timezone issues
4. **Validate monthKey format**: Use regex to ensure `YYYY-MM` format before using

## Content Loading

### Path Resolution

The content loader handles multiple possible locations:
- Production: `web/updates/` (copied during build)
- Development: `../updates/` (relative to web directory)
- Content: `../content/` (general content)

**Pattern**: Check production location first, then fallback to local development paths.

### Monthly vs Daily Updates

- Monthly summaries: `updates/monthly/YYYY-MM.md`
- Daily updates: `updates/daily/YYYY/YYYY-MM-DD.md`

Both are processed by the same loader but grouped differently in the sidebar.

## Sidebar Navigation

### Month Grouping Logic

1. Extract monthKey from path or date: `YYYY-MM` format
2. Group daily updates by monthKey
3. Create month nodes in reverse chronological order
4. Link month headers directly to monthly summaries
5. Don't nest daily updates - they're on the dashboard

**Key insight**: Use monthKey (string) for sorting, not month names (alphabetical sorting is wrong).

## Styling Tips

### Prose Styles

- **Base font size**: 18-19px for readability
- **Line height**: 1.75 for comfortable reading
- **Letter spacing**: Negative tracking for headings (-0.025em for h1)
- **Color**: Dark gray for body text (#374151), black for headings (#1a1a1a)

### Responsive Design

- **Sidebar**: Hidden on mobile, shows on large screens
- **Table of Contents**: Hidden below xl breakpoint
- **Mobile menu**: Hamburger button on small screens
- **Content width**: Full width with proper max-width constraints

## Build & Deployment

### Netlify Deployment

The build command copies updates directory before building:
```bash
cp -r ../updates . && npm run build
```

This ensures monthly and daily updates are available in the web directory during build.

### Build Errors

Common issues:
- **Tailwind @apply errors**: Check for arbitrary values or variant utilities
- **Type errors**: Ensure type guards are used for filtered arrays
- **Path resolution**: Verify content directories exist in expected locations

## Performance Considerations

- **Dynamic rendering**: Pages use `force-dynamic` and `revalidate: 0` for always-fresh content
- **Client-side metadata**: Sidebar loads metadata via API route (can be slow on first load)
- **Search**: Client-side only - consider server-side search for large content sets
