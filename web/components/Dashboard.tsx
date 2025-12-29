'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ContentMetadata } from '@/lib/content/types';

export default function Dashboard() {
  const [recentUpdates, setRecentUpdates] = useState<ContentMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content/metadata')
      .then((res) => res.json())
      .then((data: ContentMetadata[]) => {
        // Filter for daily updates and sort by date (newest first)
        const updates = data
          .filter((item) => item.tags?.includes('daily-update'))
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 5);
        setRecentUpdates(updates);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load recent updates:', err);
        setLoading(false);
      });
  }, []);

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
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="border-b border-[#e5e7eb] pb-8">
        <h1 className="text-5xl font-bold text-[#1a1a1a] mb-4 tracking-tight">
          AI PM Research Assistant
        </h1>
        <p className="text-xl text-[#6b7280] leading-relaxed max-w-2xl">
          Your system of record for tracking AI product signals and translating them into actionable PM insights.
        </p>
        <div className="flex gap-3 flex-wrap mt-8">
          <Link
            href="/updates/daily/new"
            className="inline-flex items-center px-5 py-2.5 bg-[#1a1a1a] text-white font-medium rounded-md hover:bg-[#2a2a2a] transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Daily Update
          </Link>
          <Link
            href="/reflections/new"
            className="inline-flex items-center px-5 py-2.5 bg-white text-[#1a1a1a] font-medium rounded-md hover:bg-[#f9fafb] transition-colors border border-[#e5e7eb]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            New Reflection
          </Link>
        </div>
      </div>

      {recentUpdates.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-[#1a1a1a]">Recent Daily Updates</h2>
            <Link
              href="/updates/daily"
              className="text-[#2563eb] hover:text-[#1d4ed8] font-medium text-sm hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentUpdates.map((update) => (
              <Link
                key={update.url}
                href={update.url}
                className="block border-b border-[#e5e7eb] pb-6 hover:border-[#d1d5db] transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-[#1a1a1a] mb-2 group-hover:text-[#2563eb] transition-colors leading-tight">
                      {update.title.replace(/^#+\s+/, '').trim()}
                    </h3>
                    {update.summary && (
                      <p className="text-[#6b7280] text-base mb-3 line-clamp-2 leading-relaxed">
                        {update.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-[#9ca3af]">
                      {update.date && (
                        <time dateTime={update.date}>
                          {formatDate(update.date)}
                        </time>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-[#9ca3af] group-hover:text-[#2563eb] flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No daily updates yet.</p>
          <Link
            href="/updates/daily/new"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create your first update
          </Link>
        </div>
      )}
    </div>
  );
}

