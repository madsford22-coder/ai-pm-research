# Testing Strategy

This document outlines the testing strategy for the AI PM Research codebase.

## Testing Philosophy

We follow a **test pyramid** approach:

1. **Unit Tests** (80%) - Fast, isolated tests for pure functions and utilities
2. **Integration Tests** (15%) - Tests that verify modules work together
3. **E2E Tests** (5%) - High-level tests for critical workflows

## Test Coverage Goals

- **Utilities:** 100% coverage (shared utilities must be bulletproof)
- **Transforms:** 100% coverage (pure functions are easy to test)
- **Adapters:** 90% coverage (with dependency injection for I/O)
- **Pipelines:** 80% coverage (with mocked dependencies)
- **Scripts:** 70% coverage (integration tests)

**Current Coverage:** ~15% (4 test files)

## Running Tests

### JavaScript Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- file.test.js
```

### Python Tests

```bash
# Run all Python tests
pytest tooling/

# Run with coverage
pytest tooling/ --cov

# Run specific test file
pytest tooling/test_something.py
```

## Test Structure

### File Organization

Tests live next to the code they test in `__tests__/` directories:

```
src/
  utils/
    file.js
    __tests__/
      file.test.js
  transforms/
    filter.js
    __tests__/
      filter.test.js
```

### Test File Naming

- JavaScript: `*.test.js` (e.g., `file.test.js`)
- Python: `test_*.py` (e.g., `test_filter.py`)

## Writing Tests

### Unit Tests

Unit tests should be:
- **Fast** - No I/O or network calls
- **Isolated** - No dependencies on other tests
- **Deterministic** - Same input always produces same output
- **Focused** - Test one thing at a time

**Example:**
```javascript
describe('filterByDate', () => {
  it('should filter posts by date range', () => {
    const posts = [
      { title: 'Recent', published: '2025-01-15' },
      { title: 'Old', published: '2024-01-15' },
    ];
    
    const filtered = filterByDate(posts, { daysBack: 30 });
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Recent');
  });
});
```

### Testing with Dependency Injection

Use dependency injection to test functions that have side effects:

**Code:**
```javascript
function readFileSafe(filePath, options = {}) {
  const readFile = options.readFile || fs.readFileSync;
  const existsSync = options.existsSync || fs.existsSync;
  
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  return readFile(filePath, 'utf-8');
}
```

**Test:**
```javascript
it('should allow dependency injection for testing', () => {
  const mockReadFile = jest.fn(() => 'mocked content');
  const mockExistsSync = jest.fn(() => true);
  
  const result = readFileSafe('any-path.txt', {
    readFile: mockReadFile,
    existsSync: mockExistsSync,
  });
  
  expect(result).toBe('mocked content');
  expect(mockExistsSync).toHaveBeenCalledWith('any-path.txt');
});
```

### Testing Pure Functions

Pure functions (transforms) are easiest to test - just test inputs and outputs:

```javascript
describe('dedupePosts', () => {
  it('should remove duplicate posts by link', () => {
    const posts = [
      { title: 'Post 1', link: 'https://example.com/1' },
      { title: 'Post 2', link: 'https://example.com/2' },
      { title: 'Post 1 duplicate', link: 'https://example.com/1' },
    ];
    
    const deduped = dedupePosts(posts);
    
    expect(deduped).toHaveLength(2);
    expect(deduped.map(p => p.link)).toEqual([
      'https://example.com/1',
      'https://example.com/2',
    ]);
  });
});
```

### Testing Pipelines

Test pipelines by mocking adapters:

```javascript
describe('checkCompanyUpdatesPipeline', () => {
  it('should validate inputs', () => {
    expect(() => {
      checkCompanyUpdatesPipeline({ daysBack: -1 });
    }).toThrow(/must be at least/);
    
    expect(() => {
      checkCompanyUpdatesPipeline({ format: 'invalid' });
    }).toThrow(/must be one of/);
  });
  
  it('should process companies and return updates', async () => {
    // Mock adapters
    const mockParseCompaniesFile = jest.fn(() => [
      { name: 'Company', blogs: ['https://blog.com'] },
    ]);
    const mockFetchRSSFeed = jest.fn(() => ({
      posts: [{ title: 'Post', link: 'https://post.com' }],
    }));
    
    // Test pipeline with mocks
    // ...
  });
});
```

### Integration Tests

Integration tests verify that modules work together:

```javascript
describe('generateMonthlySummary integration', () => {
  it('should generate summary from daily updates', () => {
    // Use real file operations with temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
    
    // Create test daily updates
    // ...
    
    // Run function
    const result = generateMonthlySummary(2025, 1);
    
    // Verify output
    expect(result.dailyCount).toBeGreaterThan(0);
    
    // Cleanup
    fs.rmSync(tempDir, { recursive: true });
  });
});
```

## Mocking Patterns

### Mock File System

Use temp directories for file system tests:

```javascript
let tempDir;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});
```

### Mock External APIs

Mock HTTP requests and external services:

```javascript
const mockFetchRSSFeed = jest.fn(() => ({
  posts: [{ title: 'Post', link: 'https://post.com' }],
}));
```

### Mock Puppeteer

Mock Puppeteer browser instances:

```javascript
const mockPage = {
  goto: jest.fn(),
  $$: jest.fn(() => []),
  close: jest.fn(),
};

