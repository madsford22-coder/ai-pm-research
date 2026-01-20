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
  const [selectedDate, setSelectedDate] = useState(currentDate ? toDateStringHelper(currentDate) : '');

  // Helper function for initial state (can't use function declared below)
  function toDateStringHelper(date: string | Date): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper to convert date to YYYY-MM-DD string
  const toDateString = (date: string | Date): string => {
    if (typeof date === 'string') {
      // If it's already a string, extract just the date part (YYYY-MM-DD)
      return date.split('T')[0];
    }
    // If it's a Date object, format it
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateStr: string) => {
    // Add T00:00:00 to ensure date is parsed in local timezone
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateForInput = (dateStr: string) => {
    return toDateString(dateStr);
  };

  const getPreviousDate = () => {
    if (!currentDate) return null;
    const currentIndex = availableDates.indexOf(currentDate);
    // availableDates is sorted descending (newest first), so next index is older/previous
    if (currentIndex >= 0 && currentIndex < availableDates.length - 1) {
      return availableDates[currentIndex + 1];
    }
    return null;
  };

  const getNextDate = () => {
    if (!currentDate) return null;
    const currentIndex = availableDates.indexOf(currentDate);
    // availableDates is sorted descending (newest first), so previous index is newer/next
    if (currentIndex > 0) {
      return availableDates[currentIndex - 1];
    }
    return null;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    // Extract year from date (YYYY-MM-DD format)
    const year = newDate.split('-')[0];
    router.push(`/updates/daily/${year}/${newDate}`);
  };

  const prevDate = getPreviousDate();
  const nextDate = getNextDate();

  if (availableDates.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 p-3 sm:p-4 mb-6 sm:mb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {prevDate ? (
            <Link
              href={`/updates/daily/${toDateString(prevDate).split('-')[0]}/${toDateString(prevDate)}`}
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

          {currentDate && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatDateForDisplay(currentDate)}
            </span>
          )}

          {nextDate ? (
            <Link
              href={`/updates/daily/${toDateString(nextDate).split('-')[0]}/${toDateString(nextDate)}`}
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

