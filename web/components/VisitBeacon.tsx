'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/api') || pathname === '/traffic') return;

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || '',
    });

    try {
      fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [pathname]);

  return null;
}
