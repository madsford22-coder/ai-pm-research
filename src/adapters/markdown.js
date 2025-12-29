/**
 * Adapters for reading and parsing markdown files
 * 
 * These functions handle I/O and parsing of markdown configuration files.
 * They should be testable by injecting file system operations.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse people.md file to extract Person objects
 * @param {string} filePath - Path to people.md file
 * @param {Object} options - Options object
 * @param {Function} options.readFile - File reading function (for testing)
 * @returns {import('../domain/types').Person[]}
 */
function parsePeopleFile(filePath, options = {}) {
  const readFile = options.readFile || fs.readFileSync;
  const content = readFile(filePath, 'utf-8');
  const people = [];
  
  const sections = content.split(/\n## /);
  
  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const name = lines[0].trim();
    
    const person = {
      name,
      blog: null,
      rss_feed: null,
      linkedin: null,
      twitter: null,
    };
    
    for (const line of lines) {
      if (line.includes('Blog:') || line.includes('blog:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.blog = match[0];
        }
      }
      if (line.includes('RSS Feed:') || line.includes('rss feed:') || line.includes('RSS:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.rss_feed = match[0].replace(/\)$/, '');
        }
      }
      if (line.includes('LinkedIn:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.linkedin = match[0];
        }
      }
      if (line.includes('Twitter/X:') || line.includes('Twitter:')) {
        const match = line.match(/@[\w]+/);
        if (match) {
          person.twitter = match[0].replace('@', '');
        }
      }
    }
    
    people.push(person);
  }
  
  return people;
}

/**
 * Parse companies.md file to extract Company objects
 * @param {string} filePath - Path to companies.md file
 * @param {Object} options - Options object
 * @param {Function} options.readFile - File reading function (for testing)
 * @returns {import('../domain/types').Company[]}
 */
function parseCompaniesFile(filePath, options = {}) {
  const readFile = options.readFile || fs.readFileSync;
  const content = readFile(filePath, 'utf-8');
  const companies = [];
  
  // Split by company sections (## Company Name)
  const sections = content.split(/\n## /);
  
  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const name = lines[0].trim();
    
    const company = {
      name,
      blogs: [],
      changelogs: [],
      twitter: null,
      category: null,
    };
    
    // Extract category
    const categoryMatch = section.match(/\*\*Category:\*\* (.+)/);
    if (categoryMatch) {
      company.category = categoryMatch[1];
    }
    
    // Extract primary sources
    let inPrimarySources = false;
    for (const line of lines) {
      if (line.includes('**Primary sources:**')) {
        inPrimarySources = true;
        continue;
      }
      if (inPrimarySources) {
        // Stop at next section or empty line after sources
        if (line.trim() === '' && company.blogs.length > 0) {
          break;
        }
        if (line.startsWith('---')) {
          break;
        }
        
        // Extract URLs
        const urlMatch = line.match(/https?:\/\/[^\s\)]+/g);
        if (urlMatch) {
          for (const url of urlMatch) {
            const cleanUrl = url.replace(/\)$/, '').replace(/,$/, '');
            
            // Categorize URLs
            if (cleanUrl.includes('blog') || cleanUrl.includes('news') || cleanUrl.includes('updates')) {
              company.blogs.push(cleanUrl);
            } else if (cleanUrl.includes('changelog') || cleanUrl.includes('release-notes') || cleanUrl.includes('docs/changelog')) {
              company.changelogs.push(cleanUrl);
            } else if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
              company.twitter = cleanUrl;
            } else if (!cleanUrl.includes('docs') || cleanUrl.includes('changelog')) {
              // Default to blog if it's not clearly a changelog
              company.blogs.push(cleanUrl);
            }
          }
        }
        
        // Extract Twitter handles
        const twitterMatch = line.match(/@[\w]+/);
        if (twitterMatch) {
          company.twitter = `https://twitter.com/${twitterMatch[0].replace('@', '')}`;
        }
      }
    }
    
    if (company.blogs.length > 0 || company.changelogs.length > 0) {
      companies.push(company);
    }
  }
  
  return companies;
}

module.exports = {
  parsePeopleFile,
  parseCompaniesFile,
};

