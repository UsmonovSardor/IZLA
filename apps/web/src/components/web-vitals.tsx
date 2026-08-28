'use client';

/**
 * Web Vitals RUM — DEPSIZ (web-vitals kutubxonasi shart emas), nativ
 * PerformanceObserver. LCP / CLS / FCP / TTFB / INP(taxminiy) o'lchaydi va
 * PostHog'ga yuboradi (FAQAT NEXT_PUBLIC_POSTHOG_KEY bo'lsa — Analytics init
 * qilgan posthog-js singleton'ini qayta ishlatadi). Kalitsiz — no-op.
 *
 * Shu bois haqiqiy foydalanuvchi tezligi (real device/tarmoq) o'lchanadi;
 * Railway'ga kalit qo'yilgach dashboard'da LCP/CLS/INP taqsimoti ko'rinadi.
 */
import { useEffect } from 'react';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function WebVitals() {
  useEffect(() => {
    if (!KEY) return;

    let cls = 0;
    let inp = 0;
    const report = (name: string, value: number, extra?: Record<string, unknown>) => {
      import('posthog-js').then((m) => {
        m.default?.capture?.('web_vital', {
          metric: name,
          value: Math.round(value * 1000) / 1000,
          path: location.pathname,
          ...extra,
        });
      }).catch(() => {});
    };

    const obs: PerformanceObserver[] = [];
    const on = (type: string, cb: (e: PerformanceObserverEntryList) => void, opts?: PerformanceObserverInit) => {
      try {
        const po = new PerformanceObserver(cb);
        po.observe({ type, buffered: true, ...opts } as PerformanceObserverInit);
        obs.push(po);
      } catch { /* type qo'llab-quvvatlanmasa — o'tkazib yuboramiz */ }
    };

    // LCP — oxirgi qiymat (visibilitychange/hidden'da yakuniy)
    let lcp = 0;
    on('largest-contentful-paint', (list) => {
      const e = list.getEntries();
      lcp = e[e.length - 1].startTime;
    });

    // CLS — jamlanadi (faqat oyna fokusda bo'lmagan siljishlar hisobga olinmaydi)
    on('layout-shift', (list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
    });

    // FCP
    on('paint', (list) => {
      for (const e of list.getEntries()) {
        if (e.name === 'first-contentful-paint') report('FCP', e.startTime);
      }
    });

    // INP taxminiy — eng katta event kechikishi
    on('event', (list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { duration: number })[]) {
        if (e.duration > inp) inp = e.duration;
      }
    }, { durationThreshold: 40 } as PerformanceObserverInit);

    // TTFB — navigatsiya vaqti
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav) report('TTFB', nav.responseStart);
    } catch { /* ignore */ }

    const flush = () => {
      if (document.visibilityState !== 'hidden') return;
      if (lcp) report('LCP', lcp);
      report('CLS', cls);
      if (inp) report('INP', inp);
    };
    document.addEventListener('visibilitychange', flush);

    return () => {
      obs.forEach((o) => o.disconnect());
      document.removeEventListener('visibilitychange', flush);
    };
  }, []);

  return null;
}
