'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, SearchX, X } from 'lucide-react';
import { api, type Category, type Vendor } from '@/lib/api';
import { TgScreen } from '@/components/tg/tg-screen';
import { TgVendorCard } from '@/components/tg/tg-vendor-card';
import { Skel, Chip, TgEmpty } from '@/components/tg/tg-ui';

function SearchInner() {
  const t = useTranslations('tg');
  const locale = useLocale();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>(params.get('category') ?? '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    api.categories(locale).then(setCategories).catch(() => setCategories([]));
  }, [locale]);

  // Debounce qidiruv + filtr
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (cat) p.set('category', cat);
    p.set('sort', params.get('sort') ?? 'rating');
    return `?${p.toString()}`;
  }, [q, cat, params]);

  useEffect(() => {
    let alive = true;
    setVendors(null);
    const h = setTimeout(() => {
      api
        .vendors(qs, locale)
        .then((v) => alive && setVendors(v))
        .catch(() => alive && setVendors([]));
    }, q ? 300 : 0);
    return () => {
      alive = false;
      clearTimeout(h);
    };
  }, [qs, locale, q]);

  return (
    <TgScreen large title={t('tabs.search')}>
      {/* Qidiruv maydoni */}
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-sm focus-within:border-brand">
        <Search className="h-5 w-5 shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('home.searchPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
          autoComplete="off"
          enterKeyHint="search"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} className="shrink-0 text-muted active:scale-90">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Kategoriya filtri */}
      {categories.length > 0 && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 tg-noscroll">
          <Chip active={cat === ''} onClick={() => setCat('')}>
            {t('search.allCategories')}
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={cat === c.slug} onClick={() => setCat(cat === c.slug ? '' : c.slug)}>
              {c.icon} {c.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Natijalar */}
      <div className="mt-4">
        {!vendors ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skel key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <TgEmpty icon={SearchX} title={t('search.emptyTitle')} sub={t('search.emptySub')} />
        ) : (
          <>
            <p className="mb-3 text-[13px] text-muted">{t('search.count', { n: vendors.length })}</p>
            <div className="space-y-3">
              {vendors.map((v) => (
                <TgVendorCard key={v.id} v={v} variant="list" />
              ))}
            </div>
          </>
        )}
      </div>
    </TgScreen>
  );
}

export default function TgSearch() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
