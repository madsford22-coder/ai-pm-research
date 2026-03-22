'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ContentMetadata } from '@/lib/content/types';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [allUpdates, setAllUpdates] = useState<ContentMetadata[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<ContentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize dates from URL params
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) setStartDate(from);
    if (to) setEndDate(to);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/content/metadata')
      .then((res) => res.json())
      .then((data: ContentMetadata[]) => {
        // Filter for daily updates by path pattern and sort by date (newest first)
        const updates = data
          .filter((item) => item.path.startsWith('updates/daily/') && !item.tags?.includes('monthly-summary'))
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });

        setAllUpdates(updates);
        setFilteredUpdates(updates.slice(0, 20)); // Show 20 most recent by default
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load recent updates:', err);
        setLoading(false);
      });
  }, []);

  // Filter updates when date range changes
  useEffect(() => {
    if (!startDate && !endDate) {
      // No filters - show 20 most recent
      setFilteredUpdates(allUpdates.slice(0, 20));
      return;
    }

    const filtered = allUpdates.filter((item) => {
      if (!item.date) return false;

      const itemDate = new Date(item.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        return itemDate >= start && itemDate <= end;
      } else if (start) {
        return itemDate >= start;
      } else if (end) {
        return itemDate <= end;
      }
      return true;
    });

    setFilteredUpdates(filtered);
  }, [startDate, endDate, allUpdates]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    // Handle both ISO strings and YYYY-MM-DD format
    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-[#f3f0ea] dark:bg-[#1e1c16] rounded-2xl p-8 border border-[#e7e3dd] dark:border-[#2e2b24] overflow-hidden">
          <div className="h-8 animate-shimmer rounded w-1/3 mb-3"></div>
          <div className="h-4 animate-shimmer rounded w-2/3 mb-6"></div>
          <div className="h-10 animate-shimmer rounded w-32"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#1e1c16] rounded-lg border border-[#e7e3dd] dark:border-[#2e2b24] p-6 overflow-hidden">
              <div className="h-6 animate-shimmer rounded w-3/4 mb-3"></div>
              <div className="h-4 animate-shimmer rounded w-full mb-2"></div>
              <div className="h-4 animate-shimmer rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in">
      {/* Hero / Intro Section */}
      <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-[#f3f0ea] dark:bg-[#1e1c16] border border-[#e7e3dd] dark:border-[#2e2b24]">
        <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8">
            {/* Photo */}
            <div className="shrink-0 self-start">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-[#c8d8b8] dark:ring-[#4a6830] shadow-md">
                <Image
                  src="/madison.jpeg"
                  alt="Madison"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover object-top"
                  priority
                />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium tracking-widest uppercase text-[#78716c] dark:text-[#a8a29e] mb-2">
                Madison&apos;s Morning Memo
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#1c1917] dark:text-[#f5f0ea] leading-snug mb-4">
                Your daily signal from the AI world, no noise required.
              </h1>
              <div className="space-y-3 text-[15px] leading-relaxed text-[#44403c] dark:text-[#c8c4bc]">
                <p>
                  Hi, I&apos;m Madison. I&apos;m a Senior PM at Rocket Money, where I build AI products
                  that help millions of people manage their finances. It&apos;s work that feels personal:
                  I grew up on financial aid and know firsthand what it means to stretch a dollar.
                </p>
                <p>
                  I&apos;m also deeply curious about where AI is going, but I&apos;m not on social media
                  and I don&apos;t want to be. I wanted a way to stay informed without the endless scroll,
                  something intentional and actually useful. So I built this.
                </p>
                <p>
                  Every morning it pulls signals from the companies and people shaping applied AI and
                  distills it into something you can read over coffee. I pay special attention to voices
                  that don&apos;t always make the front page: women in tech, builders outside the spotlight.
                  This is my quiet corner of the internet. I hope it becomes useful to you too.
                </p>
              </div>
            </div>
          </div>

          {/* CTA + contact */}
          <div className="mt-6 pt-6 border-t border-[#ddd9d2] dark:border-[#2e2b24] flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <a
                href="mailto:madsford22@gmail.com"
                className="inline-flex items-center gap-1.5 text-sm text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Say hello
              </a>
              <a
                href="https://www.linkedin.com/in/madison-ford-31897872/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
            {allUpdates.length > 0 && (
              <Link
                href={allUpdates[0].url}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#5a7a3a] hover:bg-[#4a6830] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Today&apos;s update
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-[#1e1c16] rounded-xl border border-[#e7e3dd] dark:border-[#2e2b24] p-3 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full min-w-0">
            <div className="min-w-0">
              <label htmlFor="start-date" className="block text-xs sm:text-sm font-medium text-[#44403c] dark:text-[#c8c4bc] mb-1 sm:mb-2">
                From
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-w-0 px-1.5 sm:px-3 py-1.5 sm:py-2 border border-[#e7e3dd] dark:border-[#2e2b24] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5a7a3a] dark:focus:ring-[#8db870] bg-[#faf8f5] dark:bg-[#18160f] text-[#1c1917] dark:text-[#f5f0ea]"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="end-date" className="block text-xs sm:text-sm font-medium text-[#44403c] dark:text-[#c8c4bc] mb-1 sm:mb-2">
                To
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-w-0 px-1.5 sm:px-3 py-1.5 sm:py-2 border border-[#e7e3dd] dark:border-[#2e2b24] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5a7a3a] dark:focus:ring-[#8db870] bg-[#faf8f5] dark:bg-[#18160f] text-[#1c1917] dark:text-[#f5f0ea]"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
        {(startDate || endDate) && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredUpdates.length} {filteredUpdates.length === 1 ? 'update' : 'updates'}
            {startDate && endDate && ` from ${(startDate.includes('T') ? new Date(startDate) : new Date(startDate + 'T00:00:00')).toLocaleDateString()} to ${(endDate.includes('T') ? new Date(endDate) : new Date(endDate + 'T00:00:00')).toLocaleDateString()}`}
            {startDate && !endDate && ` from ${(startDate.includes('T') ? new Date(startDate) : new Date(startDate + 'T00:00:00')).toLocaleDateString()}`}
            {!startDate && endDate && ` until ${(endDate.includes('T') ? new Date(endDate) : new Date(endDate + 'T00:00:00')).toLocaleDateString()}`}
          </p>
        )}
      </div>

      {filteredUpdates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {startDate || endDate ? 'Filtered Updates' : 'Latest Updates'}
            </h2>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[#5a7a3a] dark:text-[#8db870] hover:text-[#4a6830] dark:hover:text-[#a3cc83] font-medium text-sm transition-colors group"
            >
              View all
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid gap-3 sm:gap-4">
            {filteredUpdates.map((update) => (
              <Link
                key={update.url}
                href={update.url}
                className="group relative bg-white dark:bg-[#1e1c16] border border-[#e7e3dd] dark:border-[#2e2b24] rounded-xl p-4 sm:p-6 hover:border-[#c8d8b8] dark:hover:border-[#4a6830] hover:shadow-lg hover:shadow-[#c8d8b8]/40 dark:hover:shadow-[#2a3d1a]/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {update.date && (
                        <time className="text-xs text-[#a8a29e] dark:text-[#78716c] font-medium shrink-0" dateTime={update.date instanceof Date ? update.date.toISOString() : update.date}>
                          {(() => {
                            const date = update.date instanceof Date
                              ? update.date
                              : (update.date.includes('T') ? new Date(update.date) : new Date(update.date + 'T00:00:00'));
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              timeZone: 'UTC',
                            });
                          })()}
                        </time>
                      )}
                      {update.women_voices != null && update.women_voices > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f8eef5] dark:bg-[#2a1528] text-[#8b3a78] dark:text-[#c47eb0] border border-[#e4bcd8] dark:border-[#5a2e50] shrink-0">
                          {update.women_voices === 1 ? '1 woman featured' : `${update.women_voices} women featured`}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#1c1917] dark:text-[#f5f0ea] mb-2 group-hover:text-[#5a7a3a] dark:group-hover:text-[#8db870] transition-colors line-clamp-2">
                      {update.title.replace(/^#+\s+/, '').trim()}
                    </h3>
                    {update.summary && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {update.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#f3f0ea] dark:bg-[#2e2b24] group-hover:bg-[#eef4e8] dark:group-hover:bg-[#1e2d16] flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-[#a8a29e] dark:text-[#78716c] group-hover:text-[#5a7a3a] dark:group-hover:text-[#8db870] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {filteredUpdates.length === 0 && !loading && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400">
            {startDate || endDate ? 'No updates found for the selected date range.' : 'No daily updates found.'}
          </p>
        </div>
      )}
    </div>
  );
}

