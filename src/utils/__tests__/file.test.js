/**
 * Unit tests for file utilities
 */

const {
  readFileSafe,
  writeFileSafe,
  fileExists,
  ensureDirectoryExists,
} = require('../file');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('file utilities', () => {
  let tempDir;
  let tempFile;

  beforeEach(() => {
    // Create temp directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-utils-test-'));
    tempFile = path.join(tempDir, 'test.txt');
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('readFileSafe', () => {
    it('should read existing file', () => {
      const content = 'test content';
      fs.writeFileSync(tempFile, content, 'utf-8');

      const result = readFileSafe(tempFile);

      expect(result).toBe(content);
    });

    it('should throw error if file does not exist', () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

      expect(() => {
        readFileSafe(nonExistentFile);
      }).toThrow(/File not found/);
    });

    it('should allow dependency injection for testing', () => {
      const mockReadFile = jest.fn(() => 'mocked content');
      const mockExistsSync = jest.fn(() => true);

      const result = readFileSafe('any-path.txt', {
        readFile: mockReadFile,
        existsSync: mockExistsSync,
      });

      expect(result).toBe('mocked content');
      expect(mockExistsSync).toHaveBeenCalledWith('any-path.txt');
      expect(mockReadFile).toHaveBeenCalledWith('any-path.txt', 'utf-8');
    });

    it('should throw error if filePath is not a string', () => {
      expect(() => {
        readFileSafe(null);
      }).toThrow(/filePath must be a non-empty string/);

      expect(() => {
        readFileSafe(123);
      }).toThrow(/filePath must be a non-empty string/);
    });
  });

  describe('writeFileSafe', () => {
    it('should write file and create directory if needed', () => {
      const nestedDir = path.join(tempDir, 'nested', 'dir');
      const nestedFile = path.join(nestedDir, 'test.txt');
      const content = 'test content';

      writeFileSafe(nestedFile, content);

      expect(fs.existsSync(nestedDir)).toBe(true);
      expect(fs.readFileSync(nestedFile, 'utf-8')).toBe(content);
    });

    it('should write to existing directory', () => {
      const content = 'test content';

      writeFileSafe(tempFile, content);

      expect(fs.readFileSync(tempFile, 'utf-8')).toBe(content);
    });

    it('should allow dependency injection for testing', () => {
      const mockWriteFile = jest.fn();
      const mockMkdir = jest.fn();
      const mockExistsSync = jest.fn(() => false);

      writeFileSafe('path/to/file.txt', 'content', {
        writeFile: mockWriteFile,
        mkdir: mockMkdir,
        existsSync: mockExistsSync,
      });

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith('path/to/file.txt', 'content', 'utf-8');
    });

    it('should throw error if filePath is not a string', () => {
      expect(() => {
        writeFileSafe(null, 'content');
      }).toThrow(/filePath must be a non-empty string/);
    });

    it('should throw error if content is not a string', () => {
      expect(() => {
        writeFileSafe(tempFile, 123);
      }).toThrow(/content must be a string/);
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', () => {
      fs.writeFileSync(tempFile, 'content', 'utf-8');

      expect(fileExists(tempFile)).toBe(true);
    });

    it('should return false if file does not exist', () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

      expect(fileExists(nonExistentFile)).toBe(false);
    });

    it('should allow dependency injection for testing', () => {
      const mockExistsSync = jest.fn(() => true);

      const result = fileExists('any-path.txt', {
        existsSync: mockExistsSync,
      });

      expect(result).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('any-path.txt');
    });

    it('should return false if filePath is not a string', () => {
      expect(fileExists(null)).toBe(false);
      expect(fileExists(123)).toBe(false);
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', () => {
      const newDir = path.join(tempDir, 'new-dir');

      ensureDirectoryExists(newDir);

      expect(fs.existsSync(newDir)).toBe(true);
      expect(fs.statSync(newDir).isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', () => {
      const existingDir = path.join(tempDir, 'existing-dir');
      fs.mkdirSync(existingDir, { recursive: true });

      expect(() => {
        ensureDirectoryExists(existingDir);
      }).not.toThrow();

      expect(fs.existsSync(existingDir)).toBe(true);
    });

    it('should allow dependency injection for testing', () => {
      const mockMkdir = jest.fn();
      const mockExistsSync = jest.fn(() => false);

      ensureDirectoryExists('any-dir', {
        mkdir: mockMkdir,
        existsSync: mockExistsSync,
      });

      expect(mockExistsSync).toHaveBeenCalledWith('any-dir');
      expect(mockMkdir).toHaveBeenCalledWith('any-dir', { recursive: true });
    });

    it('should throw error if dirPath is not a string', () => {
      expect(() => {
        ensureDirectoryExists(null);
      }).toThrow(/dirPath must be a non-empty string/);
    });
  });
});
