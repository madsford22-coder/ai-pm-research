'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ContentMetadata } from '@/lib/content/types';

interface TreeNode {
  name: string;
  path: string;
  url: string;
  title: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
}

function buildTree(metadata: ContentMetadata[]): TreeNode {
  const root: TreeNode = {
    name: '',
    path: '',
    url: '/',
    title: 'Home',
    children: new Map(),
    isFile: false,
  };

  // Separate monthly summaries and daily updates
  const monthlySummaries = metadata.filter(item => 
    item.path.startsWith('updates/monthly/') || item.tags?.includes('monthly-summary')
  );
  const dailyUpdates = metadata.filter(item => 
    item.path.startsWith('updates/daily/') && !item.tags?.includes('monthly-summary')
  );
  const otherContent = metadata.filter(item => 
    !item.path.startsWith('updates/')
  );

  // Process monthly summaries first
  const monthMap = new Map<string, ContentMetadata>();
  for (const monthly of monthlySummaries) {
    // Extract YYYY-MM from path or date
    let monthKey = '';
    
    // First try to use the date field
    if (monthly.date) {
      try {
        const date = new Date(monthly.date);
        if (!isNaN(date.getTime())) {
          monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      } catch (e) {
        // Date parsing failed, continue to path extraction
      }
    }
    
    // If date parsing didn't work, extract from path
    if (!monthKey) {
      // Try to extract from path: updates/monthly/2026-01.md
      const match = monthly.path.match(/updates\/monthly\/(\d{4}-\d{2})\.md$/);
      if (match) {
        monthKey = match[1];
      }
    }
    
    if (monthKey) {
      monthMap.set(monthKey, monthly);
    }
  }

  // Group daily updates by month
  const dailyByMonth = new Map<string, ContentMetadata[]>();
  for (const daily of dailyUpdates) {
    let monthKey = '';
    
    // First try to use the date field
    if (daily.date) {
      try {
        const date = new Date(daily.date);
        if (!isNaN(date.getTime())) {
          monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      } catch (e) {
        // Date parsing failed, continue to path extraction
      }
    }
    
    // If date parsing didn't work, extract from path
    if (!monthKey) {
      // Try to extract from path: updates/daily/2026/2026-01-19.md
      const match = daily.path.match(/updates\/daily\/(\d{4})\/(\d{4})-(\d{2})-(\d{2})\.md$/);
      if (match) {
        monthKey = `${match[1]}-${match[3]}`;
      }
    }
    
    if (monthKey) {
      if (!dailyByMonth.has(monthKey)) {
        dailyByMonth.set(monthKey, []);
      }
      dailyByMonth.get(monthKey)!.push(daily);
    }
  }

  // Build tree with months as parent nodes
  // Add months in reverse chronological order
  const sortedMonths = Array.from(new Set([...monthMap.keys(), ...dailyByMonth.keys()]))
    .sort()
    .reverse();

  for (const monthKey of sortedMonths) {
    const monthDate = new Date(monthKey + '-01');
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Create month node
    const monthNode: TreeNode = {
      name: monthName,
      path: `updates/monthly/${monthKey}`,
      url: monthMap.get(monthKey)?.url || `/updates/monthly/${monthKey}`,
      title: monthMap.get(monthKey)?.title || `${monthName} Summary`,
      children: new Map(),
      isFile: false,
    };

    // Add monthly summary as first child (if exists)
    const monthlySummary = monthMap.get(monthKey);
    if (monthlySummary) {
      monthNode.children.set('_summary', {
        name: 'Summary',
        path: monthlySummary.path.replace(/\.md$/, ''),
        url: monthlySummary.url,
        title: monthlySummary.title,
        children: new Map(),
        isFile: true,
      });
    }

    // Add daily updates as children
    const dailies = dailyByMonth.get(monthKey) || [];
    dailies.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Newest first
    });

    for (const daily of dailies) {
      // Use a unique key based on the date or slug
      const dayKey = daily.date || daily.slug || daily.path;
      
      monthNode.children.set(dayKey, {
        name: daily.title.replace(/^#+\s+/, '').trim(),
        path: daily.path.replace(/\.md$/, ''),
        url: daily.url,
        title: daily.title,
        children: new Map(),
        isFile: true,
      });
    }

    root.children.set(monthKey, monthNode);
  }

  // Add other content (non-update content)
  for (const item of otherContent) {
    const parts = item.slug.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current.children.has(part)) {
        const path = parts.slice(0, i + 1).join('/');
        current.children.set(part, {
          name: part,
          path,
          url: item.url,
          title: item.title,
          children: new Map(),
          isFile: isLast,
        });
      }

      current = current.children.get(part)!;
    }
  }

  return root;
}

