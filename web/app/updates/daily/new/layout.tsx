import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New daily update',
  robots: { index: false, follow: false },
};

export default function NewDailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
