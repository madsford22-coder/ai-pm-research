import { NextResponse } from 'next/server';
import { getAllContentMetadata } from '@/lib/content/loader';

// Force dynamic rendering to always get latest content
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const metadata = getAllContentMetadata();
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error loading content metadata:', error);
    return NextResponse.json(
      { error: 'Failed to load content metadata' },
      { status: 500 }
    );
  }
}

