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
  });

  const text = await res.text().catch(() => '');
  const isAlreadySubscribed = text.toLowerCase().includes('already');

  if (res.ok || res.status === 201) {
    return NextResponse.json({ success: true });
  }

  if (isAlreadySubscribed) {
    return NextResponse.json({ error: 'already_subscribed' }, { status: 400 });
  }

  return NextResponse.json({ error: 'failed' }, { status: 500 });
}
