/**
 * Shared frontmatter utilities
 * 
 * Provides consistent parsing and formatting of YAML frontmatter in markdown files.
 * Uses gray-matter for parsing to ensure consistency across the codebase.
 * 
 * @module utils/frontmatter
 */

// Note: gray-matter is used in web/ but not in root package.json
// We'll use a simple parser for now, but recommend adding gray-matter to root deps
const fs = require('fs');

/**
 * Parse frontmatter from markdown content
 * 
 * Supports both gray-matter style parsing (if available) and simple regex fallback.
 * 
 * @param {string} content - Markdown content with frontmatter
 * @param {Object} options - Options
 * @param {Function} options.parser - Optional parser function (for testing)
 * @returns {{data: Object, content: string}} Parsed frontmatter data and content
 * @throws {Error} If frontmatter can't be parsed
 */
function parseFrontmatter(content, options = {}) {
  if (!content || typeof content !== 'string') {
    throw new Error('content must be a non-empty string');
  }
  
  // Allow injection of parser for testing or if gray-matter is available
  if (options.parser) {
    try {
      return options.parser(content, options.parserOptions || {});
    } catch (error) {
      throw new Error(`Failed to parse frontmatter: ${error.message}`);
    }
  }
  
  // Try to use gray-matter if available (check if it's in node_modules)
  try {
    const matter = require('gray-matter');
    return matter(content, options);
  } catch (error) {
    // Fallback to simple regex parser if gray-matter not available
    return parseFrontmatterSimple(content);
  }
}

/**
 * Simple regex-based frontmatter parser (fallback)
 * 
 * Parses basic YAML frontmatter using regex. Less robust than gray-matter
 * but works without dependencies.
 * 
 * @param {string} content - Markdown content
 * @returns {{data: Object, content: string}} Parsed frontmatter and content
 */
function parseFrontmatterSimple(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content: content };
  }
  
  const yamlContent = match[1];
  const markdownContent = match[2];
  const data = {};
  
  // Simple YAML parser for basic key-value pairs
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();
      
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      
      if (key && value) {
        // Handle arrays (simple case: [item1, item2])
        if (value.startsWith('[') && value.endsWith(']')) {
          data[key] = value
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(item => item.trim().replace(/^["']|["']$/g, ''));
        } else {
          data[key] = value;
        }
      }
    }
  }
  
  return { data, content: markdownContent };
}

/**
 * Format frontmatter and content into markdown
 * 
 * @param {Object} data - Frontmatter data
 * @param {string} content - Markdown content
 * @param {Object} options - Options
 * @param {Function} options.formatter - Optional formatter function (for testing)
 * @returns {string} Formatted markdown with frontmatter
 */
function formatFrontmatter(data, content, options = {}) {
  if (typeof content !== 'string') {
    throw new Error('content must be a string');
  }
  
  if (!data || typeof data !== 'object') {
    throw new Error('data must be an object');
  }
  
  // Allow injection of formatter for testing or if gray-matter is available
  if (options.formatter) {
    return options.formatter(content, data, options.formatterOptions || {});
  }
  
  // Try to use gray-matter if available
  try {
    const matter = require('gray-matter');
    return matter.stringify(content, data);
  } catch (error) {
    // Fallback to simple formatter
    return formatFrontmatterSimple(data, content);
  }
}

/**
 * Simple frontmatter formatter (fallback)
 * 
 * Formats basic YAML frontmatter. Less robust than gray-matter
 * but works without dependencies.
 * 
 * @param {Object} data - Frontmatter data
 * @param {string} content - Markdown content
 * @returns {string} Formatted markdown with frontmatter
 */
function formatFrontmatterSimple(data, content) {
  const frontmatterLines = ['---'];
  
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      frontmatterLines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'string' && (value.includes(':') || value.includes('\n'))) {
      frontmatterLines.push(`${key}: "${value}"`);
    } else {
      frontmatterLines.push(`${key}: ${value}`);
    }
  }
  
  frontmatterLines.push('---');
  return frontmatterLines.join('\n') + '\n' + content;
}

module.exports = {
  parseFrontmatter,
  formatFrontmatter,
  // Expose simple parsers for testing
  parseFrontmatterSimple,
  formatFrontmatterSimple,
};
