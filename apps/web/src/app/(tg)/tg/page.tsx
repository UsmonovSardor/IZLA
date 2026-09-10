'use client';
import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useLocale, useTranslations } from 'next-intl';
import { Search, ChevronRight, Sparkles } from 'lucide-react';
import { api, type Category, type Vendor } from '@/lib/api';
import { useTg } from '@/components/tg/tg-app';
import { TgScreen, TgSection } from '@/components/tg/tg-screen';
import { TgVendorCard } from '@/components/tg/tg-vendor-card';
import { Skel } from '@/components/tg/tg-ui';
import { haptic } from '@/lib/telegram';

export default function TgHome() {
  const t = useTranslations('tg');
  const locale = useLocale();
  const { tgUser } = useTg();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[] | null>(null);

  useEffect(() => {
    api.categories(locale).then(setCategories).catch(() => setCategories([]));
    api.vendors('?sort=rating', locale).then(setVendors).catch(() => setVendors([]));
  }, [locale]);

  const name = tgUser?.first_name || t('anonUser');

  return (
    <TgScreen
      large
      title={t('home.hi', { name })}
      subtitle={t('home.sub')}
      right={
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-brand">
          <Sparkles className="h-5 w-5" />
        </span>
      }
    >
      {/* Qidiruv kirishi */}
      <Link
        href="/tg/qidiruv"
        onClick={() => haptic.impact('light')}
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-muted shadow-sm transition active:scale-[0.99]"
      >
        <Search className="h-5 w-5 text-brand" />
        <span className="text-[15px]">{t('home.searchPlaceholder')}</span>
      </Link>

      {/* Kategoriyalar — gorizontal skroll */}
      <TgSection title={t('home.categories')}>
        {!categories ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-2">
                <Skel className="h-16 w-16 rounded-2xl" />
                <Skel className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 tg-noscroll">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/tg/qidiruv?category=${c.slug}`}
                onClick={() => haptic.select()}
                className="flex w-[68px] shrink-0 flex-col items-center gap-2"
              >
                <span className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-surface text-2xl shadow-sm transition active:scale-90">
                  {c.icon || '🏷️'}
                </span>
                <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-ink">{c.name}</span>
              </Link>
            ))}
          </div>
        )}
      </TgSection>

      {/* Top joylar — rail */}
      <TgSection
        title={t('home.top')}
        action={
          <Link href="/tg/qidiruv?sort=rating" onClick={() => haptic.select()} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-brand">
            {t('home.all')} <ChevronRight className="h-4 w-4" />
          </Link>
        }
      >
        {!vendors ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skel key={i} className="h-[164px] w-[220px] shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 tg-noscroll">
            {vendors.slice(0, 10).map((v) => (
              <TgVendorCard key={v.id} v={v} variant="rail" />
            ))}
          </div>
        )}
      </TgSection>

      {/* Tavsiya — list */}
      <TgSection title={t('home.recommended')}>
        {!vendors ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skel key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.slice(0, 8).map((v) => (
              <TgVendorCard key={v.id} v={v} variant="list" />
            ))}
          </div>
        )}
      </TgSection>
    </TgScreen>
  );
}
