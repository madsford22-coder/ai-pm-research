import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const res = await fetch('https://api.buttondown.email/v1/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (res.status === 201) {
    return NextResponse.json({ success: true });
  }

  const data = await res.json().catch(() => ({}));
  const isAlreadySubscribed =
    res.status === 400 &&
    JSON.stringify(data).toLowerCase().includes('already');

  if (isAlreadySubscribed) {
    return NextResponse.json({ error: 'already_subscribed' }, { status: 400 });
  }

  return NextResponse.json({ error: 'failed' }, { status: 500 });
}
