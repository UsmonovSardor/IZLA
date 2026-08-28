'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useSavedJobs } from '@/components/saved-jobs-provider';
import { useToast } from '@/components/toast';

/** Bookmark tugma — vakansiyani saqlash (login-gate + optimistik + toast). */
export function SaveJobButton({
  jobId,
  variant = 'floating',
  className = '',
}: {
  jobId: string;
  variant?: 'floating' | 'inline';
  className?: string;
}) {
  const t = useTranslations('savedJobs');
  const { user, openLogin } = useAuth();
  const { has, toggle } = useSavedJobs();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const active = has(jobId);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { openLogin(); return; }
    if (busy) return;
    setBusy(true);
    try {
      const saved = await toggle(jobId);
      toast({ variant: saved ? 'success' : 'info', title: saved ? t('added') : t('removed') });
    } catch {
      toast({ variant: 'error', title: t('error') });
    } finally { setBusy(false); }
  };

  const base =
    variant === 'floating'
      ? 'grid h-9 w-9 place-items-center rounded-full bg-surface/90 backdrop-blur shadow-md transition hover:bg-surface'
      : 'inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-violet-200';

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? t('removeAria') : t('addAria')}
      className={`${base} ${active ? 'text-violet-600' : 'text-slate-400 hover:text-violet-600'} ${className}`}
    >
      <motion.span
        key={active ? 'on' : 'off'}
        initial={reduce ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="grid place-items-center"
      >
        <Bookmark size={variant === 'floating' ? 18 : 17} className={active ? 'fill-violet-600' : ''} />
      </motion.span>
      {variant === 'inline' && <span>{active ? t('saved') : t('save')}</span>}
    </button>
  );
}
