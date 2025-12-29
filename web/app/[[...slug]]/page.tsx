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
  const filePath = slug ? `${slug.join('/')}.md` : 'index.md';
  
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
    return title
      .replace(/^#+\s+/, '') // Remove markdown headers
      .trim();
  };

  const formattedTitle = formatTitle(content.title);

  return (
    <div className="space-y-8">
      {isDailyUpdate && content.date && availableDates.length > 0 && (
        <DateNavigator currentDate={content.date} availableDates={availableDates} />
      )}
      <div className="flex gap-12">
        <article className="prose flex-1 min-w-0">
          <header className="mb-10">
            <h1 className="text-5xl font-bold text-[#1a1a1a] leading-tight mb-4 tracking-tight">
              {formattedTitle}
            </h1>
            <div className="flex items-center gap-4 text-sm text-[#6b7280] mb-6">
              {content.date && (
                <time dateTime={content.date}>
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
                  <span>•</span>
                  <a 
                    href={content.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
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
                    className="px-3 py-1 bg-[#f3f4f6] text-[#4b5563] text-xs font-medium rounded-full border border-[#e5e7eb]"
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

