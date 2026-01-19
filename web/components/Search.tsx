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
    const scored = index.map((item) => {
      let score = 0;
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const summaryMatch = item.summary?.toLowerCase().includes(lowerQuery);
      const bodyMatch = item.body.toLowerCase().includes(lowerQuery);
      const tagMatch = item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));

      if (titleMatch) score += 10;
      if (summaryMatch) score += 5;
      if (tagMatch) score += 3;
      if (bodyMatch) score += 1;

      return { item, score };
    });

    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
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
    <div className="relative max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search updates..."
          className="w-full px-4 py-2.5 pl-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400 shadow-sm hover:border-gray-400 transition-all"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e5e7eb] rounded-md shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map((item, index) => (
                <li key={item.url}>
                  <button
                    onClick={() => handleSelect(item.url)}
                    className="w-full text-left px-4 py-3 hover:bg-[#f9fafb] transition-colors focus:bg-[#f9fafb] focus:outline-none"
                    onMouseEnter={(e) => e.currentTarget.focus()}
                    tabIndex={0}
                  >
                    <div className="font-medium text-[#1a1a1a] flex items-center gap-2">
                      {item.title.replace(/^#+\s+/, '').trim()}
                      {item.date && (
                        <span className="text-xs text-[#9ca3af] font-normal">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {item.summary && (
                      <div className="text-sm text-[#6b7280] mt-1 line-clamp-2">
                        {item.summary}
                      </div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-[#f3f4f6] text-[#4b5563] text-xs rounded-full border border-[#e5e7eb]"
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
              <div className="text-gray-500 mb-2">No results found</div>
              <div className="text-sm text-gray-400">Try a different search term</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

