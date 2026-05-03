'use client';

import { useState } from 'react';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const body = new FormData();
      body.append('email', email);
      const res = await fetch('https://buttondown.com/api/emails/embed-subscribe/madsford22', {
        method: 'POST',
        body,
      });
      if (res.ok || res.status === 201) {
        setStatus('success');
        setEmail('');
      } else {
        const text = await res.text().catch(() => '');
        setStatus(text.toLowerCase().includes('already') ? 'duplicate' : 'error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="text-xs text-[#5a7a3a] dark:text-[#8db870] font-medium">
        ✓ You&apos;re subscribed!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs text-[#78716c] dark:text-[#a8a29e] font-medium">Get daily updates by email</p>
      <div className="flex gap-1.5">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded border border-[#e7e3dd] dark:border-[#2e2b24] bg-white dark:bg-[#1e1c15] text-[#292524] dark:text-[#e7e3dd] placeholder-[#a8a29e] focus:outline-none focus:border-[#5a7a3a] dark:focus:border-[#8db870] transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="text-xs px-2.5 py-1.5 rounded bg-[#5a7a3a] dark:bg-[#8db870] text-white dark:text-[#18160f] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
        >
          {status === 'loading' ? '…' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-500">Something went wrong — try again.</p>
      )}
      {status === 'duplicate' && (
        <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">Already subscribed!</p>
      )}
    </form>
  );
}
