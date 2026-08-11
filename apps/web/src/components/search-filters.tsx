'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, Clock, Star, X } from 'lucide-react';
import type { FacetCategory } from '@/lib/api';

/** Qidiruv filtr paneli — kategoriya facets (count bilan) + sort + verified + reyting. URL param'lar bilan. */
export function SearchFilters({ categories }: { categories: FacetCategory[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('search');

  const activeCat = params.get('category');
  const sort = params.get('sort') ?? '';
  const verified = params.get('verified') === 'true';
  const openNow = params.get('openNow') === 'true';
  const minRating = params.get('minRating');
  const hasQ = !!params.get('q');

  function apply(updates: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === '') p.delete(k);
      else p.set(k, v);
    }
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function clearAll() {
    const p = new URLSearchParams();
    const q = params.get('q');
    if (q) p.set('q', q);
    router.push(`${pathname}${p.toString() ? `?${p}` : ''}`, { scroll: false });
  }

  const hasFilters = !!(activeCat || verified || openNow || minRating || sort);
  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      on ? 'border-brand bg-brand text-white shadow-sm' : 'border-line bg-surface text-ink hover:border-brand/40 hover:bg-brand-50'
    }`;

  return (
    <div className="mb-5 space-y-3">
      {/* Kategoriya facets */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => apply({ category: null })} className={chip(!activeCat)}>
            {t('allCategories')}
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => apply({ category: activeCat === c.slug ? null : c.slug })}
              className={chip(activeCat === c.slug)}
            >
              {c.icon && <span>{c.icon}</span>}
              {c.name}
              <span className={`text-xs ${activeCat === c.slug ? 'text-white/75' : 'text-slate2'}`}>{c.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sort + verified + reyting + tozalash */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sort}
          onChange={(e) => apply({ sort: e.target.value || null })}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink outline-none transition hover:border-brand/40"
          aria-label={t('sortRating')}
        >
          {hasQ && <option value="">{t('sortRelevance')}</option>}
          <option value="rating">{t('sortRating')}</option>
        </select>

        <button onClick={() => apply({ openNow: openNow ? null : 'true' })} className={chip(openNow)}>
          <Clock className="h-3.5 w-3.5" /> {t('openNow')}
        </button>

        <button onClick={() => apply({ verified: verified ? null : 'true' })} className={chip(verified)}>
          <Check className="h-3.5 w-3.5" /> {t('verified')}
        </button>

        {['4', '4.5'].map((r) => (
          <button key={r} onClick={() => apply({ minRating: minRating === r ? null : r })} className={chip(minRating === r)}>
            <Star className={`h-3.5 w-3.5 ${minRating === r ? 'fill-white text-white' : 'fill-warning text-warning'}`} />
            {r}+
          </button>
        ))}

        {hasFilters && (
          <button onClick={clearAll} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-slate2 transition hover:text-danger">
            <X className="h-3.5 w-3.5" /> {t('clear')}
          </button>
        )}
      </div>
    </div>
  );
}
