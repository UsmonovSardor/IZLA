'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useFavorites } from '@/components/favorites-provider';
import { useToast } from '@/components/toast';

/** Yurak tugma — vendorni sevimlilarga qo'shish (login-gate + optimistik + toast). */
export function FavoriteButton({
  vendorId,
  variant = 'floating',
  className = '',
}: {
  vendorId: string;
  variant?: 'floating' | 'inline';
  className?: string;
}) {
  const t = useTranslations('favorites');
  const { user, openLogin } = useAuth();
  const { has, toggle } = useFavorites();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const active = has(vendorId);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { openLogin(); return; }
    if (busy) return;
    setBusy(true);
    try {
      const fav = await toggle(vendorId);
      toast({ variant: fav ? 'success' : 'info', title: fav ? t('added') : t('removed') });
    } catch {
      toast({ variant: 'error', title: t('error') });
    } finally { setBusy(false); }
  };

  const base =
    variant === 'floating'
      ? 'grid h-9 w-9 place-items-center rounded-full bg-surface/90 backdrop-blur shadow-md transition hover:bg-surface'
      : 'inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-rose-200';

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? t('removeAria') : t('addAria')}
      className={`${base} ${active ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'} ${className}`}
    >
      <motion.span
        key={active ? 'on' : 'off'}
        initial={reduce ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="grid place-items-center"
      >
        <Heart size={variant === 'floating' ? 18 : 17} className={active ? 'fill-rose-500' : ''} />
      </motion.span>
      {variant === 'inline' && <span>{active ? t('saved') : t('save')}</span>}
    </button>
  );
}
