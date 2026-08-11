'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { PriceRange } from '@/lib/api';

/** So'm summasini ixcham ko'rinishga keltiradi: 50000→"50 ming", 1500000→"1.5 mln". */
function fmtSom(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)} mln`;
  }
  if (v >= 1000) return `${Math.round(v / 1000)} ming`;
  return String(v);
}

/** Dual-thumb narx oralig'i slideri — URL priceMin/priceMax bilan (debounced). */
export function PriceRangeFilter({ bounds }: { bounds: PriceRange }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('search');

  const { min, max } = bounds;
  const step = Math.max(1, Math.round((max - min) / 100));

  const urlLo = params.get('priceMin');
  const urlHi = params.get('priceMax');
  const [lo, setLo] = useState(urlLo ? Number(urlLo) : min);
  const [hi, setHi] = useState(urlHi ? Number(urlHi) : max);

  // Tashqi o'zgarish (URL yoki bounds — masalan kategoriya almashsa) → sinxron.
  useEffect(() => {
    setLo(urlLo ? Math.max(min, Number(urlLo)) : min);
    setHi(urlHi ? Math.min(max, Number(urlHi)) : max);
  }, [urlLo, urlHi, min, max]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function commit(nlo: number, nhi: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (nlo > min) p.set('priceMin', String(nlo));
      else p.delete('priceMin');
      if (nhi < max) p.set('priceMax', String(nhi));
      else p.delete('priceMax');
      router.push(`${pathname}?${p.toString()}`, { scroll: false });
    }, 350);
  }

  function onLo(v: number) {
    const nlo = Math.min(v, hi - step);
    setLo(nlo);
    commit(nlo, hi);
  }
  function onHi(v: number) {
    const nhi = Math.max(v, lo + step);
    setHi(nhi);
    commit(lo, nhi);
  }

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="mb-2.5 flex items-center justify-between text-sm">
        <span className="font-medium text-ink">{t('price')}</span>
        <span className="font-semibold text-brand">
          {fmtSom(lo)} — {fmtSom(hi)} {t('som')}
        </span>
      </div>

      <div className="relative h-[18px]">
        {/* Track + faol to'ldirish */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-line">
          <div
            className="absolute h-full rounded-full bg-brand"
            style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
          />
        </div>
        {/* Ikki thumb */}
        <input
          type="range"
          className="izla-range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => onLo(Number(e.target.value))}
          aria-label={`${t('price')} — min`}
          style={{ zIndex: lo > max - step * 2 ? 5 : 3 }}
        />
        <input
          type="range"
          className="izla-range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => onHi(Number(e.target.value))}
          aria-label={`${t('price')} — max`}
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}
