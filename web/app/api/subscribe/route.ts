import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const body = new URLSearchParams({ email });
  const res = await fetch('https://buttondown.com/api/emails/embed-subscribe/madsford22', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    redirect: 'manual',
  });

  // Buttondown redirects on success (302/303) — treat any redirect or 2xx as success
  if (res.ok || res.status === 302 || res.status === 303 || res.status === 201) {
    return NextResponse.json({ success: true });
  }

  const text = await res.text().catch(() => '');
  if (text.toLowerCase().includes('already')) {
    return NextResponse.json({ error: 'already_subscribed' }, { status: 400 });
  }

  return NextResponse.json({ error: 'failed' }, { status: 500 });
}
