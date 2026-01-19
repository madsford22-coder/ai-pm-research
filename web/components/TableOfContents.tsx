'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ html }: { html: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    // Parse headings from HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headingElements = doc.querySelectorAll('h2, h3');
    
    const extracted: Heading[] = [];
    headingElements.forEach((el) => {
      const id = el.id || el.textContent?.toLowerCase().replace(/\s+/g, '-') || '';
      if (id) {
        // Remove anchor link symbols (#) and extra whitespace from text
        let text = el.textContent || '';
        text = text.replace(/#+/g, '').trim();
        text = text.replace(/\s+/g, ' ');
        
        extracted.push({
          id,
          text,
          level: parseInt(el.tagName.charAt(1)),
        });
      }
    });

    setHeadings(extracted);
  }, [html]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block w-64 flex-shrink-0">
      <div className="sticky top-28">
        <div className="bg-white rounded-lg p-6 border border-[#e5e7eb] shadow-sm">
          <h2 className="text-xs font-semibold text-[#9ca3af] mb-4 uppercase tracking-wider">
            Contents
          </h2>
          <nav>
            <ul className="space-y-1.5">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    className={`block text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors duration-150 ${
                      heading.level === 3 ? 'ml-4 text-[13px]' : ''
                    }`}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
}

