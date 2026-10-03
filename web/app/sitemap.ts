import type { MetadataRoute } from 'next';
import { getAllContentMetadata } from '@/lib/content/loader';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

function toDate(value: string | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value.includes('T')) return new Date(value);
  return new Date(`${value}T00:00:00Z`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = getAllContentMetadata().filter((item) => item.url && item.url !== '/');

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/archive'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/feedback'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...pages.map((item) => {
      const isDaily = item.path.startsWith('updates/daily/');
      return {
        url: absoluteUrl(item.url),
        lastModified: toDate(item.date),
        changeFrequency: isDaily ? 'weekly' : 'monthly',
        priority: isDaily ? 0.8 : 0.6,
      } satisfies MetadataRoute.Sitemap[number];
    }),
  ];
}
