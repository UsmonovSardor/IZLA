'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  BadgeCheck,
  List,
  MapPin,
  Star,
  MapIcon,
  LocateFixed,
  Loader2,
  X,
  Check,
  ArrowUpDown,
  Clock,
} from 'lucide-react';
import { api, type Vendor, type Facets } from '@/lib/api';
import { vendorsQS, type SearchFilters, type SortKey } from '@/lib/search';
import { VendorMap } from './vendor-map';

type Props = {
  initialVendors: Vendor[];
  facets: Facets;
  filters: SearchFilters;
  pageSize: number;
};

type Geo = { lat: number; lng: number };

export function SearchExplorer({ initialVendors, facets, filters, pageSize }: Props) {
  const t = useTranslations('search');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ── Ro'yxat: server 1-sahifa + klient infinite scroll ────────────────────
  const [items, setItems] = useState<Vendor[]>(initialVendors);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialVendors.length >= pageSize);
  const [loading, setLoading] = useState(false);

  // ── Geolokatsiya: URL'ga YOZILMAYDI (maxfiylik), faqat klient fetch'ida ──
  const [geoPos, setGeoPos] = useState<Geo | null>(null);
  const [geo, setGeo] = useState<'idle' | 'locating' | 'error'>('idle');

  // ── UI ──
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const parentRef = useRef<HTMLDivElement>(null);

  // Server 1-sahifa (URL o'zgarganda) → ro'yxatni tiklash. Geo rejimida alohida oqim.
  useEffect(() => {
    if (geoPos) return;
    setItems(initialVendors);
    setPage(2);
    setHasMore(initialVendors.length >= pageSize);
    parentRef.current?.scrollTo({ top: 0 });
  }, [initialVendors, geoPos, pageSize]);

  // Geo rejimi: 1-sahifani klientda lat/lng + sort=distance bilan olamiz.
  useEffect(() => {
    if (!geoPos) return;
    let cancelled = false;
    setLoading(true);
    api
      .vendors(vendorsQS(filters, { withCategory: true, page: 1, geo: geoPos }), locale)
      .then((res) => {
        if (cancelled) return;
        setItems(res);
        setPage(2);
        setHasMore(res.length >= pageSize);
        parentRef.current?.scrollTo({ top: 0 });
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [geoPos, filters, locale, pageSize]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await api.vendors(
        vendorsQS(filters, { withCategory: true, page, geo: geoPos }),
        locale,
      );
      setItems((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        return [...prev, ...res.filter((v) => !seen.has(v.id))];
      });
      setPage((p) => p + 1);
      setHasMore(res.length >= pageSize);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, filters, geoPos, locale, pageSize]);

  // ── Virtualizatsiya (uzun ro'yxat = kam DOM) ──────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 6,
    gap: 12,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastIndex = virtualItems.length ? virtualItems[virtualItems.length - 1].index : 0;

  // Oxiriga yaqinlashganда keyingi sahifa (infinite scroll).
  useEffect(() => {
    if (lastIndex >= items.length - 5 && hasMore && !loading) loadMore();
  }, [lastIndex, items.length, hasMore, loading, loadMore]);

  // Xaritadan tanlanса — mos qatorni ko'rinishga surish.
  useEffect(() => {
    if (!selectedId) return;
    const idx = items.findIndex((v) => v.id === selectedId);
    if (idx >= 0) rowVirtualizer.scrollToIndex(idx, { align: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ── URL filtr setterlari (ulashiladigan, back tugma, SEO) ─────────────────
  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, val] of Object.entries(patch)) {
        if (val === null || val === '') p.delete(k);
        else p.set(k, val);
      }
      const qs = p.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [searchParams, pathname, router],
  );

  function requestNearby() {
    if (geoPos) {
      setGeoPos(null);
      return;
    }
    if (!('geolocation' in navigator)) {
      setGeo('error');
      return;
    }
    setGeo('locating');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeo('idle');
      },
      () => setGeo('error'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function clearAll() {
    setGeoPos(null);
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  const hasFilters =
    !!filters.category ||
    filters.minRating !== 0 ||
    filters.verified ||
    filters.openNow ||
    filters.sort !== 'popular' ||
    !!geoPos;

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'popular', label: t('sortPopular') },
    { key: 'rating', label: t('sortRating') },
    { key: 'az', label: t('sortAz') },
  ];

  const busy = loading || isPending;

  // Sanoq: kategoriya tanlanган bo'lsa — o'sha kategoriya soni; aks holda umumiy (facets.total).
  const displayTotal = filters.category
    ? facets.categories.find((c) => c.slug === filters.category)?.count ?? 0
    : facets.total;

  return (
    <div>
      {/* ─────────────────  FILTR PANELI  ───────────────── */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-line/70 bg-bg/85 px-4 pt-3 pb-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        {/* Kategoriya segment-scroller — server facet sanoqlari (butun DB) */}
        <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-2.5">
          <CatChip
            active={!filters.category}
            icon="✨"
            label={tc('all')}
            count={facets.total}
            onClick={() => setParams({ category: null })}
          />
          {facets.categories.map((c) => (
            <CatChip
              key={c.slug}
              active={filters.category === c.slug}
              icon={c.icon}
              label={c.name}
              count={c.count}
              onClick={() => setParams({ category: filters.category === c.slug ? null : c.slug })}
            />
          ))}
        </div>

        {/* Fasetlar + saralash */}
        <div className="flex flex-wrap items-center gap-2">
          <FacetPill
            active={filters.minRating === 4.5}
            onClick={() => setParams({ minRating: filters.minRating === 4.5 ? null : '4.5' })}
          >
            <Star className="h-3.5 w-3.5 fill-warning text-warning" /> 4.5+
          </FacetPill>
          <FacetPill
            active={filters.minRating === 4}
            onClick={() => setParams({ minRating: filters.minRating === 4 ? null : '4' })}
          >
            <Star className="h-3.5 w-3.5 fill-warning text-warning" /> 4+
          </FacetPill>
          <FacetPill
            active={filters.verified}
            onClick={() => setParams({ verified: filters.verified ? null : 'true' })}
          >
            <BadgeCheck className="h-3.5 w-3.5 text-teal-600" /> {t('verified')}
          </FacetPill>
          <FacetPill
            active={filters.openNow}
            onClick={() => setParams({ openNow: filters.openNow ? null : 'true' })}
          >
            <Clock className="h-3.5 w-3.5" /> {t('openNow')}
          </FacetPill>
          <FacetPill active={!!geoPos} onClick={requestNearby}>
            {geo === 'locating' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" />
            )}
            {geo === 'error' ? t('geoError') : t('nearMe')}
          </FacetPill>

          <div className="ml-auto flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-line/60 hover:text-navy"
              >
                <X className="h-3.5 w-3.5" /> {t('clear')}
              </button>
            )}
            <label className={`relative inline-flex items-center ${geoPos ? 'opacity-40 pointer-events-none' : ''}`}>
              <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted" />
              <select
                value={filters.sort}
                onChange={(e) => {
                  const key = e.target.value as SortKey;
                  setParams({ sort: key === 'popular' ? null : key });
                }}
                aria-label={t('sort')}
                className="cursor-pointer appearance-none rounded-full border border-line bg-surface py-1.5 pl-8 pr-8 text-xs font-medium text-navy shadow-sm outline-none transition hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/15"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 h-3 w-3 text-muted" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
          </div>
        </div>

        {/* Natija soni + mobil almashtirgich */}
        <div className="mt-2.5 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span>
              <span className="font-semibold text-navy">{displayTotal}</span> {t('foundSuffix')}
            </span>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />}
          </p>
          <div className="lg:hidden inline-flex rounded-full border border-line bg-surface p-0.5 shadow-sm">
            <SegBtn active={mobileView === 'list'} onClick={() => setMobileView('list')}>
              <List className="h-4 w-4" /> {t('list')}
            </SegBtn>
            <SegBtn active={mobileView === 'map'} onClick={() => setMobileView('map')}>
              <MapIcon className="h-4 w-4" /> {t('map')}
            </SegBtn>
          </div>
        </div>
      </div>

      {/* ─────────────────  NATIJALAR + XARITA  ───────────────── */}
      {items.length === 0 && !busy ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="text-muted">{t('empty')}</p>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
            >
              <X className="h-4 w-4" /> {t('clear')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div
            ref={parentRef}
            data-lenis-prevent
            className={`${mobileView === 'map' ? 'hidden' : 'block'} lg:block h-[calc(100dvh-13rem)] lg:h-[calc(100dvh-11rem)] overflow-y-auto -mr-2 pr-2`}
          >
            <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
              {virtualItems.map((vi) => {
                const v = items[vi.index];
                if (!v) return null;
                return (
                  <div
                    key={v.id}
                    data-index={vi.index}
                    ref={rowVirtualizer.measureElement}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
                  >
                    <ResultRow
                      v={v}
                      active={v.id === selectedId}
                      onHover={setHoveredId}
                      onSelect={setSelectedId}
                      reviewsLabel={tc('reviews', { count: v.reviewCount })}
                      detailsLabel={tc('viewDetails')}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center py-4 text-xs text-muted">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {tc('loading')}
                </span>
              ) : !hasMore && items.length > 0 ? (
                <span>{t('allShown')}</span>
              ) : null}
            </div>
          </div>

          <div
            data-lenis-prevent
            className={`${mobileView === 'list' ? 'hidden' : 'block'} lg:block lg:sticky lg:top-[8.5rem] h-[calc(100dvh-13rem)] lg:h-[calc(100dvh-11rem)]`}
          >
            <VendorMap
              vendors={items}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={setSelectedId}
              labels={{ details: tc('viewDetails'), reviews: (n) => tc('reviews', { count: n }) }}
              className="h-full w-full overflow-hidden rounded-2xl border border-line shadow-card"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Sub-komponentlar ───────────────────────── */

function CatChip({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon?: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
        active
          ? 'border-brand bg-brand text-white shadow-sm'
          : 'border-line bg-surface text-navy hover:border-brand/40 hover:bg-brand-50'
      }`}
    >
      {icon && <span className="text-[15px] leading-none">{icon}</span>}
      <span className="whitespace-nowrap">{label}</span>
      <span
        className={`rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
          active ? 'bg-white/25 text-white' : 'bg-line/70 text-muted'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function FacetPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
        active
          ? 'border-brand bg-brand-50 text-brand shadow-[inset_0_0_0_1px_rgba(37,99,235,.35)]'
          : 'border-line bg-surface text-navy hover:border-brand/40'
      }`}
    >
      {children}
      {active && <Check className="h-3 w-3" />}
    </button>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'bg-brand text-white shadow-sm' : 'text-muted'
      }`}
    >
      {children}
    </button>
  );
}

function ResultRow({
  v,
  active,
  onHover,
  onSelect,
  reviewsLabel,
  detailsLabel,
}: {
  v: Vendor;
  active: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reviewsLabel: string;
  detailsLabel: string;
}) {
  const cover = v.photos?.[0];
  return (
    <div
      data-vid={v.id}
      onMouseEnter={() => onHover(v.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(v.id)}
      className={`group flex cursor-pointer gap-3.5 rounded-2xl border bg-surface p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${
        active ? 'border-brand ring-2 ring-brand/25 shadow-card' : 'border-line'
      }`}
    >
      <div className="relative h-[104px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-bg">
        {cover ? (
          <Image
            src={cover}
            alt={v.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">{v.category?.icon ?? '📍'}</div>
        )}
        <span className="chip absolute bottom-1.5 left-1.5 bg-[#0B1F33]/75 backdrop-blur text-white !px-2 !py-0.5">
          <Star className="h-3 w-3 fill-warning text-warning" />
          <span className="font-semibold">{v.rating.toFixed(1)}</span>
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex items-center gap-1 font-display font-semibold text-navy leading-tight">
            <span className="truncate">{v.name}</span>
            {v.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-teal-600" />}
          </h3>
          {v.distanceKm != null && (
            <span className="chip shrink-0 bg-brand-50 text-brand !px-2 !py-0.5">{v.distanceKm} km</span>
          )}
        </div>
        {v.category && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <span>{v.category.icon}</span> {v.category.name}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" />
            <span className="truncate">{v.district ?? 'Toshkent'}</span>
          </span>
          <span className="shrink-0">{reviewsLabel}</span>
        </div>
        <div className="mt-2">
          <Link
            href={`/vendor/${v.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition group-hover:gap-1.5 hover:underline"
          >
            {detailsLabel} →
          </Link>
        </div>
      </div>
    </div>
  );
}
