import { NextRequest, NextResponse } from 'next/server';

function clientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
  return ip || undefined;
}

function alreadySubscribed(status: number, payload: unknown): boolean {
  if (status !== 400) return false;
  const code = typeof payload === 'object' && payload && 'code' in payload
    ? String((payload as { code?: unknown }).code)
    : '';
  if (code === 'subscriber_already_exists' || code === 'email_already_exists') {
    return true;
  }
  const text = JSON.stringify(payload).toLowerCase();
  return text.includes('already') || text.includes('exists');
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  const { email } = await request.json().catch(() => ({}));
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalized || !normalized.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const body: { email_address: string; ip_address?: string } = {
    email_address: normalized,
  };
  const ip = clientIp(request);
  if (ip) body.ip_address = ip;

  const res = await fetch('https://api.buttondown.com/v1/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));

  if (res.status === 201 || res.ok) {
    return NextResponse.json({ success: true });
  }

  if (alreadySubscribed(res.status, payload)) {
    return NextResponse.json({ error: 'already_subscribed' }, { status: 400 });
  }

  return NextResponse.json({ error: 'failed' }, { status: 500 });
}
