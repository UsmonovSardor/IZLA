'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { api, type MortgageProgram, type MortgageFacets } from '@/lib/api';
import { MortgageProgramCard } from './program-card';

type Sort = 'popular' | 'rate_asc' | 'monthly_asc' | 'rating';
const ACCENT = '#0F766E';

export function MortgageMarketplace({
  initialPrograms,
  initialFacets,
}: {
  initialPrograms: MortgageProgram[];
  initialFacets: MortgageFacets;
}) {
  const t = useTranslations('ipoteka');
  const reduce = useReducedMotion();

  const [bank, setBank] = useState<string | null>(null);
  const [maxRate, setMaxRate] = useState<number | null>(null);
  const [subsidized, setSubsidized] = useState(false);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('popular');

  const [programs, setPrograms] = useState(initialPrograms);
  const [facets, setFacets] = useState(initialFacets);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);
  const seq = useRef(0);

  const rateMax = facets.rateRange?.max ?? 30;
  const rateMin = facets.rateRange?.min ?? 5;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (bank) p.set('bank', bank);
    if (maxRate != null) p.set('maxRate', String(maxRate));
    if (subsidized) p.set('subsidized', 'true');
    if (propertyType) p.set('propertyType', propertyType);
    if (sort) p.set('sort', sort);
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [bank, maxRate, subsidized, propertyType, sort]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const h = setTimeout(() => {
      Promise.all([api.mortgagePrograms(qs), api.mortgageFacets(qs)])
        .then(([pr, fc]) => {
          if (id !== seq.current) return;
          setPrograms(pr);
          setFacets(fc);
        })
        .catch(() => {})
        .finally(() => {
          if (id === seq.current) setLoading(false);
        });
    }, 200);
    return () => clearTimeout(h);
  }, [qs]);

  const hasFilter = bank || maxRate != null || subsidized || propertyType || sort !== 'popular';
  const clear = () => {
    setBank(null);
    setMaxRate(null);
    setSubsidized(false);
    setPropertyType(null);
    setSort('popular');
  };

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${active ? 'text-white' : 'border-line text-ink hover:border-brand/40'}`;
  const propertyTypes = ['NEW', 'SECONDARY', 'CONSTRUCTION'];

  return (
    <div id="dasturlar" className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-24 self-start">
        <div className="flex flex-col gap-6 rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-heading"><SlidersHorizontal className="h-4 w-4" /> {t('filter.title')}</span>
            {hasFilter && (
              <button onClick={clear} className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-danger"><X className="h-3.5 w-3.5" /> {t('filter.clear')}</button>
            )}
          </div>

          {/* Imtiyozli */}
          <button onClick={() => setSubsidized((v) => !v)} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${subsidized ? 'font-semibold text-white' : 'text-ink hover:bg-bg'}`} style={subsidized ? { background: ACCENT } : undefined}>
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> {t('filter.subsidized')}</span>
            <span className={subsidized ? 'text-white/80' : 'text-muted'}>{facets.subsidized}</span>
          </button>

          {/* Banklar */}
          {facets.banks.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('filter.bank')}</div>
              <div className="flex flex-col gap-1.5">
                {facets.banks.map((b) => {
                  const active = bank === b.slug;
                  return (
                    <button key={b.slug} onClick={() => setBank(active ? null : b.slug)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${active ? 'font-semibold text-white' : 'text-ink hover:bg-bg'}`} style={active ? { background: 'var(--c-navy, #0B1F33)' } : undefined}>
                      <span className="truncate">{b.name}</span>
                      <span className={active ? 'text-white/70' : 'text-muted'}>{b.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stavka */}
          {rateMax > rateMin && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                <span>{t('filter.maxRate')}</span>
                <span className="text-heading">{maxRate ?? rateMax}%</span>
              </div>
              <input type="range" min={rateMin} max={rateMax} step={0.5} value={maxRate ?? rateMax} onChange={(e) => setMaxRate(Number(e.target.value))} className="izla-range mt-2 w-full" style={{ accentColor: ACCENT }} />
            </div>
          )}

          {/* Uy turi */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('filter.propertyType')}</div>
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((pt) => (
                <button key={pt} onClick={() => setPropertyType(propertyType === pt ? null : pt)} className={chip(propertyType === pt)} style={propertyType === pt ? { background: ACCENT, borderColor: ACCENT } : undefined}>
                  {t(`propType.${pt}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{t('filter.results', { count: programs.length })}</p>
          <label className="inline-flex items-center gap-2 text-sm">
            <span className="text-muted">{t('filter.sort')}:</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-medium text-heading">
              <option value="popular">{t('filter.sortPopular')}</option>
              <option value="rate_asc">{t('filter.sortRate')}</option>
              <option value="monthly_asc">{t('filter.sortMonthly')}</option>
              <option value="rating">{t('filter.sortRating')}</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 rounded-3xl border border-line bg-surface p-5"><div className="skeleton h-full w-full rounded-2xl" /></div>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-surface p-12 text-center text-muted">{t('filter.empty')}</div>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {programs.map((p) => (
                <motion.div key={p.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}>
                  <MortgageProgramCard
                    p={p}
                    labels={{
                      rate: t('card.rate'),
                      monthlyFrom: t('card.monthlyFrom'),
                      minDown: t('card.minDown'),
                      upToYears: t('card.years'),
                      calculate: t('card.calculate'),
                      popular: t('card.popular'),
                      subsidized: t('card.subsidized'),
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
