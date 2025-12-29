/**
 * Unit tests for filter transforms
 */

const {
  filterByDate,
  filterUpdatesByDate,
  dedupePosts,
  dedupeUpdates,
} = require('../filter');

describe('filter transforms', () => {
  describe('filterByDate', () => {
    it('should filter posts by date range', () => {
      const now = new Date();
      const posts = [
        {
          title: 'Recent post',
          link: 'https://example.com/1',
          published: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog_rss',
        },
        {
          title: 'Old post',
          link: 'https://example.com/2',
          published: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog_rss',
        },
        {
          title: 'Post without date',
          link: 'https://example.com/3',
          published: null,
          source: 'blog_rss',
        },
      ];

      const filtered = filterByDate(posts, { daysBack: 30 });
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].title).toBe('Recent post');
      expect(filtered[1].title).toBe('Post without date');
    });

    it('should include posts without dates', () => {
      const posts = [
        {
          title: 'Post without date',
          link: 'https://example.com/1',
          published: null,
          source: 'blog_rss',
        },
      ];

      const filtered = filterByDate(posts, { daysBack: 30 });
      
      expect(filtered).toHaveLength(1);
    });
  });

  describe('filterUpdatesByDate', () => {
    it('should filter updates by date range', () => {
      const now = new Date();
      const updates = [
        {
          title: 'Recent update',
          link: 'https://example.com/1',
          published: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog',
          sourceUrl: 'https://example.com/blog',
        },
        {
          title: 'Old update',
          link: 'https://example.com/2',
          published: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'blog',
          sourceUrl: 'https://example.com/blog',
        },
      ];

      const filtered = filterUpdatesByDate(updates, { daysBack: 14 });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Recent update');
    });
  });

  describe('dedupePosts', () => {
    it('should remove duplicate posts by link', () => {
      const posts = [
        {
          title: 'Post 1',
          link: 'https://example.com/1',
          published: null,
          source: 'blog_rss',
        },
        {
          title: 'Post 2',
          link: 'https://example.com/2',
          published: null,
          source: 'blog_rss',
        },
        {
          title: 'Post 1 duplicate',
          link: 'https://example.com/1',
          published: null,
          source: 'blog_scrape',
        },
      ];

      const deduped = dedupePosts(posts);
      
      expect(deduped).toHaveLength(2);
      expect(deduped.map(p => p.link)).toEqual([
        'https://example.com/1',
        'https://example.com/2',
      ]);
    });
  });

  describe('dedupeUpdates', () => {
    it('should remove duplicate updates by link', () => {
      const updates = [
        {
          title: 'Update 1',
          link: 'https://example.com/1',
          source: 'blog',
          sourceUrl: 'https://example.com/blog',
        },
        {
          title: 'Update 2',
          link: 'https://example.com/2',
          source: 'blog',
          sourceUrl: 'https://example.com/blog',
        },
        {
          title: 'Update 1 duplicate',
          link: 'https://example.com/1',
          source: 'changelog',
          sourceUrl: 'https://example.com/changelog',
        },
      ];

      const deduped = dedupeUpdates(updates);
      
      expect(deduped).toHaveLength(2);
      expect(deduped.map(u => u.link)).toEqual([
        'https://example.com/1',
        'https://example.com/2',
      ]);
    });
  });
});

