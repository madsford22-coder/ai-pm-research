import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Traffic',
  robots: { index: false, follow: false },
};

export default function TrafficLayout({ children }: { children: React.ReactNode }) {
  return children;
}
