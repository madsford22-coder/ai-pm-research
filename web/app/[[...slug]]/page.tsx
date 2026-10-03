import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getContentByPath, getAllContentPaths, getAllContentMetadata, getDailyUpdates } from '@/lib/content/loader';
import { notFound } from 'next/navigation';
import TableOfContents from '@/components/TableOfContents';
import DateNavigator from '@/components/DateNavigator';
import QueryWidget from '@/components/QueryWidget';
import { SITE_NAME, SITE_URL, absoluteUrl, descriptionFromMarkdown, formatSeoTitle } from '@/lib/seo';
import HomeHero from '@/components/HomeHero';
import HomeMemos from '@/components/HomeMemos';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    return {
      title: { absolute: SITE_NAME },
      description:
        "Daily AI product news and analysis for product managers building with AI. Madison's Morning Memo is a daily AI product management newsletter by Madison Ford.",
      alternates: { canonical: SITE_URL },
    };
  }

  const content = await getContentByPath(`${slug.join('/')}.md`);
  if (!content) return {};

  const title = formatSeoTitle(content.title);
  const description = descriptionFromMarkdown(content.content, content.summary);
  const url = absoluteUrl(content.url);
  const published = content.date
    ? (content.date instanceof Date
        ? content.date.toISOString()
        : `${content.date.includes('T') ? content.date : `${content.date}T00:00:00Z`}`)
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: SITE_NAME,
      publishedTime: published,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export async function generateStaticParams() {
  try {
    const paths = getAllContentPaths();
    
    return [
      { slug: [] }, // root path → Dashboard
      ...paths
        .filter((path) => path !== 'index.md')
        .map((path) => {
          const slug = path.replace(/\.md$/, '').split('/');
          return { slug };
        }),
    ];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

function processUpdateHTML(html: string): string {
  // Strip horizontal rules — colored blocks provide visual separation
  const stripped = html.replace(/<hr\s*\/?>/gi, '');

  // Split on h2 OR h3 boundaries so each part only contains its own content
  // (splitting on h3 alone would let h3 parts swallow subsequent h2 sections)
  const parts = stripped.split(/(?=<h[23][ >])/);

  // Wrap h3 parts in cards
  const withCards = parts.map((part) => {
    if (!part.startsWith('<h3')) return part;
    return `<div class="update-item-card">${part}</div>`;
  }).join('');

  // Wrap h2 sections in colored containers based on id
  const h2Parts = withCards.split(/(?=<h2[ >])/);
  return h2Parts.map((part) => {
    if (!part.startsWith('<h2')) return part;
    const idMatch = part.match(/<h2[^>]*\sid="([^"]+)"/);
    const id = idMatch?.[1] ?? '';
    if (id.includes('short-version') || id.includes('one-line-summary')) {
      // Only wrap the h2 + its summary text, not any cards that follow
      const cardStart = part.indexOf('<div class="update-item-card"');
      if (cardStart >= 0) {
        return `<div class="update-section-summary">${part.slice(0, cardStart)}</div>${part.slice(cardStart)}`;
      }
      return `<div class="update-section-summary">${part}</div>`;
    }
    if (id.includes('quick-hits')) return `<div class="update-section-quickhits">${part}</div>`;
    if (id.includes('thread') || id.includes('pattern')) return `<div class="update-section-pattern">${part}</div>`;
    if (id.includes('sit-with') || id.includes('reflection')) return `<div class="update-section-reflection">${part}</div>`;
    if (id === 'items') return part.replace(/<h2[^>]*>.*?<\/h2>/, '');
    return part;
  }).join('');
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Handle root route - show dashboard
  if (!slug || slug.length === 0) {
    const Dashboard = (await import('@/components/Dashboard')).default;
    const updates = getDailyUpdates();
    const latest = updates.slice(0, 20);
    return (
      <div className="space-y-4 sm:space-y-8 max-w-4xl mx-auto">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  name: SITE_NAME,
                  url: SITE_URL,
                  description:
                    'Daily AI product news and analysis for product managers building with AI.',
                  author: { '@id': `${SITE_URL}#madison` },
                },
                {
                  '@type': 'Person',
                  '@id': `${SITE_URL}#madison`,
                  name: 'Madison Ford',
                  jobTitle: 'Senior Product Manager',
                  url: SITE_URL,
                  sameAs: ['https://www.linkedin.com/in/madison-ford-31897872/'],
                },
              ],
            }),
          }}
        />
        <HomeHero latestUrl={updates[0]?.url} />
        <HomeMemos updates={latest} />
        <Suspense>
          <Dashboard initialUpdates={updates} />
        </Suspense>
      </div>
    );
  }
  
  const filePath = `${slug.join('/')}.md`;
  const content = await getContentByPath(filePath);
  
  if (!content) {
    notFound();
  }

  // Check if this is a daily update page
  const isDailyUpdate = filePath.startsWith('updates/daily/');
  const availableDates: string[] = [];
  
  if (isDailyUpdate) {
    // Get all daily update dates for navigation
    const allPaths = getAllContentPaths();
    const dailyPaths = allPaths.filter(p => p.startsWith('updates/daily/'));
    const allMetadata = getAllContentMetadata().filter(m => 
      m.path.startsWith('updates/daily/') && m.date
    );
    
    availableDates.push(...allMetadata
      .map(m => m.date instanceof Date ? m.date.toISOString().split('T')[0] : m.date!)
      .filter(Boolean)
      .sort()
      .reverse());
  }

  const formattedTitle = formatSeoTitle(content.title);
  const description = descriptionFromMarkdown(content.content, content.summary);
  const canonical = absoluteUrl(content.url);
  const published = content.date
    ? (content.date instanceof Date
        ? content.date.toISOString()
        : `${content.date.includes('T') ? content.date : `${content.date}T00:00:00Z`}`)
    : undefined;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {isDailyUpdate && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: formattedTitle,
              description,
              datePublished: published,
              url: canonical,
              author: { '@type': 'Person', name: 'Madison Ford', url: SITE_URL },
              publisher: { '@type': 'Person', name: 'Madison Ford', url: SITE_URL },
              mainEntityOfPage: canonical,
            }),
          }}
        />
      )}
      <Link
        href="/"
        className="lg:hidden inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Home
      </Link>
      {isDailyUpdate && content.date && availableDates.length > 0 && (
        <DateNavigator
          currentDate={content.date instanceof Date ? content.date.toISOString().split('T')[0] : content.date}
          availableDates={availableDates}
        />
      )}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        <article className="prose prose-lg flex-1 min-w-0 max-w-none">
          <header className="mb-8 sm:mb-12 pb-6 sm:pb-8 border-b border-[#e7e3dd] dark:border-[#2e2b24]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1c1917] dark:text-[#f5f0ea] leading-[1.1] mb-4 sm:mb-6 tracking-[-0.025em]">
              {formattedTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm mb-4">
              {content.date && (
                <time
                  dateTime={content.date instanceof Date ? content.date.toISOString() : content.date}
                  className="text-xs font-medium tracking-wide uppercase text-[#78716c] dark:text-[#a8a29e]"
                >
                  {(() => {
                    const date = content.date instanceof Date
                      ? content.date
                      : (content.date.includes('T') ? new Date(content.date) : new Date(content.date + 'T00:00:00'));
                    return date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    });
                  })()}
                </time>
              )}
              {content.source_url && (
                <>
                  <span className="text-[#e7e3dd] dark:text-[#2e2b24]">·</span>
                  <a
                    href={content.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5a7a3a] dark:text-[#8db870] hover:text-[#4a6830] dark:hover:text-[#a3cc83] transition-colors font-medium"
                  >
                    Source
                  </a>
                </>
              )}
              {isDailyUpdate && content.underrepresented_voices != null && content.underrepresented_voices > 0 && (
                <>
                  <span className="text-[#e7e3dd] dark:text-[#2e2b24]">·</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f8eef5] dark:bg-[#2a1528] text-[#8b3a78] dark:text-[#c47eb0] border border-[#e4bcd8] dark:border-[#5a2e50]">
                    {content.underrepresented_voices === 1 ? '1 underrepresented voice' : `${content.underrepresented_voices} underrepresented voices`}
                  </span>
                </>
              )}
            </div>
          </header>
          <div dangerouslySetInnerHTML={{ __html: isDailyUpdate ? processUpdateHTML(content.html) : content.html }} />
        </article>
        <TableOfContents html={content.html} />
      </div>
      {isDailyUpdate && content.date && (
        <div className="mt-12 pt-10 border-t border-[#e7e3dd] dark:border-[#2e2b24]">
          <QueryWidget
            date={content.date instanceof Date ? content.date.toISOString().split('T')[0] : content.date}
          />
        </div>
      )}
    </div>
  );
}

