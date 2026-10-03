import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Share feedback',
  description: "What's useful, what's missing, what you'd like more of — send a note about Madison's Morning Memo.",
  alternates: { canonical: '/feedback' },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
