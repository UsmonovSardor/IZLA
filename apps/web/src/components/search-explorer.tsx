'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
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
} from 'lucide-react';
import type { Vendor } from '@/lib/api';
import { VendorMap } from './vendor-map';

type Props = { vendors: Vendor[]; initialCategory?: string };

type CatMeta = { slug: string; name: string; icon?: string; total: number };

type SortKey = 'popular' | 'rating' | 'nearby' | 'az';
type Pos = { lat: number; lng: number };

const R = 6371;
function haversineKm(a: Pos, bLat: number, bLng: number): number {
  const dLat = ((bLat - a.lat) * Math.PI) / 180;
  const dLng = ((bLng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))).toFixed(1);
}

export function SearchExplorer({ vendors, initialCategory }: Props) {
  const t = useTranslations('search');
  const tc = useTranslations('common');

  // ── Filtr holati ──────────────────────────────────────────────────────────
  const [category, setCategory] = useState<string | null>(initialCategory ?? null);
  const [minRating, setMinRating] = useState<0 | 4 | 4.5>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('popular');
  const [pos, setPos] = useState<Pos | null>(null);
  const [geo, setGeo] = useState<'idle' | 'locating' | 'error'>('idle');

  // ── UI holati ─────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const listRef = useRef<HTMLDivElement>(null);

  // Kategoriya chiplari — vendorlarning o'zidan (sonlar 100% mos, ko'p bo'yicha saralangan).
  const cats = useMemo<CatMeta[]>(() => {
    const m = new Map<string, CatMeta>();
    for (const v of vendors) {
      const c = v.category;
      if (!c?.slug) continue;
      const cur = m.get(c.slug);
      if (cur) cur.total += 1;
      else m.set(c.slug, { slug: c.slug, name: c.name, icon: c.icon, total: 1 });
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [vendors]);

  // Kategoriya-bo'lmagan filtrlarni qo'llagan ro'yxat — chip sonlari shunga qarab hisoblanadi.
  const baseFiltered = useMemo(
    () =>
      vendors.filter(
        (v) => v.rating >= minRating && (!verifiedOnly || v.verified),
      ),
    [vendors, minRating, verifiedOnly],
  );

  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of baseFiltered) {
      const s = v.category?.slug;
      if (s) m.set(s, (m.get(s) ?? 0) + 1);
    }
    return m;
  }, [baseFiltered]);

  // Yakuniy ro'yxat: kategoriya + masofa + saralash.
  const results = useMemo(() => {
    let list = baseFiltered.filter((v) => !category || v.category?.slug === category);
    const withDist = list.map((v) => ({
      ...v,
      distanceKm: pos && Number.isFinite(v.lat) && Number.isFinite(v.lng)
        ? haversineKm(pos, v.lat, v.lng)
        : v.distanceKm ?? null,
    }));
    withDist.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating || b.reviewCount - a.reviewCount;
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'nearby')
        return (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9) || b.rating - a.rating;
      return b.reviewCount - a.reviewCount || b.rating - a.rating; // popular
    });
    return withDist;
  }, [baseFiltered, category, pos, sort]);

  // Xaritadan tanlansa — mos qatorni ko'rinishga surish.
  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-vid="${selectedId}"]`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  const hasFilters = category !== null || minRating !== 0 || verifiedOnly || sort !== 'popular';

  function clearAll() {
    setCategory(null);
    setMinRating(0);
    setVerifiedOnly(false);
    setSort('popular');
  }

  function requestNearby() {
    if (pos) {
      setSort((s) => (s === 'nearby' ? 'popular' : 'nearby'));
      return;
    }
    if (!('geolocation' in navigator)) {
      setGeo('error');
      return;
    }
    setGeo('locating');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeo('idle');
        setSort('nearby');
      },
      () => setGeo('error'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const sortOptions: { key: SortKey; label: string; disabled?: boolean }[] = [
    { key: 'popular', label: t('sortPopular') },
    { key: 'rating', label: t('sortRating') },
    { key: 'nearby', label: t('sortNearby'), disabled: !pos },
    { key: 'az', label: t('sortAz') },
  ];

  return (
    <div>
      {/* ─────────────────  FILTR PANELI  ───────────────── */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-line/70 bg-bg/85 px-4 pt-3 pb-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        {/* Kategoriya segment-scroller */}
        <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-2.5">
          <CatChip
            active={category === null}
            icon="✨"
            label={tc('all')}
            count={baseFiltered.length}
            onClick={() => setCategory(null)}
          />
          {cats.map((c) => (
            <CatChip
              key={c.slug}
              active={category === c.slug}
              icon={c.icon}
              label={c.name}
              count={countByCat.get(c.slug) ?? 0}
              onClick={() => setCategory((cur) => (cur === c.slug ? null : c.slug))}
            />
          ))}
        </div>

        {/* Fasetlar + saralash */}
        <div className="flex flex-wrap items-center gap-2">
          <FacetPill active={minRating === 4.5} onClick={() => setMinRating((r) => (r === 4.5 ? 0 : 4.5))}>
            <Star className="h-3.5 w-3.5 fill-warning text-warning" /> 4.5+
          </FacetPill>
          <FacetPill active={minRating === 4} onClick={() => setMinRating((r) => (r === 4 ? 0 : 4))}>
            <Star className="h-3.5 w-3.5 fill-warning text-warning" /> 4+
          </FacetPill>
          <FacetPill active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
            <BadgeCheck className="h-3.5 w-3.5 text-teal-600" /> {t('verified')}
          </FacetPill>
          <FacetPill active={sort === 'nearby'} onClick={requestNearby}>
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
            <label className="relative inline-flex items-center">
              <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label={t('sort')}
                className="cursor-pointer appearance-none rounded-full border border-line bg-surface py-1.5 pl-8 pr-8 text-xs font-medium text-navy shadow-sm outline-none transition hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/15"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key} disabled={o.disabled}>
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
          <p className="text-sm text-muted">
            <span className="font-semibold text-navy">{results.length}</span> {t('foundSuffix')}
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
      {results.length === 0 ? (
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
            ref={listRef}
            data-lenis-prevent
            className={`${mobileView === 'map' ? 'hidden' : 'block'} lg:block lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto lg:pr-2 -mr-2 space-y-3`}
          >
            {results.map((v) => (
              <ResultRow
                key={v.id}
                v={v}
                active={v.id === selectedId}
                onHover={setHoveredId}
                onSelect={setSelectedId}
                reviewsLabel={tc('reviews', { count: v.reviewCount })}
                detailsLabel={tc('viewDetails')}
              />
            ))}
          </div>

          <div
            data-lenis-prevent
            className={`${mobileView === 'list' ? 'hidden' : 'block'} lg:block lg:sticky lg:top-[8.5rem] h-[calc(100dvh-13rem)] lg:h-[calc(100dvh-11rem)]`}
          >
            <VendorMap
              vendors={results}
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
