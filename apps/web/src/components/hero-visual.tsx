'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Dumbbell, MapPin, Scissors, Star, Stethoscope, UtensilsCrossed, Zap } from 'lucide-react';

const PINS = [
  { x: '24%', y: '28%', c: '#14B8A6', Icon: Stethoscope, delay: 0 },
  { x: '72%', y: '22%', c: '#2563EB', Icon: Scissors, delay: 0.7 },
  { x: '40%', y: '70%', c: '#7c3aed', Icon: UtensilsCrossed, delay: 1.2 },
  { x: '74%', y: '64%', c: '#f59e0b', Icon: Dumbbell, delay: 0.4 },
];

/**
 * Hero o'ng tomonidagi "jonli xarita" vizuali (Variant B — Live Product Map).
 * Pulslanuvchi pinlar + suzuvchi natija kartalari + floating badge'lar.
 * Kod bilan yasalgan (tashqi asset/video shart emas) → eng tez LCP.
 * Ixcham o'lcham (max-w-[21rem]) — kartani kichik va nafis tutadi.
 */
export function HeroVisual() {
  const reduce = useReducedMotion();
  const t = useTranslations('hero');
  const float = (dur: number, amp = 10) =>
    reduce
      ? {}
      : { animate: { y: [0, -amp, 0] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <div className="relative mx-auto w-full max-w-[21rem]">
      {/* Tashqi aurora yog'du (chuqurlik) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[42px] bg-gradient-to-br from-brand/40 via-violet/20 to-teal/40 opacity-70 blur-3xl"
      />

      {/* Shisha xarita paneli */}
      <div className="relative aspect-[4/3.7] overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.06] shadow-[0_36px_80px_-24px_rgba(0,0,0,.7)] backdrop-blur-xl">
        {/* Xarita to'ri (markazga yumshoq so'nadi) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.14] [mask-image:radial-gradient(circle_at_50%_45%,#000_55%,transparent)]"
          aria-hidden
        >
          <defs>
            <pattern id="hm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hm-grid)" />
        </svg>

        {/* Ichki aurora yog'du */}
        <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-6 right-0 h-48 w-48 rounded-full bg-teal/30 blur-3xl" />

        {/* Markaziy izla nishoni */}
        <motion.div
          {...float(5, 6)}
          className="absolute left-1/2 top-[45%] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xl font-bold text-white shadow-[0_0_36px_rgba(45,212,191,.7)]"
          style={{ background: 'radial-gradient(circle, rgba(45,212,191,.95), rgba(37,99,235,.9))' }}
        >
          i
        </motion.div>

        {/* Pinlar */}
        {PINS.map((p, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
            {!reduce && (
              <motion.span
                className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: p.c }}
                animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: p.delay }}
              />
            )}
            <div
              className="relative grid h-8 w-8 place-items-center rounded-full shadow-lg ring-2 ring-white/25"
              style={{ background: p.c }}
            >
              <p.Icon className="h-4 w-4 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Floating badge — ⚡ 30 soniyada bron (yuqori-o'ng) */}
      <motion.div
        {...float(6, 8)}
        className="absolute -right-3 top-6 inline-flex items-center gap-1.5 rounded-2xl border border-white/25 bg-gradient-to-br from-brand/90 to-violet/85 px-3.5 py-2 text-xs font-bold text-white shadow-[0_16px_36px_-14px_rgba(0,0,0,.8)] backdrop-blur-md"
      >
        <Zap className="h-3.5 w-3.5" /> {t('m1')}
      </motion.div>

      {/* Suzuvchi natija kartasi 1 (yuqori-chap) */}
      <motion.div
        {...float(5.5, 10)}
        className="absolute -left-4 top-[20%] w-[62%] rounded-2xl border border-white/60 bg-white/95 p-2.5 shadow-2xl"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-teal text-white">
            <Stethoscope className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-3/4 rounded-full bg-navy/80" />
            <div className="mt-1.5 h-2 w-1/2 rounded-full bg-slate2/30" />
          </div>
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand">
            <Star className="h-3 w-3 fill-warning text-warning" />
            4.9
          </span>
        </div>
      </motion.div>

      {/* Suzuvchi natija kartasi 2 (past-o'ng) */}
      <motion.div
        {...float(6.5, 12)}
        className="absolute -right-4 bottom-[16%] w-[58%] rounded-2xl border border-white/60 bg-white/95 p-2.5 shadow-2xl"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet to-brand text-white">
            <UtensilsCrossed className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-2/3 rounded-full bg-navy/80" />
            <div className="mt-1.5 h-2 w-2/5 rounded-full bg-slate2/30" />
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-bold text-success">
            <MapPin className="h-3 w-3" />
            1.2 km
          </span>
        </div>
      </motion.div>

      {/* Live onlayn badge (past-chap) */}
      <motion.div
        {...float(7, 9)}
        className="absolute -left-2 bottom-4 inline-flex items-center gap-2 rounded-2xl border border-teal/40 bg-navy/75 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          {!reduce && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        {t('liveNow')}
      </motion.div>
    </div>
  );
}
