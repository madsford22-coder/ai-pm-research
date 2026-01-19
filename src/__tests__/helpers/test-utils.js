/**
 * Test helpers and utilities
 * 
 * Common utilities for writing tests across the codebase.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Create a temporary directory for testing
 * @returns {string} Path to temporary directory
 */
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
}

/**
 * Create a test file in the given directory
 * @param {string} dir - Directory path
 * @param {string} filename - Filename
 * @param {string} content - File content
 * @returns {string} Path to created file
 */
function createMockFile(dir, filename, content) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Create a test directory structure
 * @param {string} baseDir - Base directory
 * @param {Object} structure - Directory structure object
 * @returns {Object} Created paths
 */
function createDirStructure(baseDir, structure) {
  const paths = {};
  
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(baseDir, key);
    
    if (typeof value === 'string') {
      // It's a file
      paths[key] = createMockFile(baseDir, key, value);
    } else {
      // It's a directory
      fs.mkdirSync(fullPath, { recursive: true });
      paths[key] = fullPath;
      
      // Recursively create subdirectory
      const subPaths = createDirStructure(fullPath, value);
      Object.assign(paths, subPaths);
    }
  }
  
  return paths;
}

/**
 * Clean up a temporary directory
 * @param {string} dir - Directory path
 */
function cleanupTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Create a mock file reader that returns predefined content
 * @param {Object} files - Map of file paths to content
 * @returns {Function} Mock readFile function
 */
function createMockFileReader(files) {
  return (filePath) => {
    if (files[filePath]) {
      return files[filePath];
    }
    // If not found in map, try to read actual file (for flexibility)
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    throw new Error(`File not found: ${filePath}`);
  };
}

/**
 * Create a mock file writer that stores content in memory
 * @param {Object} writtenFiles - Object to store written files
 * @returns {Function} Mock writeFile function
 */
function createMockFileWriter(writtenFiles = {}) {
  return (filePath, content) => {
    writtenFiles[filePath] = content;
  };
}

/**
 * Create a mock existsSync that checks against a set of paths
 * @param {Set<string>|Array<string>} existingPaths - Set or array of existing paths
 * @returns {Function} Mock existsSync function
 */
function createMockExistsSync(existingPaths) {
  const pathSet = new Set(existingPaths);
  return (filePath) => pathSet.has(filePath);
}

/**
 * Generate test markdown content with frontmatter
 * @param {Object} frontmatter - Frontmatter data
 * @param {string} content - Markdown content
 * @returns {string} Formatted markdown with frontmatter
 */
function createMarkdownWithFrontmatter(frontmatter, content) {
  const frontmatterLines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      frontmatterLines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
    } else {
      frontmatterLines.push(`${key}: ${typeof value === 'string' ? `"${value}"` : value}`);
    }
  }
  frontmatterLines.push('---');
  
  return frontmatterLines.join('\n') + '\n\n' + content;
}

/**
 * Create a mock Person object for testing
 * @param {Object} overrides - Properties to override
 * @returns {import('../domain/types').Person}
 */
function createMockPerson(overrides = {}) {
  return {
    name: 'Test Person',
    blog: 'https://example.com/blog',
    rss_feed: 'https://example.com/feed',
    linkedin: null,
    twitter: null,
    ...overrides,
  };
}

/**
 * Create a mock Company object for testing
 * @param {Object} overrides - Properties to override
 * @returns {import('../domain/types').Company}
 */
function createMockCompany(overrides = {}) {
  return {
    name: 'Test Company',
    blogs: ['https://example.com/blog'],
    changelogs: [],
    twitter: null,
    category: null,
    ...overrides,
  };
}

/**
 * Create a mock Post object for testing
 * @param {Object} overrides - Properties to override
 * @returns {import('../domain/types').Post}
 */
function createMockPost(overrides = {}) {
  const now = new Date();
  const published = new Date(now - 5 * 24 * 60 * 60 * 1000); // 5 days ago
  
  return {
    title: 'Test Post',
    link: 'https://example.com/post',
    published: published.toISOString(),
    source: 'blog_rss',
    description: null,
    sourceUrl: null,
    ...overrides,
  };
}

/**
 * Create a mock UpdateItem object for testing
 * @param {Object} overrides - Properties to override
 * @returns {import('../domain/types').UpdateItem}
 */
function createMockUpdateItem(overrides = {}) {
  const now = new Date();
  const published = new Date(now - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  
  return {
    title: 'Test Update',
    link: 'https://example.com/update',
    published: published.toISOString(),
    source: 'blog',
    sourceUrl: 'https://example.com/blog',
    description: null,
    company: null,
    category: null,
    ...overrides,
  };
}

module.exports = {
  createTempDir,
  createMockFile,
  createDirStructure,
  cleanupTempDir,
  createMockFileReader,
  createMockFileWriter,
  createMockExistsSync,
  createMarkdownWithFrontmatter,
  createMockPerson,
  createMockCompany,
  createMockPost,
  createMockUpdateItem,
};
