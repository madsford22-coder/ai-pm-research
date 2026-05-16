'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type AuthState = 'checking' | 'unauthenticated' | 'authenticated';
type VerifyStatus = 'idle' | 'loading' | 'not_found' | 'not_activated' | 'error';

interface Message {
  question: string;
  answer: string;
  loading: boolean;
}

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  a: ({ href, children }) => {
    if (href?.startsWith('/')) {
      return (
        <Link href={href} className="underline text-[#5a7a3a] dark:text-[#8db870] hover:no-underline">
          {children}
        </Link>
      );
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-[#5a7a3a] dark:text-[#8db870] hover:no-underline">{children}</a>;
  },
  strong: ({ children }) => <strong className="font-semibold text-[#1c1917] dark:text-[#f5f0ea]">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
};

export default function QueryWidget({ date }: { date?: string }) {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [email, setEmail] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setAuthState(data.authenticated ? 'authenticated' : 'unauthenticated'))
      .catch(() => setAuthState('unauthenticated'));
  }, []);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyStatus('loading');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setAuthState('authenticated');
        setVerifyStatus('idle');
      } else {
        const data = await res.json().catch(() => ({}));
        const status = data.error === 'not_found' ? 'not_found'
          : data.error === 'not_activated' ? 'not_activated'
          : 'error';
        setVerifyStatus(status);
      }
    } catch {
      setVerifyStatus('error');
    }
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isQuerying) return;

    const q = question.trim();
    setQuestion('');
    setIsQuerying(true);

    setMessages(prev => [...prev, { question: q, answer: '', loading: true }]);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, ...(date ? { date } : {}) }),
      });

      if (res.status === 401) {
        setAuthState('unauthenticated');
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (!res.ok || !res.body) throw new Error('Query failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, answer: m.answer + chunk } : m
          )
        );
      }

      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, loading: false } : m
        )
      );
    } catch {
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, answer: 'Something went wrong — please try again.', loading: false }
            : m
        )
      );
    } finally {
      setIsQuerying(false);
    }
  }

  // Don't render anything while checking auth to avoid layout shift
  if (authState === 'checking') return null;

  return (
    <div className="bg-white dark:bg-[#1e1c16] border border-[#e7e3dd] dark:border-[#2e2b24] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#e7e3dd] dark:border-[#2e2b24] flex items-center gap-2">
        <svg
          className="w-4 h-4 text-[#5a7a3a] dark:text-[#8db870] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <h2 className="text-sm font-semibold text-[#1c1917] dark:text-[#f5f0ea]">
          Ask the research
        </h2>
      </div>

      {authState === 'unauthenticated' ? (
        /* Sign-in form */
        <div className="px-5 py-5">
          <p className="text-sm text-[#44403c] dark:text-[#c8c4bc] mb-4">
            {date
              ? "Ask deeper questions about this update. Verify your free subscription to get access."
              : "Subscribers can query the full archive directly. Enter your email to verify your subscription."
            }
          </p>
          <form onSubmit={handleVerify} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={verifyStatus === 'loading'}
              className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg border border-[#e7e3dd] dark:border-[#2e2b24] bg-[#faf8f5] dark:bg-[#18160f] text-[#1c1917] dark:text-[#f5f0ea] placeholder-[#a8a29e] focus:outline-none focus:border-[#5a7a3a] dark:focus:border-[#8db870] disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={verifyStatus === 'loading'}
              className="px-4 py-2 text-sm font-medium bg-[#5a7a3a] hover:bg-[#4a6830] disabled:opacity-50 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {verifyStatus === 'loading' ? 'Checking…' : 'Verify'}
            </button>
          </form>
          {verifyStatus === 'not_found' && (
            <p className="mt-3 text-sm text-[#78716c] dark:text-[#a8a29e]">
              That email isn&apos;t subscribed yet.{' '}
              <a
                href="#subscribe"
                className="underline text-[#5a7a3a] dark:text-[#8db870] hover:no-underline"
                onClick={e => {
                  e.preventDefault();
                  document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Subscribe for free
              </a>{' '}
              using the form below, then check your inbox for a confirmation email and click the
              link to activate your subscription before trying again.
            </p>
          )}
          {verifyStatus === 'not_activated' && (
            <p className="mt-3 text-sm text-[#78716c] dark:text-[#a8a29e]">
              Your subscription isn&apos;t confirmed yet. Check your inbox for a confirmation
              email from Buttondown and click the link to activate, then try again.
            </p>
          )}
          {verifyStatus === 'error' && (
            <p className="mt-3 text-sm text-red-500">
              Something went wrong — try again.
            </p>
          )}
        </div>
      ) : (
        /* Query interface */
        <div>
          {/* Message history */}
          {messages.length > 0 && (
            <div
              ref={messagesContainerRef}
              className="px-5 py-4 space-y-5 h-72 overflow-y-auto"
            >
              {messages.map((msg, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-xs font-semibold text-[#78716c] dark:text-[#a8a29e] uppercase tracking-wider">
                    You asked
                  </p>
                  <p className="text-sm text-[#1c1917] dark:text-[#f5f0ea]">{msg.question}</p>
                  <div className="pl-3 border-l-2 border-[#c8d8b8] dark:border-[#4a6830] mt-1">
                    {msg.loading && !msg.answer ? (
                      <p className="text-sm text-[#a8a29e] dark:text-[#78716c] italic">
                        Searching the archive…
                      </p>
                    ) : (
                      <div className="text-sm text-[#44403c] dark:text-[#c8c4bc] leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {msg.answer}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input form */}
          <form
            onSubmit={handleQuery}
            className={`px-5 py-4 flex gap-2${messages.length > 0 ? ' border-t border-[#e7e3dd] dark:border-[#2e2b24]' : ''}`}
          >
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={date ? "Ask a deeper question about this update…" : "Ask about any topic in the research…"}
              disabled={isQuerying}
              maxLength={500}
              className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg border border-[#e7e3dd] dark:border-[#2e2b24] bg-[#faf8f5] dark:bg-[#18160f] text-[#1c1917] dark:text-[#f5f0ea] placeholder-[#a8a29e] focus:outline-none focus:border-[#5a7a3a] dark:focus:border-[#8db870] disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={isQuerying || !question.trim()}
              className="px-4 py-2 text-sm font-medium bg-[#5a7a3a] hover:bg-[#4a6830] disabled:opacity-50 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {isQuerying ? '…' : 'Ask'}
            </button>
          </form>

          {/* Hint text on first load */}
          {messages.length === 0 && (
            <p className="px-5 pb-4 text-xs text-[#a8a29e] dark:text-[#78716c]">
              {date
                ? <>Try: &ldquo;How does this compare to last week?&rdquo; or &ldquo;What&apos;s the most actionable insight here?&rdquo;</>
                : <>Try: &ldquo;What did Anthropic ship this week?&rdquo; or &ldquo;Any signals on AI agents lately?&rdquo;</>
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
}
