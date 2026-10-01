import { createHash } from 'crypto';

export type DayStats = {
  beacons: number;
  unique: number;
  bots: number;
  previews: number;
  scripts: number;
  visitors: string[];
  paths: Record<string, number>;
  named: Record<string, number>;
};

const EMPTY: DayStats = {
  beacons: 0,
  unique: 0,
  bots: 0,
  previews: 0,
  scripts: 0,
  visitors: [],
  paths: {},
  named: {},
};

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getVisitStore() {
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore({ name: 'visits', consistency: 'strong' });
  } catch {
    return null;
  }
}

export function hashVisitor(ip: string, ua: string, day: string): string {
  const salt = process.env.VISIT_SALT || 'madison-memo-visits';
  return createHash('sha256').update(`${salt}|${day}|${ip}|${ua}`).digest('hex').slice(0, 12);
}

export function emptyDay(): DayStats {
  return {
    ...EMPTY,
    visitors: [],
    paths: {},
    named: {},
  };
}

export async function readDay(day: string): Promise<DayStats> {
  const store = await getVisitStore();
  if (!store) return emptyDay();
  try {
    const data = await store.get(day, { type: 'json' });
    if (!data || typeof data !== 'object') return emptyDay();
    return { ...emptyDay(), ...(data as Partial<DayStats>) };
  } catch {
    return emptyDay();
  }
}

export async function writeDay(day: string, stats: DayStats): Promise<void> {
  const store = await getVisitStore();
  if (!store) return;
  try {
    await store.setJSON(day, { ...stats, visitors: stats.visitors.slice(-2000) });
  } catch {
    // Local dev and missing Blobs config should not break page loads
  }
}

export async function readRecentDays(n = 30): Promise<{ day: string; stats: DayStats }[]> {
  const store = await getVisitStore();
  if (!store) return [];

  const out: { day: string; stats: DayStats }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    try {
      const data = await store.get(key, { type: 'json' });
      if (data && typeof data === 'object') {
        out.push({ day: key, stats: { ...emptyDay(), ...(data as Partial<DayStats>) } });
      }
    } catch {
      // skip unreadable days
    }
  }
  return out;
}
