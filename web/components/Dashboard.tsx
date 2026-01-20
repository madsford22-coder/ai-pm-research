'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    const date = new Date(dateStr);
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-2xl p-8 border border-blue-100 dark:border-blue-900 overflow-hidden">
          <div className="h-8 animate-shimmer rounded w-1/3 mb-3"></div>
          <div className="h-4 animate-shimmer rounded w-2/3 mb-6"></div>
          <div className="h-10 animate-shimmer rounded w-32"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 overflow-hidden">
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
    <div className="space-y-8 sm:space-y-16 animate-fade-in">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 rounded-2xl sm:rounded-3xl -z-10"></div>
        <div className="px-4 sm:px-8 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              AI PM Research Hub
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
            Your daily dose of AI product insights, practical patterns, and PM takeaways from the evolving world of AI tools and workflows
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
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
            {startDate && endDate && ` from ${new Date(startDate + 'T00:00:00').toLocaleDateString()} to ${new Date(endDate + 'T00:00:00').toLocaleDateString()}`}
            {startDate && !endDate && ` from ${new Date(startDate + 'T00:00:00').toLocaleDateString()}`}
            {!startDate && endDate && ` until ${new Date(endDate + 'T00:00:00').toLocaleDateString()}`}
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
              href="/updates/daily"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors group"
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
                className="group relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {update.title.replace(/^#+\s+/, '').trim()}
                    </h3>
                    {update.date && (
                      <time className="text-sm text-gray-500 dark:text-gray-400 font-medium" dateTime={update.date}>
                        {new Date(update.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

