'use client';

import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/components/favorites-provider';

/** Header'dagi yurak ikonka — sevimlilar soni badge bilan. */
export function FavoritesNavIcon() {
  const t = useTranslations('favorites');
  const { count } = useFavorites();
  return (
    <Link
      href="/sevimlilar"
      aria-label={t('title')}
      className="relative grid h-9 w-9 place-items-center rounded-full text-slate2 transition hover:bg-rose-50 hover:text-rose-500"
    >
      <Heart size={18} className={count > 0 ? 'fill-rose-500 text-rose-500' : ''} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
