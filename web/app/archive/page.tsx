import Link from 'next/link';
import { getDailyUpdates } from '@/lib/content/loader';

function monthLabel(dateStr?: string | Date): string {
  if (!dateStr) return 'Undated';
  const date = dateStr instanceof Date
    ? dateStr
    : new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function ArchivePage() {
  const updates = getDailyUpdates();
  const groups = new Map<string, typeof updates>();

  for (const update of updates) {
    const key = monthLabel(update.date);
    const list = groups.get(key) || [];
    list.push(update);
    groups.set(key, list);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-medium tracking-widest uppercase text-[#78716c] dark:text-[#a8a29e]">
          Madison&apos;s Morning Memo
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1c1917] dark:text-[#f5f0ea] tracking-[-0.025em]">
          Archive
        </h1>
        <p className="text-[15px] text-[#44403c] dark:text-[#c8c4bc] leading-relaxed">
          Every daily AI product briefing, newest first. {updates.length} memos.
        </p>
      </header>

      {Array.from(groups.entries()).map(([month, items]) => (
        <section key={month}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#78716c] dark:text-[#a8a29e] mb-3">
            {month}
          </h2>
          <ul className="space-y-2">
            {items.map((update) => (
              <li key={update.url}>
                <Link
                  href={update.url}
                  className="group flex items-baseline gap-3 py-1.5"
                >
                  {update.date && (
                    <time
                      dateTime={typeof update.date === 'string' ? update.date : update.date.toISOString()}
                      className="shrink-0 w-16 text-xs text-[#a8a29e] dark:text-[#78716c]"
                    >
                      {(() => {
                        const date = update.date instanceof Date
                          ? update.date
                          : new Date(`${update.date}T00:00:00Z`);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                      })()}
                    </time>
                  )}
                  <span className="text-[15px] text-[#1c1917] dark:text-[#f5f0ea] group-hover:text-[#5a7a3a] dark:group-hover:text-[#8db870] transition-colors">
                    {update.title.replace(/^#+\s+/, '').trim()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
