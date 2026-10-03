'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ContentMetadata } from '@/lib/content/types';
import QueryWidget from '@/components/QueryWidget';
import HomeMemos from '@/components/HomeMemos';

export default function Dashboard({
  initialUpdates = [],
}: {
  initialUpdates?: ContentMetadata[];
}) {
  const searchParams = useSearchParams();
  const [allUpdates, setAllUpdates] = useState<ContentMetadata[]>(initialUpdates);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) setStartDate(from);
    if (to) setEndDate(to);
  }, [searchParams]);

  useEffect(() => {
    if (initialUpdates.length > 0) return;

    fetch('/api/content/metadata')
      .then((res) => res.json())
      .then((data: ContentMetadata[]) => {
        const updates = data
          .filter((item) => item.path.startsWith('updates/daily/') && !item.tags?.includes('monthly-summary'))
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });
        setAllUpdates(updates);
      })
      .catch((err) => {
        console.error('Failed to load recent updates:', err);
      });
  }, [initialUpdates.length]);

  const filtering = Boolean(startDate || endDate);
  const filteredUpdates = filtering
    ? allUpdates.filter((item) => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && end) return itemDate >= start && itemDate <= end;
        if (start) return itemDate >= start;
        if (end) return itemDate <= end;
        return true;
      })
    : [];

  return (
    <div className="space-y-4 sm:space-y-8">
      <QueryWidget />

      <div className="bg-white dark:bg-[#1e1c16] rounded-xl border border-[#e7e3dd] dark:border-[#2e2b24] p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-end">
          <div className="flex-1 grid grid-cols-2 gap-4 w-full min-w-0">
            <div className="min-w-0">
              <label htmlFor="start-date" className="block text-xs sm:text-sm font-medium text-[#44403c] dark:text-[#c8c4bc] mb-1 sm:mb-2">
                From
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="w-full min-w-0 px-1.5 sm:px-3 py-1.5 sm:py-2 border border-[#e7e3dd] dark:border-[#2e2b24] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5a7a3a] dark:focus:ring-[#8db870] bg-[#faf8f5] dark:bg-[#18160f] text-[#1c1917] dark:text-[#f5f0ea] cursor-pointer"
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
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="w-full min-w-0 px-1.5 sm:px-3 py-1.5 sm:py-2 border border-[#e7e3dd] dark:border-[#2e2b24] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5a7a3a] dark:focus:ring-[#8db870] bg-[#faf8f5] dark:bg-[#18160f] text-[#1c1917] dark:text-[#f5f0ea] cursor-pointer"
              />
            </div>
          </div>
          {filtering && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
        {filtering && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredUpdates.length} {filteredUpdates.length === 1 ? 'update' : 'updates'}
          </p>
        )}
      </div>

      {filtering && (
        filteredUpdates.length > 0
          ? <HomeMemos updates={filteredUpdates} heading="Filtered Updates" />
          : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-gray-400">
                No updates found for the selected date range.
              </p>
            </div>
          )
      )}
    </div>
  );
}
