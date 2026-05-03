'use client';

import { useState } from 'react';

export default function FeedbackPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('https://formspree.io/f/meenaqew', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-[#292524] dark:text-[#e7e3dd] mb-2">Share feedback</h1>
      <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-8">
        What&apos;s useful, what&apos;s missing, what you&apos;d like more of — all of it helps.
      </p>

      {status === 'success' ? (
        <div className="bg-[#f0f7eb] dark:bg-[#1e2b18] border border-[#c3ddb0] dark:border-[#3a5a2a] rounded-lg p-6">
          <p className="text-sm font-medium text-[#5a7a3a] dark:text-[#8db870]">Thanks — got it!</p>
          <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mt-1">Your feedback has been sent.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#78716c] dark:text-[#a8a29e] mb-1.5">
              Name <span className="text-[#a8a29e]">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full text-sm px-3 py-2 rounded-lg border border-[#e7e3dd] dark:border-[#2e2b24] bg-white dark:bg-[#1e1c15] text-[#292524] dark:text-[#e7e3dd] placeholder-[#a8a29e] focus:outline-none focus:border-[#5a7a3a] dark:focus:border-[#8db870] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78716c] dark:text-[#a8a29e] mb-1.5">
              Email <span className="text-[#a8a29e]">(optional, if you want a reply)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-sm px-3 py-2 rounded-lg border border-[#e7e3dd] dark:border-[#2e2b24] bg-white dark:bg-[#1e1c15] text-[#292524] dark:text-[#e7e3dd] placeholder-[#a8a29e] focus:outline-none focus:border-[#5a7a3a] dark:focus:border-[#8db870] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78716c] dark:text-[#a8a29e] mb-1.5">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="What's on your mind?"
              className="w-full text-sm px-3 py-2 rounded-lg border border-[#e7e3dd] dark:border-[#2e2b24] bg-white dark:bg-[#1e1c15] text-[#292524] dark:text-[#e7e3dd] placeholder-[#a8a29e] focus:outline-none focus:border-[#5a7a3a] dark:focus:border-[#8db870] transition-colors resize-none"
            />
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-500">Something went wrong — try again.</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-[#5a7a3a] dark:bg-[#8db870] text-white dark:text-[#18160f] text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {status === 'loading' ? 'Sending…' : 'Send feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
