import { NextRequest, NextResponse } from 'next/server';
import { classifyUserAgent } from '@/lib/bots';
import { hashVisitor, readDay, readRecentDays, todayUTC, writeDay } from '@/lib/visits';

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const path = typeof body.path === 'string' ? body.path.slice(0, 200) : '/';
  if (path.startsWith('/api') || path === '/traffic' || path.startsWith('/_next')) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const ua = request.headers.get('user-agent');
  const { kind, name } = classifyUserAgent(ua);
  const day = todayUTC();
  const stats = await readDay(day);
  const visitor = hashVisitor(clientIp(request), ua || '', day);

  stats.beacons += 1;
  if (!stats.visitors.includes(visitor) && stats.visitors.length < 2000) {
    stats.visitors.push(visitor);
    stats.unique = stats.visitors.length;
  }
  stats.paths[path] = (stats.paths[path] || 0) + 1;
  stats.named[name] = (stats.named[name] || 0) + 1;
  if (kind === 'bot') stats.bots += 1;
  if (kind === 'preview') stats.previews += 1;
  if (kind === 'script') stats.scripts += 1;

  try {
    await writeDay(day, stats);
  } catch (err) {
    console.error('visit write failed', err);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const days = await readRecentDays(30);
  return NextResponse.json({
    note: 'JS beacon counts. Compare beacons/unique with Netlify Analytics pageviews/visitors. The gap is mostly crawlers.',
    days: days.map(({ day, stats }) => ({
      day,
      beacons: stats.beacons,
      unique: stats.unique,
      bots: stats.bots,
      previews: stats.previews,
      scripts: stats.scripts,
      named: stats.named,
      paths: stats.paths,
    })),
  });
}
