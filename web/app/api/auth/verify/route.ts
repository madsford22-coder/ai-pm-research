import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const COOKIE_NAME = 'aipm_session';

export async function POST(request: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET;
  const bdApiKey = process.env.BUTTONDOWN_API_KEY;

  if (!jwtSecret || !bdApiKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  // Check Buttondown subscriber status
  let bdData: { results?: { email_address: string; type: string }[] };
  try {
    const bdRes = await fetch(
      `https://api.buttondown.email/v1/subscribers?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Token ${bdApiKey}` } }
    );
    if (!bdRes.ok) {
      return NextResponse.json({ error: 'verification_failed' }, { status: 502 });
    }
    bdData = await bdRes.json();
  } catch {
    return NextResponse.json({ error: 'verification_failed' }, { status: 502 });
  }

  // Buttondown returns all subscribers when the email filter doesn't match — find by email_address
  const subscriber = bdData.results?.find(
    s => s.email_address.toLowerCase() === email
  );
  if (!subscriber) {
    return NextResponse.json({ error: 'not_found' }, { status: 403 });
  }
  if (subscriber.type !== 'regular') {
    return NextResponse.json({ error: 'not_activated' }, { status: 403 });
  }

  // Issue JWT valid for 30 days
  const secret = new TextEncoder().encode(jwtSecret);
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(secret);

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return response;
}
