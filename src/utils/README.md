# Shared Utilities

This directory contains shared utility functions used across the codebase.

## Modules

### `file.js` - File Operations

Provides safe file operations with error handling and dependency injection for testability.

**Functions:**
- `readFileSafe(filePath, options)` - Read file with error handling
- `writeFileSafe(filePath, content, options)` - Write file with directory creation
- `fileExists(filePath, options)` - Check if file exists
- `ensureDirectoryExists(dirPath, options)` - Ensure directory exists

**Example:**
```javascript
const { readFileSafe, writeFileSafe } = require('../utils/file');

// Read with error handling
const content = readFileSafe('./file.md');

// Write with directory creation
writeFileSafe('./output/file.md', content);
```

### `frontmatter.js` - Frontmatter Parsing

Provides consistent parsing and formatting of YAML frontmatter in markdown files.

**Functions:**
- `parseFrontmatter(content, options)` - Parse frontmatter from markdown
- `formatFrontmatter(data, content, options)` - Format frontmatter and content

**Example:**
```javascript
const { parseFrontmatter, formatFrontmatter } = require('../utils/frontmatter');

// Parse
const { data, content } = parseFrontmatter(markdownContent);
console.log(data.title); // "My Title"

// Format
const markdown = formatFrontmatter({ title: 'New Title' }, content);
```

**Note:** Uses `gray-matter` if available, falls back to simple regex parser.

### `validation.js` - Input Validation

Provides type checking and input validation functions.

**Functions:**
- `validateNonEmptyString(value, name)` - Validate non-empty string
- `validateDateString(value, name, required)` - Validate ISO 8601 date
- `validateFilePath(filePath, extension, required)` - Validate file path
- `validatePositiveInteger(value, name, min)` - Validate positive integer
- `validateOneOf(value, allowedValues, name)` - Validate enum value
- `validateArray(value, name, itemValidator)` - Validate array
- `validateURL(value, name, required)` - Validate URL

**Example:**
```javascript
const { validateNonEmptyString, validateDateString } = require('../utils/validation');

// Validate inputs
validateNonEmptyString(title, 'title');
const date = validateDateString(dateStr, 'date', true);
```

## Usage Guidelines

1. **Always use shared utilities** instead of direct `fs` operations
2. **Inject dependencies** when testing (pass `options` with test doubles)
3. **Validate inputs** at module boundaries
4. **Handle errors** gracefully with descriptive messages

## Testing

All utilities support dependency injection for testing:

```javascript
const { readFileSafe } = require('../utils/file');

// Test with mock
const mockReadFile = jest.fn(() => 'content');
const content = readFileSafe('./file.md', { readFile: mockReadFile });
```
