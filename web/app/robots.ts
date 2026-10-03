import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const AI_CRAWLERS = [
  'GPTBot',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Bytespider',
  'Amazonbot',
  'Applebot-Extended',
  'meta-externalagent',
  'FacebookBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/traffic', '/updates/daily/new', '/reflections/new'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/traffic'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