const mockBrowser = {
  newPage: jest.fn(() => Promise.resolve(mockPage)),
  close: jest.fn(),
};
```

## Test Utilities

### Common Test Helpers

Create test helpers in `src/__tests__/helpers/`:

```javascript
// src/__tests__/helpers/test-utils.js
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
}

function createMockFile(dir, filename, content) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

module.exports = {
  createTempDir,
  createMockFile,
};
```

## Continuous Integration

Tests should run automatically on:
- **Pull requests** - All tests must pass
- **Commits** - At least unit tests should pass
- **Nightly builds** - Full test suite including integration tests

## Best Practices

1. **Write tests first** (TDD) for new utilities
2. **Test edge cases** - Empty arrays, null values, invalid inputs
3. **Test error cases** - Invalid inputs should throw descriptive errors
4. **Keep tests fast** - Unit tests should run in milliseconds
5. **Use descriptive names** - `it('should filter posts by date range')`
6. **One assertion per test** - Or at least related assertions
7. **Clean up** - Always clean up temp files/directories
8. **Mock external dependencies** - Don't make real network calls in tests

## Common Pitfalls

### ❌ Don't Test Implementation Details

```javascript
// Bad - testing implementation
it('should call readFileSync', () => {
  const spy = jest.spyOn(fs, 'readFileSync');
  readFileSafe('file.txt');
  expect(spy).toHaveBeenCalled();
});
```

### ✅ Test Behavior

```javascript
// Good - testing behavior
it('should read file content', () => {
  fs.writeFileSync('file.txt', 'content');
  const result = readFileSafe('file.txt');
  expect(result).toBe('content');
});
```

### ❌ Don't Share State Between Tests

```javascript
// Bad - shared state
let data = [];

it('test 1', () => {
  data.push(1);
});

it('test 2', () => {
  data.push(2); // May fail if tests run in different order
});
```

### ✅ Isolate Tests

```javascript
// Good - isolated state
it('test 1', () => {
  const data = [];
  data.push(1);
  expect(data).toHaveLength(1);
});

it('test 2', () => {
  const data = [];
  data.push(2);
  expect(data).toHaveLength(1);
});
```

## Test Checklist

When adding new code, ensure:

- [ ] Unit tests for utilities (100% coverage)
- [ ] Unit tests for transforms (100% coverage)
- [ ] Unit tests for adapters (90% coverage with mocks)
- [ ] Integration tests for pipelines (80% coverage)
- [ ] Error cases are tested
- [ ] Edge cases are tested
- [ ] Tests are fast (< 100ms each)
- [ ] Tests use dependency injection where appropriate
- [ ] Tests clean up after themselves

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
