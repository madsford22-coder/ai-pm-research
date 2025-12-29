import { NextResponse } from 'next/server';
import { buildSearchIndex } from '@/lib/content/loader';

export async function GET() {
  try {
    const index = buildSearchIndex();
    return NextResponse.json(index);
  } catch (error) {
    console.error('Error building search index:', error);
    return NextResponse.json(
      { error: 'Failed to build search index' },
      { status: 500 }
    );
  }
}

