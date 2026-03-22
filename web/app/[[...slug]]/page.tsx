import { Suspense } from 'react';
import Link from 'next/link';
import { getContentByPath, getAllContentPaths, getAllContentMetadata } from '@/lib/content/loader';
import { notFound } from 'next/navigation';
import TableOfContents from '@/components/TableOfContents';
import DateNavigator from '@/components/DateNavigator';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
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
  // Wrap h3 item sections in styled cards first
  const h3Parts = html.split(/(?=<h3[ >])/);
  const withCards = h3Parts.map((part) => {
    if (!part.startsWith('<h3')) return part;
    return `<div class="update-item-card">${part}</div>`;
  }).join('');

  // Wrap h2 sections in colored containers based on id
  const h2Parts = withCards.split(/(?=<h2[ >])/);
  return h2Parts.map((part) => {
    if (!part.startsWith('<h2')) return part;
    const idMatch = part.match(/<h2[^>]*\sid="([^"]+)"/);
    const id = idMatch?.[1] ?? '';
    if (id.includes('one-line-summary')) return `<div class="update-section-summary">${part}</div>`;
    if (id.includes('quick-hits')) return `<div class="update-section-quickhits">${part}</div>`;
    if (id.includes('pattern')) return `<div class="update-section-pattern">${part}</div>`;
    if (id.includes('reflection')) return `<div class="update-section-reflection">${part}</div>`;
    return part;
  }).join('');
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Handle root route - show dashboard
  if (!slug || slug.length === 0) {
    const Dashboard = (await import('@/components/Dashboard')).default;
    return (
      <Suspense>
        <Dashboard />
      </Suspense>
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

  // Format title properly (remove any markdown formatting, fix capitalization)
  const formatTitle = (title: string) => {
    let formatted = title
      .replace(/^#+\s+/, '') // Remove markdown headers
      .trim();
    
    // Ensure "AI" is always capitalized correctly
    formatted = formatted.replace(/\bAi\b/gi, 'AI');
    formatted = formatted.replace(/\bai\b/gi, 'AI');
    // Ensure "PMs" is always capitalized correctly
    formatted = formatted.replace(/\bPms\b/g, 'PMs');
    
    return formatted;
  };

  const formattedTitle = formatTitle(content.title);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
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
              {isDailyUpdate && content.women_voices != null && content.women_voices > 0 && (
                <>
                  <span className="text-[#e7e3dd] dark:text-[#2e2b24]">·</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f8eef5] dark:bg-[#2a1528] text-[#8b3a78] dark:text-[#c47eb0] border border-[#e4bcd8] dark:border-[#5a2e50]">
                    {content.women_voices === 1 ? '1 woman featured' : `${content.women_voices} women featured`}
                  </span>
                </>
              )}
            </div>
          </header>
          <div dangerouslySetInnerHTML={{ __html: isDailyUpdate ? processUpdateHTML(content.html) : content.html }} />
        </article>
        <TableOfContents html={content.html} />
      </div>
    </div>
  );
}

