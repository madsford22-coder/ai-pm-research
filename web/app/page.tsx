import Dashboard from '@/components/Dashboard';

// Force dynamic rendering to always show latest content
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return <Dashboard />;
}

