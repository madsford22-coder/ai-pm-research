# Migration Guide: Modular Refactoring

This document describes the refactoring from monolithic scripts to a modular, testable architecture.

## What Changed

### Before
- All logic was in `tooling/*.js` scripts
- Hard to test individual functions
- Tightly coupled I/O and business logic
- Duplicate code across scripts

### After
- Logic extracted to `src/` with 4-layer architecture
- Scripts in `scripts/` are thin wrappers
- Pure functions are easily testable
- Reusable components

## New Structure

```
src/
  domain/          # Type definitions
  adapters/        # I/O (markdown, RSS, scraping)
  transforms/      # Pure functions (filter, sort, format)
  pipelines/       # Orchestration
scripts/           # Thin wrappers (CLI entry points)
```

## Migration Path

### For Existing Scripts

Old scripts in `tooling/` still work but are deprecated. New scripts are in `scripts/`:

- `tooling/check-people-activity.js` → `scripts/check-people-activity.js`
- `tooling/check-company-updates.js` → `scripts/check-company-updates.js`
- `tooling/find-rss-feeds.js` → `scripts/find-rss-feeds.js`

### Using New Scripts

```bash
# Check people activity
node scripts/check-people-activity.js --days 30

# Check company updates
node scripts/check-company-updates.js --days 14

# Find RSS feeds
node scripts/find-rss-feeds.js
```

### Using Pipeline Functions Directly

You can also import and use pipeline functions in your own code:

```javascript
const { checkPeopleActivityPipeline } = require('./src/pipelines/people-activity');

const result = await checkPeopleActivityPipeline({
  daysBack: 30,
  format: 'json',
});

console.log(result.activities);
```

## Testing

### Run JavaScript Tests
```bash
cd tooling
npm install  # Install Jest
npm test
```

### Run Python Tests
```bash
pip install -r tooling/requirements.txt
pytest tooling/
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs tests on every push:
- JavaScript tests with Jest
- Python tests with pytest
- Basic linting

## Best Practices for Future Development

1. **Keep scripts thin** - Scripts should only parse args and call pipelines
2. **Write pure transforms** - Functions without side effects are easiest to test
3. **Inject dependencies** - Adapters should accept options for test doubles
4. **Add tests** - Write unit tests for pure functions first, then adapters with mocks

## Cursor-Friendly Refactoring Checklist

When opening a refactor PR with Cursor, use this checklist:

- [ ] Make scripts/* thin wrappers. Extract reusable logic into src/.
- [ ] Avoid side effects in core functions; inject fetch and file IO.
- [ ] Add unit tests for pure transforms first, then adapters with mocks.
- [ ] Keep behavior unchanged (golden file tests ok).
- [ ] Add CI to run tests on every push.

