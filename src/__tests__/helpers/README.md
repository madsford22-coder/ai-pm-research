# Test Helpers

This directory contains shared test utilities and helpers.

## Utilities

### File System Helpers

- `createTempDir()` - Create temporary directory for tests
- `createMockFile(dir, filename, content)` - Create a test file
- `createDirStructure(baseDir, structure)` - Create nested directory structure
- `cleanupTempDir(dir)` - Clean up temporary directory

### Mock Functions

- `createMockFileReader(files)` - Create mock file reader with predefined content
- `createMockFileWriter(writtenFiles)` - Create mock file writer that stores in memory
- `createMockExistsSync(existingPaths)` - Create mock existsSync function

### Test Data Generators

- `createMarkdownWithFrontmatter(frontmatter, content)` - Generate markdown with frontmatter
- `createMockPerson(overrides)` - Create mock Person object
- `createMockCompany(overrides)` - Create mock Company object
- `createMockPost(overrides)` - Create mock Post object
- `createMockUpdateItem(overrides)` - Create mock UpdateItem object

## Usage Examples

### File System Testing

```javascript
const { createTempDir, createMockFile, cleanupTempDir } = require('../helpers/test-utils');

describe('file operations', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = createTempDir();
  });
  
  afterEach(() => {
    cleanupTempDir(tempDir);
  });
  
  it('should read file', () => {
    const filePath = createMockFile(tempDir, 'test.txt', 'content');
    const content = readFileSafe(filePath);
    expect(content).toBe('content');
  });
});
```

### Mocking File Operations

```javascript
const { createMockFileReader, createMockFileWriter } = require('../helpers/test-utils');

it('should read file with mock', () => {
  const mockFiles = {
    './file.md': 'content',
  };
  const mockReadFile = createMockFileReader(mockFiles);
  
  const content = readFileSafe('./file.md', {
    readFile: mockReadFile,
  });
  
  expect(content).toBe('content');
});
```

### Creating Test Data

```javascript
const { createMockPerson, createMockPost } = require('../helpers/test-utils');

it('should process person activity', () => {
  const person = createMockPerson({
    name: 'John Doe',
    blog: 'https://blog.com',
  });
  
  const posts = [
    createMockPost({
      title: 'Post 1',
      published: '2025-01-15',
    }),
  ];
  
  // Test with mock data
});
```
