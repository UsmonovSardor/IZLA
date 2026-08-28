'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { Dumbbell, MapPin, Scissors, Star, Stethoscope, UtensilsCrossed } from 'lucide-react';

const PINS = [
  { x: '20%', y: '26%', c: '#14B8A6', Icon: Stethoscope, delay: 0 },
  { x: '68%', y: '18%', c: '#2563EB', Icon: Scissors, delay: 0.7 },
  { x: '34%', y: '66%', c: '#7c3aed', Icon: UtensilsCrossed, delay: 1.2 },
  { x: '78%', y: '60%', c: '#f59e0b', Icon: Dumbbell, delay: 0.4 },
];

/** Hero o'ng tomonidagi jonli "live map" vizuali — pulslanuvchi pinlar +
 *  suzuvchi natija kartalari. Kod bilan yasalgan (tashqi asset shart emas). */
export function HeroVisual() {
  const reduce = useReducedMotion();
  const float = (dur: number, amp = 10) =>
    reduce ? undefined : { animate: { y: [0, -amp, 0] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <div className="relative mx-auto aspect-[4/4.3] w-full max-w-md">
      {/* Shisha xarita paneli */}
      <div className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/15 bg-surface/[0.06] shadow-[0_40px_90px_-25px_rgba(0,0,0,.65)] backdrop-blur-xl">
        {/* Xarita to'ri */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.14]" aria-hidden>
          <defs>
            <pattern id="hm-grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hm-grid)" />
        </svg>
        {/* Ichki aurora yog'du */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-0 h-52 w-52 rounded-full bg-teal/30 blur-3xl" />

        {/* Pinlar */}
        {PINS.map((p, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
            {!reduce && (
              <motion.span
                className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: p.c }}
                animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: p.delay }}
              />
            )}
            <div className="relative grid h-9 w-9 place-items-center rounded-full shadow-lg ring-2 ring-white/25" style={{ background: p.c }}>
              <p.Icon className="h-[18px] w-[18px] text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Suzuvchi natija kartasi 1 */}
      <motion.div
        {...float(5.5)}
        className="absolute -left-4 top-[16%] w-[64%] rounded-2xl border border-white/60 bg-surface/95 p-3 shadow-2xl sm:-left-6"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-teal text-white">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-3/4 rounded-full bg-[#0B1F33]/80" />
            <div className="mt-1.5 h-2 w-1/2 rounded-full bg-muted/30" />
          </div>
          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand">
            <Star className="h-3 w-3 fill-warning text-warning" />4.9
          </span>
        </div>
      </motion.div>

      {/* Suzuvchi natija kartasi 2 */}
      <motion.div
        {...float(6.5, 12)}
        className="absolute -right-3 bottom-[12%] w-[58%] rounded-2xl border border-white/60 bg-surface/95 p-3 shadow-2xl sm:-right-5"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet to-brand text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-2/3 rounded-full bg-[#0B1F33]/80" />
            <div className="mt-1.5 h-2 w-2/5 rounded-full bg-muted/30" />
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-bold text-success">
            <MapPin className="h-3 w-3" />1.2 km
          </span>
        </div>
      </motion.div>
    </div>
  );
}
