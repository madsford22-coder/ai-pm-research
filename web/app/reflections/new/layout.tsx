import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New reflection',
  robots: { index: false, follow: false },
};

export default function NewReflectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
