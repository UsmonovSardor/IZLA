'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BadgeCheck, List, MapPin, Star, MapIcon } from 'lucide-react';
import type { Vendor } from '@/lib/api';
import { VendorMap } from './vendor-map';

type Props = { vendors: Vendor[] };

export function SearchExplorer({ vendors }: Props) {
  const t = useTranslations('search');
  const tc = useTranslations('common');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const listRef = useRef<HTMLDivElement>(null);

  // Xaritadan tanlansa — mos qatorni ko'rinishga surish (desktop ro'yxati).
  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-vid="${selectedId}"]`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  if (vendors.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface p-8 text-center text-slate2">
        {t('empty')}
      </div>
    );
  }

  return (
    <div>
      {/* Mobil almashtirgich */}
      <div className="lg:hidden mb-4 inline-flex rounded-full border border-line bg-surface p-1 shadow-sm">
        <button
          onClick={() => setMobileView('list')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            mobileView === 'list' ? 'bg-brand text-white shadow-sm' : 'text-slate2'
          }`}
        >
          <List className="h-4 w-4" /> {t('list')}
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            mobileView === 'map' ? 'bg-brand text-white shadow-sm' : 'text-slate2'
          }`}
        >
          <MapIcon className="h-4 w-4" /> {t('map')}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Ro'yxat */}
        <div
          ref={listRef}
          data-lenis-prevent
          className={`${
            mobileView === 'map' ? 'hidden' : 'block'
          } lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-2 -mr-2 space-y-3`}
        >
          {vendors.map((v) => (
            <ResultRow
              key={v.id}
              v={v}
              active={v.id === selectedId}
              onHover={setHoveredId}
              onSelect={setSelectedId}
            />
          ))}
        </div>

        {/* Xarita (desktopda sticky, mobil almashtirgichda) */}
        <div
          data-lenis-prevent
          className={`${
            mobileView === 'list' ? 'hidden' : 'block'
          } lg:block lg:sticky lg:top-20 h-[calc(100dvh-11rem)] lg:h-[calc(100dvh-8rem)]`}
        >
          <VendorMap
            vendors={vendors}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={setSelectedId}
            labels={{ details: tc('viewDetails'), reviews: (n) => tc('reviews', { count: n }) }}
            className="h-full w-full overflow-hidden rounded-2xl border border-line shadow-card"
          />
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  v,
  active,
  onHover,
  onSelect,
}: {
  v: Vendor;
  active: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const tc = useTranslations('common');
  const cover = v.photos?.[0];
  return (
    <div
      data-vid={v.id}
      onMouseEnter={() => onHover(v.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(v.id)}
      className={`group flex cursor-pointer gap-3 rounded-xl border bg-white p-2.5 transition-all duration-200 hover:shadow-card ${
        active ? 'border-brand ring-2 ring-brand/30 shadow-card' : 'border-line'
      }`}
    >
      {/* Rasm */}
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-bg">
        {cover ? (
          <Image
            src={cover}
            alt={v.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">{v.category?.icon ?? '📍'}</div>
        )}
        <span className="chip absolute bottom-1 left-1 bg-navy/70 backdrop-blur text-white !px-2 !py-0.5">
          <Star className="h-3 w-3 fill-warning text-warning" />
          <span className="font-semibold">{v.rating.toFixed(1)}</span>
        </span>
      </div>

      {/* Ma'lumot */}
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="flex items-center gap-1 font-display font-semibold text-navy leading-tight">
          <span className="truncate">{v.name}</span>
          {v.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-teal-600" />}
        </h3>
        {v.category && (
          <p className="mt-0.5 text-xs text-slate2">
            {v.category.icon} {v.category.name}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate2">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-brand" />
            {v.district ?? 'Toshkent'}
          </span>
          <span>{tc('reviews', { count: v.reviewCount })}</span>
          {v.distanceKm != null && (
            <span className="chip bg-brand-50 text-brand !px-2 !py-0.5">{v.distanceKm} km</span>
          )}
        </div>
        <div className="mt-1.5">
          <Link
            href={`/vendor/${v.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-semibold text-brand hover:underline"
          >
            {tc('viewDetails')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
