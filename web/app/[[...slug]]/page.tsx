import { getContentByPath, getAllContentPaths, getAllContentMetadata } from '@/lib/content/loader';
import { notFound } from 'next/navigation';
import TableOfContents from '@/components/TableOfContents';
import DateNavigator from '@/components/DateNavigator';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

// Force dynamic rendering to always check for new content
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always revalidate

// Optional: Pre-generate known paths for better performance
// But still allow dynamic routes for new content
export async function generateStaticParams() {
  try {
    const paths = getAllContentPaths();
    
    return paths
      .filter((path) => path !== 'index.md')
      .map((path) => {
        const slug = path.replace(/\.md$/, '').split('/');
        return {
          slug,
        };
      });
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Handle root route - show dashboard
  if (!slug || slug.length === 0) {
    const Dashboard = (await import('@/components/Dashboard')).default;
    return <Dashboard />;
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
      .map(m => m.date!)
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
    <div className="space-y-6 sm:space-y-8">
      {isDailyUpdate && content.date && availableDates.length > 0 && (
        <DateNavigator currentDate={content.date} availableDates={availableDates} />
      )}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        <article className="prose prose-lg flex-1 min-w-0 max-w-none">
          <header className="mb-8 sm:mb-12 pb-6 sm:pb-8 border-b border-gray-200 dark:border-slate-700">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.1] mb-4 sm:mb-6 tracking-[-0.025em]">
              {formattedTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
              {content.date && (
                <time dateTime={content.date} className="font-medium">
                  {new Date(content.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
              {content.source_url && (
                <>
                  <span className="text-gray-300 dark:text-slate-600">•</span>
                  <a
                    href={content.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                  >
                    Source
                  </a>
                </>
              )}
            </div>
            {content.tags && content.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {content.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-md border border-gray-200 dark:border-slate-700"
                  >
                    {tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </header>
          <div dangerouslySetInnerHTML={{ __html: content.html }} />
        </article>
        <TableOfContents html={content.html} />
      </div>
    </div>
  );
}

