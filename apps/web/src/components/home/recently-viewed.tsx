'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { History, Star, X } from 'lucide-react';
import { readRecent, clearRecent, type RecentVendor } from '@/lib/recently-viewed';

const FALLBACK = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&q=70&auto=format&fit=crop';

/** Bosh sahifadagi "Yaqinda ko'rilgan" gorizontal lentasi. Bo'sh bo'lsa umuman render qilinmaydi. */
export function RecentlyViewed() {
  const t = useTranslations('recent');
  const [items, setItems] = useState<RecentVendor[] | null>(null); // null = mount kutilmoqda (SSR mos)

  useEffect(() => {
    const sync = () => setItems(readRecent());
    sync();
    window.addEventListener('izla:recent', sync);
    return () => window.removeEventListener('izla:recent', sync);
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="container-wide py-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand"><History size={18} /></span>
          <h2 className="font-display text-xl font-bold text-navy md:text-2xl">{t('title')}</h2>
        </div>
        <button
          onClick={() => clearRecent()}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-slate-400 transition hover:bg-bg hover:text-slate2"
        >
          <X size={14} /> {t('clear')}
        </button>
      </div>

      <div className="-mx-4 flex snap-x gap-3.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-lenis-prevent>
        {items.map((v, i) => (
          <motion.div
            key={v.slug}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className="w-[190px] flex-none snap-start"
          >
            <Link href={`/vendor/${v.slug}`} className="group block">
              <article className="overflow-hidden rounded-xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-pop">
                <div className="relative aspect-[4/3] overflow-hidden bg-bg">
                  <Image src={v.photo || FALLBACK} alt={v.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="190px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                  {v.category && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-medium text-navy backdrop-blur">
                      {v.icon && <span>{v.icon}</span>}{v.category}
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-navy/70 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                    <Star className="h-3 w-3 fill-warning text-warning" />{v.rating.toFixed(1)}
                  </span>
                </div>
                <div className="px-3 py-2.5">
                  <h3 className="truncate font-display text-sm font-semibold text-navy group-hover:text-brand">{v.name}</h3>
                  {v.district && <p className="mt-0.5 truncate text-xs text-slate2">{v.district}</p>}
                </div>
              </article>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
