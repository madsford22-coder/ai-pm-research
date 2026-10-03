import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Archive',
  description:
    "Every Madison's Morning Memo — the daily AI product briefing for product managers and builders, by Madison Ford.",
  alternates: { canonical: '/archive' },
};

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
