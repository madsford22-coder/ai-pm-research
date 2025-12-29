'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReflectionEditorProps {
  date?: string;
  initialContent?: string;
}

export default function ReflectionEditor({ date, initialContent = '' }: ReflectionEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    // Generate filename from date or title
    const reflectionDate = date || new Date().toISOString().split('T')[0];
    const filename = `reflections/daily/${reflectionDate}.md`;
    
    // Build frontmatter
    const frontmatter = `---
title: ${title || `Daily Reflection - ${reflectionDate}`}
date: ${reflectionDate}
tags:
${tags.split(',').map(tag => `  - ${tag.trim()}`).filter(t => t.trim()).join('\n')}
---

`;
    
    const fullContent = frontmatter + content;
    
    try {
      // In a real app, you'd save to the server
      // For now, we'll show instructions
      const blob = new Blob([fullContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reflectionDate}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Reflection saved! Please copy the file to /content/${filename}`);
      router.push(`/reflections/daily/${reflectionDate}`);
    } catch (error) {
      console.error('Failed to save reflection:', error);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">New Daily Reflection</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Daily Reflection - December 29, 2025"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date || new Date().toISOString().split('T')[0]}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="reflection, pm-insights, learning"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reflection Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Daily Reflection

## What I learned today

## Key insights

## Questions to explore"
            rows={20}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Reflection'}
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
          <p>This will download the markdown file. Please copy it to <code className="bg-blue-100 px-1 rounded">/content/reflections/daily/</code> to make it available in the app.</p>
        </div>
      </div>
    </div>
  );
}

