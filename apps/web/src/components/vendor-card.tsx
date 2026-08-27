import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Vendor } from '@/lib/api';
import { FavoriteButton } from '@/components/favorite-button';

export async function VendorCard({ v, priority = false }: { v: Vendor; priority?: boolean }) {
  const t = await getTranslations('common');
  const cover = v.photos?.[0] ?? 'https://picsum.photos/seed/izla/800/600';
  return (
    <Link href={`/vendor/${v.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-xl bg-white border border-line shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-pop">
        {/* Rasm */}
        <div className="relative aspect-[4/3] overflow-hidden bg-bg">
          <Image
            src={cover}
            alt={v.name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />

          {/* Kategoriya chip (glass) */}
          {v.category && (
            <span className="chip absolute top-3 left-3 bg-white/85 backdrop-blur text-navy shadow-sm">
              <span>{v.category.icon}</span>
              {v.category.name}
            </span>
          )}

          {/* Sevimli (yurak) — o'ng yuqori */}
          <div className="absolute top-2.5 right-2.5">
            <FavoriteButton vendorId={v.id} />
          </div>

          {/* Nom + reyting (rasm ustida) */}
          <div className="absolute bottom-0 inset-x-0 flex items-end justify-between gap-2 p-3.5">
            <h3 className="flex items-center gap-1 font-display font-semibold text-white text-[15px] leading-tight drop-shadow">
              <span className="truncate">{v.name}</span>
              {v.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-teal-400" />}
            </h3>
            <span className="chip shrink-0 bg-navy/70 backdrop-blur text-white">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span className="font-semibold">{v.rating.toFixed(1)}</span>
            </span>
          </div>
        </div>

        {/* Pastki qator */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-3 text-sm">
          <span className="flex items-center gap-1 text-slate2 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" />
            <span className="truncate">{v.district ?? 'Toshkent'}</span>
          </span>
          <span className="text-slate2">{t('reviews', { count: v.reviewCount })}</span>
          {v.distanceKm != null && (
            <span className="chip bg-brand-50 text-brand">{v.distanceKm} km</span>
          )}
        </div>
      </article>
    </Link>
  );
}
