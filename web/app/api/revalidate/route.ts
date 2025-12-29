import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// API route for on-demand revalidation
// Call this endpoint when content is added/updated
export async function POST(request: NextRequest) {
  try {
    const { path, secret } = await request.json();

    // Optional: Add a secret for security
    if (secret && secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (path) {
      // Revalidate specific path
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    } else {
      // Revalidate all content pages
      revalidatePath('/');
      revalidatePath('/updates');
      revalidatePath('/reflections');
      return NextResponse.json({ revalidated: true, now: Date.now() });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    );
  }
}

