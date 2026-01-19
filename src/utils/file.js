/**
 * Shared file utilities with safety checks
 * 
 * Provides consistent file operations with error handling and dependency injection
 * for testability.
 * 
 * @module utils/file
 */

const fs = require('fs');
const path = require('path');

/**
 * Read file safely with error handling
 * @param {string} filePath - Path to file
 * @param {Object} options - Options
 * @param {Function} options.readFile - File reader (for testing, defaults to fs.readFileSync)
 * @param {Function} options.existsSync - File existence checker (for testing, defaults to fs.existsSync)
 * @returns {string} File content
 * @throws {Error} If file doesn't exist or can't be read
 */
function readFileSafe(filePath, options = {}) {
  const readFile = options.readFile || fs.readFileSync;
  const existsSync = options.existsSync || fs.existsSync;
  
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('filePath must be a non-empty string');
  }
  
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  try {
    return readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Write file safely with directory creation
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 * @param {Object} options - Options
 * @param {Function} options.writeFile - File writer (for testing, defaults to fs.writeFileSync)
 * @param {Function} options.mkdir - Directory creator (for testing, defaults to fs.mkdirSync)
 * @param {Function} options.existsSync - Directory existence checker (for testing, defaults to fs.existsSync)
 * @throws {Error} If file can't be written
 */
function writeFileSafe(filePath, content, options = {}) {
  const writeFile = options.writeFile || fs.writeFileSync;
  const mkdir = options.mkdir || fs.mkdirSync;
  const existsSync = options.existsSync || fs.existsSync;
  
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('filePath must be a non-empty string');
  }
  
  if (typeof content !== 'string') {
    throw new Error('content must be a string');
  }
  
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    try {
      mkdir(dir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dir}: ${error.message}`);
    }
  }
  
  try {
    writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error.message}`);
  }
}

/**
 * Check if file exists
 * @param {string} filePath - Path to file
 * @param {Object} options - Options
 * @param {Function} options.existsSync - File existence checker (for testing, defaults to fs.existsSync)
 * @returns {boolean} True if file exists
 */
function fileExists(filePath, options = {}) {
  const existsSync = options.existsSync || fs.existsSync;
  
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }
  
  return existsSync(filePath);
}

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Path to directory
 * @param {Object} options - Options
 * @param {Function} options.mkdir - Directory creator (for testing, defaults to fs.mkdirSync)
 * @param {Function} options.existsSync - Directory existence checker (for testing, defaults to fs.existsSync)
 * @throws {Error} If directory can't be created
 */
function ensureDirectoryExists(dirPath, options = {}) {
  const mkdir = options.mkdir || fs.mkdirSync;
  const existsSync = options.existsSync || fs.existsSync;
  
  if (!dirPath || typeof dirPath !== 'string') {
    throw new Error('dirPath must be a non-empty string');
  }
  
  if (!existsSync(dirPath)) {
    try {
      mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }
}

module.exports = {
  readFileSafe,
  writeFileSafe,
  fileExists,
  ensureDirectoryExists,
};
