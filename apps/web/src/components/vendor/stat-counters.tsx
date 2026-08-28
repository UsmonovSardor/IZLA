'use client';
import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface Counter { value: string; label: string }

/** "1200+" -> {num:1200, suffix:'+', prefix:''} */
function parse(v: string) {
  const m = v.match(/^(\D*)(\d[\d\s,]*)(.*)$/);
  if (!m) return { num: null as number | null, prefix: v, suffix: '' };
  return { num: Number(m[2]!.replace(/[\s,]/g, '')), prefix: m[1] ?? '', suffix: m[3] ?? '' };
}

function Item({ c, accent }: { c: Counter; accent: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const { num, prefix, suffix } = parse(c.value);
  const [display, setDisplay] = useState(num == null || reduce ? c.value : `${prefix}0${suffix}`);

  useEffect(() => {
    if (!inView || num == null || reduce) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(`${prefix}${Math.round(num * eased).toLocaleString('ru-RU')}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, num, prefix, suffix, reduce]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-3xl font-extrabold sm:text-4xl" style={{ color: accent }}>{display}</div>
      <div className="mt-1 text-sm text-muted">{c.label}</div>
    </div>
  );
}

export function StatCounters({ counters, accent }: { counters: Counter[]; accent: string }) {
  if (!counters.length) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface px-6 py-8 shadow-card">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {counters.map((c, i) => <Item key={i} c={c} accent={accent} />)}
      </div>
    </section>
  );
}
