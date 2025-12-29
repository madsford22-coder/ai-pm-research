/**
 * Unit tests for sort transforms
 */

const {
  sortPostsByDate,
  sortUpdatesByDate,
} = require('../sort');

describe('sort transforms', () => {
  describe('sortPostsByDate', () => {
    it('should sort posts by date, most recent first', () => {
      const now = new Date();
      const posts = [
        {
          title: 'Old post',
          link: 'https://example.com/1',
          published: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog_rss',
        },
        {
          title: 'Recent post',
          link: 'https://example.com/2',
          published: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog_rss',
        },
        {
          title: 'Very recent post',
          link: 'https://example.com/3',
          published: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog_rss',
        },
      ];

      const sorted = sortPostsByDate(posts);
      
      expect(sorted[0].title).toBe('Very recent post');
      expect(sorted[1].title).toBe('Recent post');
      expect(sorted[2].title).toBe('Old post');
    });

    it('should handle posts without dates (put them last)', () => {
      const now = new Date();
      const posts = [
        {
          title: 'Post without date',
          link: 'https://example.com/1',
          published: null,
          source: 'blog_rss',
        },
        {
          title: 'Recent post',
          link: 'https://example.com/2',
          published: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog_rss',
        },
      ];

      const sorted = sortPostsByDate(posts);
      
      expect(sorted[0].title).toBe('Recent post');
      expect(sorted[1].title).toBe('Post without date');
    });
  });

  describe('sortUpdatesByDate', () => {
    it('should sort updates by date, most recent first', () => {
      const now = new Date();
      const updates = [
        {
          title: 'Old update',
          link: 'https://example.com/1',
          published: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog',
          sourceUrl: 'https://example.com/blog',
        },
        {
          title: 'Recent update',
          link: 'https://example.com/2',
          published: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog',
          sourceUrl: 'https://example.com/blog',
        },
      ];

      const sorted = sortUpdatesByDate(updates);
      
      expect(sorted[0].title).toBe('Recent update');
      expect(sorted[1].title).toBe('Old update');
    });
  });
});

