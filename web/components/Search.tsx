'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchIndexItem } from '@/lib/content/types';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState<SearchIndexItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load search index
    fetch('/api/search/index')
      .then((res) => res.json())
      .then((data: SearchIndexItem[]) => {
        setIndex(data);
      })
      .catch((err) => {
        console.error('Failed to load search index:', err);
      });
  }, []);

  const filteredResults = useMemo(() => {
    if (!query.trim() || index.length === 0) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);

    const scored = index.map((item) => {
      let score = 0;
      const lowerTitle = item.title.toLowerCase();
      const lowerSummary = item.summary?.toLowerCase() || '';
      const lowerBody = item.body.toLowerCase();
      const lowerTags = item.tags?.map(t => t.toLowerCase()) || [];

      // Exact phrase match gets highest score
      if (lowerTitle.includes(lowerQuery)) score += 20;
      if (lowerSummary.includes(lowerQuery)) score += 10;
      if (lowerBody.includes(lowerQuery)) score += 5;

      // Individual word matches
      queryWords.forEach(word => {
        if (lowerTitle.includes(word)) score += 8;
        if (lowerSummary.includes(word)) score += 4;
        if (lowerTags.some(tag => tag.includes(word))) score += 3;
        if (lowerBody.includes(word)) score += 1;
      });

      return { item, score };
    });

    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        // Sort by score first, then by date (newest first)
        if (b.score !== a.score) return b.score - a.score;
        if (a.item.date && b.item.date) {
          return new Date(b.item.date).getTime() - new Date(a.item.date).getTime();
        }
        return 0;
      })
      .slice(0, 10)
      .map(({ item }) => item);
  }, [query, index]);

  useEffect(() => {
    setResults(filteredResults);
    setIsOpen(query.trim().length > 0 && filteredResults.length > 0);
  }, [filteredResults, query]);

  const handleSelect = (url: string) => {
    setQuery('');
    setIsOpen(false);
    router.push(url);
  };

  return (
    <div className="relative max-w-2xl w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search updates..."
          className="w-full px-4 py-2.5 pl-11 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm hover:border-gray-400 dark:hover:border-slate-500 transition-all"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map((item, index) => (
                <li key={item.url}>
                  <button
                    onClick={() => handleSelect(item.url)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:bg-gray-50 dark:focus:bg-slate-700 focus:outline-none"
                    onMouseEnter={(e) => e.currentTarget.focus()}
                    tabIndex={0}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {item.title.replace(/^#+\s+/, '').trim()}
                      {item.date && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                          {(() => {
                            const date = item.date instanceof Date
                              ? item.date
                              : (item.date.includes('T') ? new Date(item.date) : new Date(item.date + 'T00:00:00'));
                            return date.toLocaleDateString();
                          })()}
                        </span>
                      )}
                    </div>
                    {item.summary && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {item.summary}
                      </div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-200 dark:border-slate-600"
                          >
                            {tag.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length > 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-2">No results found</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Try a different search term</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

