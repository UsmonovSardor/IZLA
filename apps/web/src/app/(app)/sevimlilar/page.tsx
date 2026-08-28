'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from 'next-view-transitions';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Heart, Loader2, BadgeCheck, Star, MapPin, Compass } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useFavorites } from '@/components/favorites-provider';
import { FavoriteButton } from '@/components/favorite-button';
import { api, type Vendor } from '@/lib/api';
import { VendorGridSkeleton } from '@/components/skeletons';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { user, loading, openLogin } = useAuth();
  const { count } = useFavorites();
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    if (!user) { setVendors(null); return; }
    let alive = true;
    api.favorites(locale)
      .then((v) => { if (alive) setVendors(v); })
      .catch(() => { if (alive) setVendors([]); });
    return () => { alive = false; };
    // count o'zgarsa qayta yuklaymiz (yurak bosilganda ro'yxat yangilanadi)
  }, [user, locale, count]);

  return (
    <div className="container-wide py-8 md:py-12">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-500">
          <Heart className="fill-rose-500" size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('title')}</h1>
          <p className="mt-0.5 text-slate2">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mt-8">
        {loading || (user && vendors === null) ? (
          <VendorGridSkeleton count={4} />
        ) : !user ? (
          <EmptyState icon={<Heart size={40} />} title={t('loginTitle')} text={t('loginNeeded')}
            action={<button onClick={() => openLogin()} className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">{t('login')}</button>} />
        ) : vendors && vendors.length === 0 ? (
          <EmptyState icon={<Compass size={40} />} title={t('emptyTitle')} text={t('emptyText')}
            action={<Link href="/qidiruv" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">{tc('all')}</Link>} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vendors!.map((v, i) => (
              <motion.div key={v.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                <FavVendorCard v={v} rating={t('rating')} reviews={tc('reviews', { count: v.reviewCount })} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FavVendorCard({ v, reviews }: { v: Vendor; rating: string; reviews: string }) {
  const cover = v.photos?.[0] ?? 'https://picsum.photos/seed/izla/800/600';
  return (
    <Link href={`/vendor/${v.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-pop">
        <div className="relative aspect-[4/3] overflow-hidden bg-bg">
          <Image src={cover} alt={v.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(max-width:640px) 100vw, 25vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
          {v.category && (
            <span className="chip absolute top-3 left-3 bg-surface/85 text-navy shadow-sm backdrop-blur"><span>{v.category.icon}</span>{v.category.name}</span>
          )}
          <div className="absolute top-2.5 right-2.5"><FavoriteButton vendorId={v.id} /></div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
            <h3 className="flex items-center gap-1 font-display text-[15px] font-semibold leading-tight text-white drop-shadow">
              <span className="truncate">{v.name}</span>
              {v.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-teal-400" />}
            </h3>
            <span className="chip shrink-0 bg-[#0B1F33]/70 text-white backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" /><span className="font-semibold">{v.rating.toFixed(1)}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-3.5 py-3 text-sm">
          <span className="flex items-center gap-1 truncate text-slate2"><MapPin className="h-3.5 w-3.5 shrink-0 text-brand" /><span className="truncate">{v.district ?? 'Toshkent'}</span></span>
          <span className="text-slate2">{reviews}</span>
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-bg text-slate-300">{icon}</div>
      <h2 className="mt-5 font-display text-xl font-bold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-slate2">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}
