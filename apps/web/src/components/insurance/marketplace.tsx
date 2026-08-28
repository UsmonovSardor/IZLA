'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import { api, type InsuranceProduct, type InsuranceFacets, type InsuranceTypeId } from '@/lib/api';
import { TYPE_ICON, TYPE_ACCENT, TYPE_ORDER } from '@/lib/insurance-meta';
import { formatUZS } from '@/lib/utils';
import { InsuranceProductCard } from './product-card';
import { InsuranceSkeleton } from './skeleton';

type Sort = 'popular' | 'price_asc' | 'price_desc' | 'rating';

export function InsuranceMarketplace({
  initialProducts,
  initialFacets,
}: {
  initialProducts: InsuranceProduct[];
  initialFacets: InsuranceFacets;
}) {
  const t = useTranslations('sugurta');
  const reduce = useReducedMotion();

  const [type, setType] = useState<InsuranceTypeId | null>(null);
  const [insurer, setInsurer] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [term, setTerm] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>('popular');

  const [products, setProducts] = useState(initialProducts);
  const [facets, setFacets] = useState(initialFacets);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);
  const seq = useRef(0);

  const priceMax = facets.priceRange?.max ?? initialFacets.priceRange?.max ?? 0;
  const priceMin = facets.priceRange?.min ?? 0;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (type) p.set('type', type);
    if (insurer) p.set('insurer', insurer);
    if (maxPrice != null) p.set('maxPrice', String(maxPrice));
    if (term != null) p.set('term', String(term));
    if (sort) p.set('sort', sort);
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [type, insurer, maxPrice, term, sort]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const handle = setTimeout(() => {
      Promise.all([api.insuranceProducts(qs), api.insuranceFacets(qs)])
        .then(([prod, fac]) => {
          if (id !== seq.current) return;
          setProducts(prod);
          setFacets(fac);
        })
        .catch(() => {})
        .finally(() => {
          if (id === seq.current) setLoading(false);
        });
    }, 200);
    return () => clearTimeout(handle);
  }, [qs]);

  const hasFilter = type || insurer || maxPrice != null || term != null || sort !== 'popular';
  const clear = () => {
    setType(null);
    setInsurer(null);
    setMaxPrice(null);
    setTerm(null);
    setSort('popular');
  };

  const typeCount = (tp: InsuranceTypeId) => facets.types.find((x) => x.type === tp)?.count ?? 0;

  const chip = (active: boolean, accent?: string) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
      active ? 'text-white' : 'border-line text-ink hover:border-brand/40'
    }`;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Filtr paneli */}
      <aside className="lg:sticky lg:top-24 self-start">
        <div className="flex flex-col gap-6 rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-heading">
              <SlidersHorizontal className="h-4 w-4" /> {t('filter.title')}
            </span>
            {hasFilter && (
              <button onClick={clear} className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-danger">
                <X className="h-3.5 w-3.5" /> {t('filter.clear')}
              </button>
            )}
          </div>

          {/* Turlar */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('filter.type')}</div>
            <div className="flex flex-col gap-1.5">
              <button onClick={() => setType(null)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${!type ? 'bg-brand/10 font-semibold text-brand' : 'text-ink hover:bg-bg'}`}>
                <span>{t('filter.allTypes')}</span>
                <span className="text-xs text-muted">{facets.total}</span>
              </button>
              {TYPE_ORDER.map((tp) => {
                const Icon = TYPE_ICON[tp];
                const c = typeCount(tp);
                const active = type === tp;
                return (
                  <button
                    key={tp}
                    onClick={() => setType(active ? null : tp)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${active ? 'font-semibold text-white' : 'text-ink hover:bg-bg'}`}
                    style={active ? { background: TYPE_ACCENT[tp] } : undefined}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" style={active ? undefined : { color: TYPE_ACCENT[tp] }} /> {t(`types.${tp}.name`)}
                    </span>
                    <span className={`text-xs ${active ? 'text-white/80' : 'text-muted'}`}>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kompaniya */}
          {facets.insurers.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('filter.insurer')}</div>
              <div className="flex flex-wrap gap-2">
                {facets.insurers.map((ins) => {
                  const active = insurer === ins.slug;
                  return (
                    <button
                      key={ins.slug}
                      onClick={() => setInsurer(active ? null : ins.slug)}
                      className={chip(active)}
                      style={active ? { background: 'var(--c-navy, #0B1F33)', borderColor: 'transparent' } : undefined}
                    >
                      {ins.name} <span className={active ? 'text-white/70' : 'text-muted'}>{ins.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Narx */}
          {priceMax > priceMin && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                <span>{t('filter.maxPrice')}</span>
                <span className="text-heading" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatUZS(maxPrice ?? priceMax)}</span>
              </div>
              <input
                type="range"
                min={priceMin}
                max={priceMax}
                step={Math.max(10000, Math.round((priceMax - priceMin) / 100))}
                value={maxPrice ?? priceMax}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="izla-range mt-2 w-full"
              />
            </div>
          )}

          {/* Muddat */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('filter.term')}</div>
            <div className="flex gap-2">
              {[12, 6].map((m) => (
                <button key={m} onClick={() => setTerm(term === m ? null : m)} className={chip(term === m)} style={term === m ? { background: 'var(--c-navy, #0B1F33)', borderColor: 'transparent' } : undefined}>
                  {m} {t('calc.months')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Natijalar */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {t('filter.results', { count: products.length })}
          </p>
          <label className="inline-flex items-center gap-2 text-sm">
            <span className="text-muted">{t('filter.sort')}:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-medium text-heading"
            >
              <option value="popular">{t('filter.sortPopular')}</option>
              <option value="price_asc">{t('filter.sortPriceAsc')}</option>
              <option value="price_desc">{t('filter.sortPriceDesc')}</option>
              <option value="rating">{t('filter.sortRating')}</option>
            </select>
          </label>
        </div>

        {loading ? (
          <InsuranceSkeleton />
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-surface p-12 text-center text-muted">{t('filter.empty')}</div>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {products.map((p) => (
                <motion.div
                  key={p.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                >
                  <InsuranceProductCard
                    p={p}
                    labels={{
                      from: t('card.from'),
                      coverage: t('card.coverage'),
                      calculate: t('card.calculate'),
                      popular: t('filter.popular'),
                      typeName: t(`types.${p.type}.name`),
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
