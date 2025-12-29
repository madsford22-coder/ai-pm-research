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
    <div className="bg-[#f9fafb] rounded-md border border-[#e5e7eb] p-4 mb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {prevDate ? (
            <Link
              href={`/updates/daily/${prevDate}`}
              className="p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f3f4f6] rounded transition-colors"
              title={`Previous: ${formatDateForDisplay(prevDate)}`}
              aria-label={`Go to previous update: ${formatDateForDisplay(prevDate)}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : (
            <div className="p-2 text-gray-300 cursor-not-allowed" aria-label="No previous update">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={availableDates[availableDates.length - 1]}
              max={availableDates[0]}
              className="px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent bg-white"
            />
            {currentDate && (
              <span className="text-sm text-gray-600">
                {formatDateForDisplay(currentDate)}
              </span>
            )}
          </div>

          {nextDate ? (
            <Link
              href={`/updates/daily/${nextDate}`}
              className="p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f3f4f6] rounded transition-colors"
              title={`Next: ${formatDateForDisplay(nextDate)}`}
              aria-label={`Go to next update: ${formatDateForDisplay(nextDate)}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div className="p-2 text-gray-300 cursor-not-allowed" aria-label="No next update">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>

        <Link
          href="/updates/daily"
          className="text-sm text-[#2563eb] hover:text-[#1d4ed8] font-medium hover:underline"
        >
          View All
        </Link>
      </div>
    </div>
  );
}

