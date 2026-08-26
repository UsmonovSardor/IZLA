'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, Loader2, Briefcase } from 'lucide-react';
import { api, type Job, type JobsResult, type JobFacets } from '@/lib/api';
import { JobCard } from './job-card';

const EMPLOYMENTS = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const;
const EXPERIENCES = ['NONE', 'JUNIOR', 'MIDDLE', 'SENIOR'] as const;
const SALARY_STEPS = [5, 10, 15, 20];

interface Filters {
  q: string; employment: string; experience: string; remote: boolean; salaryMin: number; category: string;
}
const EMPTY: Filters = { q: '', employment: '', experience: '', remote: false, salaryMin: 0, category: '' };

export function JobBoard({ initial, facets }: { initial: JobsResult; facets: JobFacets }) {
  const t = useTranslations('ish');
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [jobs, setJobs] = useState<Job[]>(initial.items);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const first = useRef(true);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.q) p.set('q', filters.q);
    if (filters.employment) p.set('employment', filters.employment);
    if (filters.experience) p.set('experience', filters.experience);
    if (filters.remote) p.set('remote', 'true');
    if (filters.salaryMin) p.set('salaryMin', String(filters.salaryMin * 1_000_000));
    if (filters.category) p.set('category', filters.category);
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [filters]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api.jobs(qs)
        .then((r) => { if (!cancelled) { setJobs(r.items); setTotal(r.total); } })
        .catch(() => { if (!cancelled) { setJobs([]); setTotal(0); } })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, filters.q ? 260 : 0); // qidiruvda debounce
    return () => { cancelled = true; clearTimeout(timer); };
  }, [qs, filters.q]);

  const active = filters.employment || filters.experience || filters.remote || filters.salaryMin || filters.category || filters.q;
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggle = (key: 'employment' | 'experience' | 'category', val: string) =>
    set({ [key]: filters[key] === val ? '' : val } as Partial<Filters>);

  return (
    <div>
      {/* Qidiruv paneli */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-2xl border border-line bg-white py-4 pl-12 pr-4 text-[15px] shadow-sm transition focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm text-slate2">
          {loading && <Loader2 className="animate-spin text-violet-500" size={15} />}
          <span><b className="text-navy tabular-nums">{total}</b> {t('results', { count: total }).replace(/^\s*[\d\s]+/, '')}</span>
        </p>
        <button onClick={() => setShowFilters((s) => !s)} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate2 md:hidden">
          <SlidersHorizontal size={15} /> {t('filters')}
        </button>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[248px_1fr]">
        {/* Filtrlar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="sticky top-24 space-y-6 rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-navy">{t('filters')}</span>
              {active ? (
                <button onClick={() => setFilters(EMPTY)} className="text-xs text-violet-600 hover:underline">{t('clear')}</button>
              ) : null}
            </div>

            <FilterGroup label={t('employment')}>
              {EMPLOYMENTS.map((e) => (
                <Chip key={e} on={filters.employment === e} onClick={() => toggle('employment', e)}>{t(`emp.${e}`)}</Chip>
              ))}
            </FilterGroup>

            <FilterGroup label={t('experience')}>
              {EXPERIENCES.map((e) => (
                <Chip key={e} on={filters.experience === e} onClick={() => toggle('experience', e)}>{t(`exp.${e}`)}</Chip>
              ))}
            </FilterGroup>

            <FilterGroup label={t('salary')}>
              {SALARY_STEPS.map((s) => (
                <Chip key={s} on={filters.salaryMin === s} onClick={() => set({ salaryMin: filters.salaryMin === s ? 0 : s })}>{s}+ {t('mln')}</Chip>
              ))}
            </FilterGroup>

            {facets.categories.length > 0 && (
              <FilterGroup label={t('category')}>
                {facets.categories.map((c) => (
                  <Chip key={c.name} on={filters.category === c.name} onClick={() => toggle('category', c.name)}>{c.name} <span className="opacity-50">{c.count}</span></Chip>
                ))}
              </FilterGroup>
            )}

            <label className="flex cursor-pointer items-center gap-2.5 border-t border-line pt-4 text-sm text-navy">
              <input type="checkbox" checked={filters.remote} onChange={(e) => set({ remote: e.target.checked })} className="h-4 w-4 rounded accent-violet-600" />
              {t('remoteOnly')}
            </label>
          </div>
        </aside>

        {/* Natijalar */}
        <div>
          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white py-20 text-center">
              <Briefcase className="mx-auto text-slate-300" size={40} />
              <p className="mt-4 font-display font-semibold text-navy">{t('empty')}</p>
              <p className="mt-1 text-sm text-slate2">{t('emptyHint')}</p>
            </div>
          ) : (
            <div key={qs} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${on ? 'bg-violet-600 text-white shadow-sm' : 'bg-bg text-slate2 hover:bg-violet-50 hover:text-violet-700'}`}
    >
      {children}
    </button>
  );
}
