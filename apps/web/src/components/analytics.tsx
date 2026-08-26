'use client';

/**
 * PostHog analitika — GATED. NEXT_PUBLIC_POSTHOG_KEY bo'sh bo'lsa umuman
 * yuklanmaydi (no-op, bundle chunk ham olinmaydi). Kalit bo'lsa init + pageview.
 * Kalitni Railway web xizmatiga qo'shib redeploy qiling → faollashadi.
 */
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

export function Analytics() {
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ph = useRef<any>(null);
  const ready = useRef(false);

  useEffect(() => {
    if (!KEY) return;
    let cancelled = false;
    import('posthog-js').then((mod) => {
      if (cancelled) return;
      ph.current = mod.default;
      if (!ready.current) {
        ph.current.init(KEY, {
          api_host: HOST,
          capture_pageview: false, // App Router'da qo'lda (pastda)
          capture_pageleave: true,
          person_profiles: 'identified_only',
        });
        ready.current = true;
        ph.current.capture('$pageview');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!KEY || !ready.current || !ph.current) return;
    ph.current.capture('$pageview');
  }, [pathname]);

  return null;
}
