import { getAllContentMetadata } from '@/lib/content/loader';

export const dynamic = 'force-dynamic';

export async function GET() {
  const metadata = getAllContentMetadata();

  // Filter for daily updates (files in YYYY/YYYY-MM-DD.md format) and sort by date
  const updates = metadata
    .filter(item => {
      // Match pattern like "2026/2026-01-19.md"
      return /^\d{4}\/\d{4}-\d{2}-\d{2}$/.test(item.slug);
    })
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 20); // Last 20 updates

  const siteUrl = process.env.SITE_URL || 'https://ai-pm-research.netlify.app';
  const buildDate = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI PM Research - Daily Updates</title>
    <link>${siteUrl}</link>
    <description>Daily research updates on AI product management, companies, and industry trends</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${updates
      .map(
        (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${siteUrl}${item.url}</link>
      <guid isPermaLink="true">${siteUrl}${item.url}</guid>
      ${item.date ? `<pubDate>${new Date(item.date).toUTCString()}</pubDate>` : ''}
      ${item.summary ? `<description>${escapeXml(item.summary)}</description>` : ''}
      ${item.tags ? item.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ') : ''}
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
