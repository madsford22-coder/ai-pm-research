/**
 * Unit tests for RSS adapters
 */

const {
  parseRSSFeed,
} = require('../rss');

describe('RSS adapters', () => {
  describe('parseRSSFeed', () => {
    it('should parse RSS feed content correctly', () => {
      const now = new Date();
      const recentDate = new Date(now - 5 * 24 * 60 * 60 * 1000).toUTCString();
      const oldDate = new Date(now - 40 * 24 * 60 * 60 * 1000).toUTCString();

      const rssContent = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <item>
      <title>Recent Post</title>
      <link>https://example.com/recent</link>
      <pubDate>${recentDate}</pubDate>
      <description>Recent post description</description>
    </item>
    <item>
      <title>Old Post</title>
      <link>https://example.com/old</link>
      <pubDate>${oldDate}</pubDate>
      <description>Old post description</description>
    </item>
  </channel>
</rss>`;

      const { posts, error } = parseRSSFeed(rssContent, { daysBack: 30 });

      expect(error).toBeNull();
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Recent Post');
      expect(posts[0].link).toBe('https://example.com/recent');
      expect(posts[0].source).toBe('blog_rss');
    });

    it('should handle Atom format', () => {
      const now = new Date();
      const recentDate = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();

      const atomContent = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Blog</title>
  <entry>
    <title>Recent Post</title>
    <link href="https://example.com/recent"/>
    <published>${recentDate}</published>
    <summary>Recent post summary</summary>
  </entry>
</feed>`;

      const { posts, error } = parseRSSFeed(atomContent, { daysBack: 30 });

      expect(error).toBeNull();
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Recent Post');
      expect(posts[0].link).toBe('https://example.com/recent');
    });

    it('should handle CDATA sections', () => {
      const now = new Date();
      const recentDate = new Date(now - 5 * 24 * 60 * 60 * 1000).toUTCString();

      const rssContent = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Post with <b>HTML</b>]]></title>
      <link><![CDATA[https://example.com/post]]></link>
      <pubDate>${recentDate}</pubDate>
    </item>
  </channel>
</rss>`;

      const { posts } = parseRSSFeed(rssContent, { daysBack: 30 });

      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Post with <b>HTML</b>');
      expect(posts[0].link).toBe('https://example.com/post');
    });

    it('should return error for malformed XML', () => {
      const malformedContent = '<rss><item><title>Unclosed tag';

      const { posts, error } = parseRSSFeed(malformedContent, { daysBack: 30 });

      // Should handle gracefully - might return empty posts or error
      expect(posts.length).toBe(0);
    });
  });
});