function renderTree(node: TreeNode, pathname: string, level: number = 0): React.ReactNode {
  if (node.name === '' && level === 0) {
    // Root level - render children
    return (
      <ul className="space-y-1">
        {Array.from(node.children.values())
          .sort((a, b) => {
            if (a.isFile && !b.isFile) return 1;
            if (!a.isFile && b.isFile) return -1;
            // Sort dates/months in reverse (newest first)
            return b.name.localeCompare(a.name);
          })
          .map((child) => renderTree(child, pathname, level + 1))}
      </ul>
    );
  }

  const isActive = pathname === node.url || pathname.startsWith(node.url + '/');
  const hasChildren = node.children.size > 0;
  const isMonthNode = node.path.startsWith('updates/monthly/') && !node.isFile;

  return (
    <li key={node.path}>
      {node.isFile ? (
        <Link
          href={node.url}
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            isActive
              ? 'bg-[#f3f4f6] text-[#1a1a1a] font-medium'
              : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#1a1a1a]'
          }`}
        >
          {node.title.replace(/^#+\s+/, '').trim()}
        </Link>
      ) : (
        <>
          {isMonthNode ? (
            <>
              <Link
                href={node.url}
                className={`block px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#e5e7eb] text-[#1a1a1a]'
                    : 'text-[#374151] hover:bg-[#f3f4f6] hover:text-[#1a1a1a]'
                }`}
              >
                {node.name}
              </Link>
              {hasChildren && (
                <ul className="ml-2 mt-1 space-y-0.5 border-l-2 border-[#e5e7eb] pl-3">
                  {Array.from(node.children.values())
                    .sort((a, b) => {
                      // Summary first, then daily updates
                      if (a.name === '_summary') return -1;
                      if (b.name === '_summary') return 1;
                      // Sort dates in reverse (newest first)
                      if (a.isFile && b.isFile) {
                        return b.name.localeCompare(a.name, undefined, { numeric: true });
                      }
                      return 0;
                    })
                    .map((child) => renderTree(child, pathname, level + 1))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                {node.name}
              </div>
              {hasChildren && (
                <ul className="ml-4 space-y-1">
                  {Array.from(node.children.values())
                    .sort((a, b) => {
                      if (a.isFile && !b.isFile) return 1;
                      if (!a.isFile && b.isFile) return -1;
                      // Sort dates in reverse (newest first)
                      return b.name.localeCompare(a.name);
                    })
                    .map((child) => renderTree(child, pathname, level + 1))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </li>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load metadata on client side
    fetch('/api/content/metadata')
      .then((res) => res.json())
      .then((data: ContentMetadata[]) => {
        const builtTree = buildTree(data);
        setTree(builtTree);
      })
      .catch((err) => {
        console.error('Failed to load content metadata:', err);
      });
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 bg-white border border-[#e5e7eb] rounded-md shadow-sm"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-[#e5e7eb] z-10 transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6">
          <Link href="/" className="block mb-8">
            <h1 className="text-lg font-semibold text-[#1a1a1a]">AI PM Research Hub</h1>
          </Link>
          <nav className="overflow-y-auto max-h-[calc(100vh-8rem)]">
            {tree ? (
              renderTree(tree, pathname)
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

