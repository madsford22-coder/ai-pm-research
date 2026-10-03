import { ContentMetadata } from '@/lib/content/types';

function memoDate(value?: string | Date): { iso: string; label: string } | null {
  if (!value) return null;
  const date = value instanceof Date
    ? value
    : new Date(value.includes('T') ? value : `${value}T00:00:00Z`);
  return {
    iso: typeof value === 'string' && !value.includes('T') ? value : date.toISOString(),
    label: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  };
}

export default function HomeMemos({
  updates,
  heading = 'Latest memos',
}: {
  updates: ContentMetadata[];
  heading?: string;
}) {
  if (updates.length === 0) return null;

  return (
    <nav aria-label="Latest daily AI product memos">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {heading}
        </h2>
        <a
          href="/archive"
          className="inline-flex items-center gap-1 text-[#5a7a3a] dark:text-[#8db870] hover:text-[#4a6830] dark:hover:text-[#a3cc83] font-medium text-sm transition-colors"
        >
          Archive
        </a>
      </div>
      <ul className="grid gap-4">
        {updates.map((update) => {
          const date = memoDate(update.date);
          const title = update.title.replace(/^#+\s+/, '').trim();
          return (
            <li key={update.url}>
              <a
                href={update.url}
                className="group relative flex items-start justify-between gap-3 sm:gap-4 bg-white dark:bg-[#1e1c16] border border-[#e7e3dd] dark:border-[#2e2b24] rounded-xl p-4 sm:p-6 hover:border-[#c8d8b8] dark:hover:border-[#4a6830] hover:shadow-lg hover:shadow-[#c8d8b8]/40 dark:hover:shadow-[#2a3d1a]/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {date && (
                      <time
                        dateTime={date.iso}
                        className="text-xs text-[#a8a29e] dark:text-[#78716c] font-medium shrink-0"
                      >
                        {date.label}
                      </time>
                    )}
                    {update.underrepresented_voices != null && update.underrepresented_voices > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f8eef5] dark:bg-[#2a1528] text-[#8b3a78] dark:text-[#c47eb0] border border-[#e4bcd8] dark:border-[#5a2e50] shrink-0">
                        {update.underrepresented_voices === 1
                          ? '1 underrepresented voice'
                          : `${update.underrepresented_voices} underrepresented voices`}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#1c1917] dark:text-[#f5f0ea] mb-2 group-hover:text-[#5a7a3a] dark:group-hover:text-[#8db870] transition-colors">
                    {title}
                  </h3>
                  {update.summary && (
                    <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {update.summary}
                    </p>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#f3f0ea] dark:bg-[#2e2b24] group-hover:bg-[#eef4e8] dark:group-hover:bg-[#1e2d16] flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-[#a8a29e] dark:text-[#78716c] group-hover:text-[#5a7a3a] dark:group-hover:text-[#8db870]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
