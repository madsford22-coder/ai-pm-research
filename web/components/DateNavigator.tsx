'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DateNavigatorProps {
  currentDate?: string;
  availableDates: string[];
}

export default function DateNavigator({ currentDate, availableDates }: DateNavigatorProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(currentDate || '');

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateForInput = (dateStr: string) => {
    return dateStr; // Already in YYYY-MM-DD format
  };

  const getPreviousDate = () => {
    if (!currentDate) return null;
    const currentIndex = availableDates.indexOf(currentDate);
    if (currentIndex > 0) {
      return availableDates[currentIndex - 1];
    }
    return null;
  };

  const getNextDate = () => {
    if (!currentDate) return null;
    const currentIndex = availableDates.indexOf(currentDate);
    if (currentIndex < availableDates.length - 1) {
      return availableDates[currentIndex + 1];
    }
    return null;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    router.push(`/updates/daily/${newDate}`);
  };

  const prevDate = getPreviousDate();
  const nextDate = getNextDate();

  if (availableDates.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 p-3 sm:p-4 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {prevDate ? (
            <Link
              href={`/updates/daily/${prevDate}`}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
              title={`Previous: ${formatDateForDisplay(prevDate)}`}
              aria-label={`Go to previous update: ${formatDateForDisplay(prevDate)}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <div className="p-2 text-gray-300 dark:text-slate-600 cursor-not-allowed" aria-label="No previous update">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={availableDates[availableDates.length - 1]}
              max={availableDates[0]}
              className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
            {currentDate && (
              <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-400">
                {formatDateForDisplay(currentDate)}
              </span>
            )}
          </div>

          {nextDate ? (
            <Link
              href={`/updates/daily/${nextDate}`}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
              title={`Next: ${formatDateForDisplay(nextDate)}`}
              aria-label={`Go to next update: ${formatDateForDisplay(nextDate)}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="p-2 text-gray-300 dark:text-slate-600 cursor-not-allowed" aria-label="No next update">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>

        <Link
          href="/updates/daily"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline"
        >
          View All
        </Link>
      </div>
    </div>
  );
}

