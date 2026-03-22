'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  // Prioritize path extraction as it's most reliable (filename contains YYYY-MM)
  const monthMap = new Map<string, ContentMetadata>();
  for (const monthly of monthlySummaries) {
    // Extract YYYY-MM from path (most reliable source)
    let monthKey = '';
    
    // Extract from path first: updates/monthly/2026-01.md
    const pathMatch = monthly.path.match(/updates\/monthly\/(\d{4}-\d{2})\.md$/);
    if (pathMatch) {
      monthKey = pathMatch[1];
    }
    
    // Fallback to date parsing if path extraction failed
    if (!monthKey && monthly.date) {
      try {
        // Handle both string and Date types
        if (monthly.date instanceof Date) {
          // It's already a Date object
          const year = monthly.date.getUTCFullYear();
          const month = String(monthly.date.getUTCMonth() + 1).padStart(2, '0');
          monthKey = `${year}-${month}`;
        } else {
          // It's a string - try regex match first
          const dateMatch = monthly.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (dateMatch) {
            monthKey = `${dateMatch[1]}-${dateMatch[2]}`;
          } else {
            // Try Date object parsing as last resort
            const date = new Date(monthly.date);
            if (!isNaN(date.getTime())) {
              // Use UTC to avoid timezone issues
              const year = date.getUTCFullYear();
              const month = String(date.getUTCMonth() + 1).padStart(2, '0');
              monthKey = `${year}-${month}`;
            }
          }
        }
      } catch (e) {
        // Date parsing failed
      }
    }
    
    // Validate monthKey format (YYYY-MM)
    if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
      monthMap.set(monthKey, monthly);
      // Debug log (enable for troubleshooting)
      // console.log(`Monthly summary: ${monthly.title} -> monthKey: ${monthKey}, path: ${monthly.path}, date: ${monthly.date}`);
    } else if (monthKey) {
      // Invalid monthKey format - log for debugging
      console.warn(`Invalid monthKey format: ${monthKey} for ${monthly.title}, path: ${monthly.path}`);
    }
  }

  // Group daily updates by month
  const dailyByMonth = new Map<string, ContentMetadata[]>();
  for (const daily of dailyUpdates) {
    let monthKey = '';
    
    // First try to use the date field
    if (daily.date) {
      try {
        // Handle both Date objects and strings
        const date = daily.date instanceof Date ? daily.date : new Date(daily.date);
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
    // Parse monthKey (YYYY-MM format) directly to avoid Date parsing issues
    const [year, month] = monthKey.split('-');
    const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
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

    // Only add monthly summary - no individual daily updates in sidebar
    const monthlySummary = monthMap.get(monthKey);
    if (monthlySummary) {
      // Make the month node itself the link to the summary (no nested summary node)
      monthNode.url = monthlySummary.url;
      monthNode.title = monthlySummary.title;
      // Debug log
      // console.log(`Added summary to ${monthKey}: ${monthlySummary.title}`);
    }
    
    // Don't add daily updates as children - they're only on the dashboard
    // Daily updates are available via the monthly summary page

    root.children.set(monthKey, monthNode);
  }

  // Add other content (non-update content)
  // But skip any that might conflict with month nodes
  for (const item of otherContent) {
    // Skip if this would conflict with a month node key
    const parts = item.slug.split('/');
    
    // Don't create directory structures for update-related paths
    if (item.path.startsWith('updates/')) {
      continue;
    }
    
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      // Skip if this key already exists as a month node
      if (i === 0 && root.children.has(part) && root.children.get(part)!.path.startsWith('updates/monthly/')) {
        continue;
      }

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
    // Sort month nodes chronologically (newest first) by parsing their path
    return (
      <ul className="space-y-1">
        {Array.from(node.children.entries())
          .sort(([keyA, a], [keyB, b]) => {
            if (a.isFile && !b.isFile) return 1;
            if (!a.isFile && b.isFile) return -1;
            // For month nodes, sort by monthKey (YYYY-MM format) in reverse chronological order
            if (a.path.startsWith('updates/monthly/') && b.path.startsWith('updates/monthly/')) {
              const matchA = keyA.match(/^(\d{4})-(\d{2})$/);
              const matchB = keyB.match(/^(\d{4})-(\d{2})$/);
              if (matchA && matchB) {
                // Compare as YYYY-MM strings (reverse order = newest first)
                return keyB.localeCompare(keyA);
              }
            }
            // Fallback to alphabetical for non-month nodes
            return b.name.localeCompare(a.name);
          })
          .map(([key, child]) => renderTree(child, pathname, level + 1))}
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
          className={`block px-3 py-2 rounded-md text-sm transition-all relative ${
            isActive
              ? 'bg-[#eef4e8] dark:bg-[#1e2d16] text-[#4a6830] dark:text-[#8db870] font-medium border-l-2 border-[#5a7a3a] dark:border-[#8db870] pl-2.5'
              : 'text-[#78716c] dark:text-[#a8a29e] hover:bg-[#f0ede8] dark:hover:bg-[#2e2b24] hover:text-[#1c1917] dark:hover:text-[#f5f0ea]'
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
                className={`block px-3 py-2 rounded-md text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#eef4e8] dark:bg-[#1e2d16] text-[#4a6830] dark:text-[#8db870]'
                    : 'text-[#44403c] dark:text-[#c8c4bc] hover:bg-[#f0ede8] dark:hover:bg-[#2e2b24] hover:text-[#1c1917] dark:hover:text-[#f5f0ea]'
                }`}
              >
                {node.name}
              </Link>
              {hasChildren && (
                <ul className="ml-2 mt-1 space-y-0.5 border-l-2 border-[#e7e3dd] dark:border-[#2e2b24] pl-3">
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
              <div className="px-3 py-2 text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] uppercase tracking-wider">
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

  // Close sidebar on mobile when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile menu button - improved touch target */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-3 bg-[#faf8f5] dark:bg-[#1e1c16] border border-[#e7e3dd] dark:border-[#2e2b24] rounded-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-[#44403c] dark:text-[#c8c4bc]"
        aria-label="Toggle menu"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <svg
          className="w-5 h-5"
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
        className={`fixed left-0 top-0 h-full w-64 bg-[#faf8f5] dark:bg-[#18160f] border-r border-[#e7e3dd] dark:border-[#2e2b24] z-10 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 shadow-xl lg:shadow-none`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-8">
            <Link href="/" className="block group">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#c8d8b8] dark:ring-[#4a6830] shrink-0">
                  <Image
                    src="/madison.jpeg"
                    alt="Madison"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <span className="text-sm font-semibold text-[#1c1917] dark:text-[#f5f0ea] group-hover:text-[#5a7a3a] dark:group-hover:text-[#8db870] transition-colors">
                  Madison&apos;s Morning Memo
                </span>
              </div>
              <p className="text-xs text-[#78716c] dark:text-[#a8a29e] pl-11">
                Daily AI PM signals
              </p>
            </Link>
            {/* Close button for mobile inside sidebar */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-[#f0ede8] dark:hover:bg-[#2e2b24] rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-[#78716c] dark:text-[#a8a29e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="overflow-y-auto max-h-[calc(100vh-14rem)]">
            {tree ? (
              renderTree(tree, pathname)
            ) : (
              <div className="space-y-2 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 animate-shimmer rounded"></div>
                ))}
              </div>
            )}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-[#e7e3dd] dark:border-[#2e2b24] bg-[#faf8f5] dark:bg-[#18160f]">
            <div className="flex items-center gap-3">
              <a
                href="mailto:madsford22@gmail.com"
                className="flex items-center gap-1.5 text-xs text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
                title="Email Madison"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Say hello
              </a>
              <span className="text-[#e7e3dd] dark:text-[#2e2b24]">·</span>
              <a
                href="https://www.linkedin.com/in/madison-ford-31897872/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

