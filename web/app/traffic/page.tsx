'use client';

import { useEffect, useState } from 'react';

type DayRow = {
  day: string;
  beacons: number;
  unique: number;
  bots: number;
  previews: number;
  scripts: number;
  named: Record<string, number>;
  paths: Record<string, number>;
};

export default function TrafficPage() {
  const [days, setDays] = useState<DayRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/visit')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setDays(data.days || []))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-[#292524] dark:text-[#e7e3dd] mb-2">Human vs crawler</h1>
      <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-8">
        These are JavaScript beacons, so they only fire in a real browser. Compare unique/beacons
        here with Netlify Analytics visitors/pageviews. The gap is mostly bots, previews, and scripts.
        This page is not linked from the site.
      </p>

      {error && <p className="text-sm text-red-500">Could not load visit stats.</p>}
      {!days && !error && <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">Loading…</p>}
      {days && days.length === 0 && (
        <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">
          No beacon data yet. Counts start after deploy, and only on Netlify (Blobs is unavailable locally).
        </p>
      )}

      {days && days.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs text-[#78716c] dark:text-[#a8a29e] border-b border-[#e7e3dd] dark:border-[#2e2b24]">
                <th className="py-2 pr-4 font-medium">Day (UTC)</th>
                <th className="py-2 pr-4 font-medium">Beacons</th>
                <th className="py-2 pr-4 font-medium">Unique</th>
                <th className="py-2 pr-4 font-medium">Bot UA</th>
                <th className="py-2 pr-4 font-medium">Preview</th>
                <th className="py-2 font-medium">Script</th>
              </tr>
            </thead>
            <tbody>
              {days.map((row) => (
                <tr key={row.day} className="border-b border-[#e7e3dd] dark:border-[#2e2b24]">
                  <td className="py-2 pr-4 text-[#292524] dark:text-[#e7e3dd]">{row.day}</td>
                  <td className="py-2 pr-4">{row.beacons}</td>
                  <td className="py-2 pr-4">{row.unique}</td>
                  <td className="py-2 pr-4">{row.bots}</td>
                  <td className="py-2 pr-4">{row.previews}</td>
                  <td className="py-2">{row.scripts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
