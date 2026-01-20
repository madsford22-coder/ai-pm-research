'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDailyUpdatePage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    const filename = `updates/daily/${date}.md`;
    const title = `Daily PM Research Update - ${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    
    const frontmatter = `---
title: ${title}
date: ${date}
tags:
  - daily-update
  - research
  - pm-insights
summary: 
---

`;
    
    const fullContent = frontmatter + content;
    
    try {
      const blob = new Blob([fullContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${date}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Daily update saved! Please copy the file to /content/${filename}`);
      router.push(`/updates/daily/${date}`);
    } catch (error) {
      console.error('Failed to save update:', error);
      alert('Failed to save update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">New Daily Update</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Content (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Daily PM Research Update: YYYY-MM-DD

## Summary

Brief summary of today's signals...

## Items

### [Item Title]
**Source:** [URL]

**tl;dr:** [Brief summary]

..."
            rows={30}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Update'}
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">Note:</p>
            <p>This will download the markdown file. Please copy it to <code className="bg-blue-100 px-1 rounded">/content/updates/daily/</code> to make it available in the app.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

