'use client';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Star, MapPin, BadgeCheck, ImageOff } from 'lucide-react';
import type { Vendor } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';

function Photo({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={cn('grid place-items-center bg-line/50 text-muted', className)}>
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={cn('object-cover', className)} />;
}

/** Rail (gorizontal skroll) yoki list (to'liq kenglik) uchun vendor kartochkasi. */
export function TgVendorCard({ v, variant = 'list' }: { v: Vendor; variant?: 'rail' | 'list' }) {
  const t = useTranslations('tg.card');
  const href = `/tg/vendor/${v.slug}`;
  const meta = [v.category?.name, v.district].filter(Boolean).join(' · ');

  if (variant === 'rail') {
    return (
      <Link
        href={href}
        onClick={() => haptic.impact('light')}
        className="block w-[220px] shrink-0 overflow-hidden rounded-2xl border border-line bg-surface transition active:scale-[0.98]"
      >
        <div className="relative">
          <Photo src={v.photos?.[0]} alt={v.name} className="h-28 w-full" />
          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-navy/70 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {v.rating.toFixed(1)}
          </div>
        </div>
        <div className="p-3">
          <p className="flex items-center gap-1 truncate font-display text-sm font-bold text-navy">
            <span className="truncate">{v.name}</span>
            {v.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand" />}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-muted">{meta || '—'}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => haptic.impact('light')}
      className="flex gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-2.5 transition active:scale-[0.99]"
    >
      <Photo src={v.photos?.[0]} alt={v.name} className="h-[76px] w-[76px] shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-center gap-1 truncate font-display text-[15px] font-bold text-navy">
            <span className="truncate">{v.name}</span>
            {v.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand" />}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-400/15 px-1.5 py-0.5 text-[12px] font-bold text-amber-600">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {v.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 truncate text-[13px] text-muted">{meta || '—'}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-muted">
          {typeof v.distanceKm === 'number' && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-teal-600" /> {v.distanceKm.toFixed(1)} km
            </span>
          )}
          <span>{t('reviews', { n: v.reviewCount })}</span>
        </div>
      </div>
    </Link>
  );
}
