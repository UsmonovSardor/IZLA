'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Search, CalendarCheck, Heart, Sparkles, X, ArrowRight } from 'lucide-react';

const SEEN_KEY = 'izla:onboarded:v1';

/**
 * Birinchi tashrif onboardingi — bir marta ko'rsatiladi (localStorage). Nafis,
 * bloklamaydigan welcome kartasi: 3 qiymat taklifi + boshlash. Skip mumkin,
 * reduced-motion hurmat qilinadi. SSR'da render qilinmaydi (localStorage klient).
 */
export function WelcomeOnboarding() {
  const t = useTranslations('onboarding');
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      seen = true; // storage yopiq bo'lsa ko'rsatmaymiz (bezovta qilmaslik)
    }
    if (seen) return;
    // Sahifa joylashgach ko'rsatamiz (LCP/kirish animatsiyasiga xalaqit bermaslik)
    const id = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(id);
  }, []);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
  };

  const items = [
    { icon: Search, t: t('f1t'), d: t('f1d') },
    { icon: CalendarCheck, t: t('f2t'), d: t('f2d') },
    { icon: Heart, t: t('f3t'), d: t('f3d') },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
        >
          <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Brend bosh qismi */}
            <div className="relative overflow-hidden bg-aurora px-7 pb-8 pt-9 text-center text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/30 blur-2xl" aria-hidden />
              <button
                onClick={close}
                aria-label={t('skip')}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white/90 transition hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" /> {t('badge')}
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold">{t('title')}</h2>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-white/80">{t('subtitle')}</p>
            </div>

            {/* Qiymat takliflari */}
            <div className="space-y-3 px-6 py-6">
              {items.map((it) => (
                <div key={it.t} className="flex items-start gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                    <it.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold text-navy">{it.t}</div>
                    <div className="text-sm text-slate2">{it.d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Harakat */}
            <div className="flex items-center gap-3 border-t border-line px-6 py-4">
              <button onClick={close} className="text-sm font-medium text-slate2 transition hover:text-ink">
                {t('skip')}
              </button>
              <Link
                href="/qidiruv"
                onClick={close}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-pop transition hover:brightness-110"
              >
                {t('cta')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
