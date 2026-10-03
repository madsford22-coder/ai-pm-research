import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const PRIVATE_PATHS = ['/api/', '/traffic', '/updates/daily/new', '/reflections/new'];

const LIVE_FETCH = [
  'ChatGPT-User',
  'OAI-SearchBot',
  'Claude-User',
  'Claude-SearchBot',
  'Claude-Web',
  'PerplexityBot',
];

const TRAINING_CRAWLERS = [
  'GPTBot',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
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
        disallow: PRIVATE_PATHS,
      },
      ...LIVE_FETCH.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/api/', '/traffic'],
      })),
      ...TRAINING_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
