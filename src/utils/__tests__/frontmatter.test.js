/**
 * Unit tests for frontmatter utilities
 */

const {
  parseFrontmatter,
  formatFrontmatter,
  parseFrontmatterSimple,
  formatFrontmatterSimple,
} = require('../frontmatter');

describe('frontmatter utilities', () => {
  describe('parseFrontmatterSimple', () => {
    it('should parse frontmatter with title and date', () => {
      const content = `---
title: Test Title
date: 2025-01-15
---

# Content here
`;

      const result = parseFrontmatterSimple(content);

      expect(result.data).toEqual({
        title: 'Test Title',
        date: '2025-01-15',
      });
      expect(result.content.trim()).toBe('# Content here');
    });

    it('should parse frontmatter with tags array', () => {
      const content = `---
title: Test
tags: [tag1, tag2, tag3]
---

Content
`;

      const result = parseFrontmatterSimple(content);

      expect(result.data.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should return empty data if no frontmatter', () => {
      const content = `# No frontmatter
Just content
`;

      const result = parseFrontmatterSimple(content);

      expect(result.data).toEqual({});
      expect(result.content).toBe(content);
    });

    it('should handle quoted values', () => {
      const content = `---
title: "Test Title"
date: '2025-01-15'
---

Content
`;

      const result = parseFrontmatterSimple(content);

      expect(result.data.title).toBe('Test Title');
      expect(result.data.date).toBe('2025-01-15');
    });

    it('should skip comments and empty lines', () => {
      const content = `---
# Comment
title: Test
date: 2025-01-15
---

Content
`;

      const result = parseFrontmatterSimple(content);

      expect(result.data.title).toBe('Test');
      expect(result.data.date).toBe('2025-01-15');
    });
  });

  describe('formatFrontmatterSimple', () => {
    it('should format frontmatter and content', () => {
      const data = {
        title: 'Test Title',
        date: '2025-01-15',
      };
      const content = '# Content here';

      const result = formatFrontmatterSimple(data, content);

      expect(result).toContain('---');
      expect(result).toContain('title: Test Title');
      expect(result).toContain('date: 2025-01-15');
      expect(result).toContain('# Content here');
    });

    it('should format arrays correctly', () => {
      const data = {
        title: 'Test',
        tags: ['tag1', 'tag2'],
      };
      const content = 'Content';

      const result = formatFrontmatterSimple(data, content);

      expect(result).toContain('tags: ["tag1", "tag2"]');
    });

    it('should quote strings with special characters', () => {
      const data = {
        title: 'Test: With Colon',
      };
      const content = 'Content';

      const result = formatFrontmatterSimple(data, content);

      expect(result).toContain('title: "Test: With Colon"');
    });
  });

  describe('parseFrontmatter', () => {
    it('should use simple parser if gray-matter not available', () => {
      const content = `---
title: Test
---

Content
`;

      const result = parseFrontmatter(content);

      expect(result.data.title).toBe('Test');
      expect(result.content.trim()).toBe('Content');
    });

    it('should allow injection of parser for testing', () => {
      const mockParser = jest.fn(() => ({
        data: { title: 'Mocked' },
        content: 'Mocked content',
      }));

      const result = parseFrontmatter('any content', {
        parser: mockParser,
      });

      expect(mockParser).toHaveBeenCalledWith('any content', {});
      expect(result.data.title).toBe('Mocked');
    });

    it('should throw error if content is not a string', () => {
      expect(() => {
        parseFrontmatter(null);
      }).toThrow(/content must be a non-empty string/);
    });
  });

  describe('formatFrontmatter', () => {
    it('should use simple formatter if gray-matter not available', () => {
      const data = { title: 'Test' };
      const content = 'Content';

      const result = formatFrontmatter(data, content);

      expect(result).toContain('---');
      expect(result).toContain('title: Test');
      expect(result).toContain('Content');
    });

    it('should allow injection of formatter for testing', () => {
      const mockFormatter = jest.fn(() => 'mocked output');

      const result = formatFrontmatter({ title: 'Test' }, 'content', {
        formatter: mockFormatter,
      });

      expect(mockFormatter).toHaveBeenCalled();
      expect(result).toBe('mocked output');
    });

    it('should throw error if data is not an object', () => {
      expect(() => {
        formatFrontmatter(null, 'content');
      }).toThrow(/data must be an object/);
    });

    it('should throw error if content is not a string', () => {
      expect(() => {
        formatFrontmatter({ title: 'Test' }, null);
      }).toThrow(/content must be a string/);
    });
  });
});
