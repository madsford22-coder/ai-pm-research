/**
 * Unit tests for markdown adapters
 */

const {
  parsePeopleFile,
  parseCompaniesFile,
} = require('../markdown');

describe('markdown adapters', () => {
  describe('parsePeopleFile', () => {
    it('should parse people.md format correctly', () => {
      const mockContent = `# Tracked People

## John Doe
**Role:** PM at Example
**Blog:** https://johndoe.com
**RSS Feed:** https://johndoe.com/feed
**LinkedIn:** https://linkedin.com/in/johndoe
**Twitter/X:** @johndoe

## Jane Smith
**Role:** Former PM
**Blog:** https://janesmith.com
**LinkedIn:** https://linkedin.com/in/janesmith
`;

      const people = parsePeopleFile('dummy-path', {
        readFile: () => mockContent,
      });

      expect(people).toHaveLength(2);
      expect(people[0]).toEqual({
        name: 'John Doe',
        blog: 'https://johndoe.com',
        rss_feed: 'https://johndoe.com/feed',
        linkedin: 'https://linkedin.com/in/johndoe',
        twitter: 'johndoe',
      });
      expect(people[1]).toEqual({
        name: 'Jane Smith',
        blog: 'https://janesmith.com',
        rss_feed: null,
        linkedin: 'https://linkedin.com/in/janesmith',
        twitter: null,
      });
    });
  });

  describe('parseCompaniesFile', () => {
    it('should parse companies.md format correctly', () => {
      const mockContent = `# Tracked Companies

## Example Corp
**Category:** AI Platform
**Primary sources:**
- https://example.com/blog
- https://example.com/changelog
- @examplecorp

## Another Company
**Category:** Tools
**Primary sources:**
- https://another.com/news
`;

      const companies = parseCompaniesFile('dummy-path', {
        readFile: () => mockContent,
      });

      expect(companies).toHaveLength(2);
      expect(companies[0]).toEqual({
        name: 'Example Corp',
        category: 'AI Platform',
        blogs: ['https://example.com/blog'],
        changelogs: ['https://example.com/changelog'],
        twitter: 'https://twitter.com/examplecorp',
      });
      expect(companies[1]).toEqual({
        name: 'Another Company',
        category: 'Tools',
        blogs: ['https://another.com/news'],
        changelogs: [],
        twitter: null,
      });
    });
  });
});

