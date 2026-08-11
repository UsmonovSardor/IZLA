'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Clock, MapPin, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  pin: MapPin,
  sparkles: Sparkles,
  shield: ShieldCheck,
  clock: Clock,
};

export type Stat = {
  iconKey: string;
  value: string;
  label: string;
  from: string;
  to: string;
  numGrad: string;
};

/** Hero stat kartalari (Variant 1 — ixcham horizontal, ochiq shisha). Count-up + stagger. */
export function StatsRow({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
      {stats.map((s, i) => {
        const Icon = ICONS[s.iconKey] ?? Sparkles;
        return (
          <motion.div
            key={s.label}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={inView && !reduce ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.13] px-3.5 py-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.18]"
          >
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-md"
              style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
            >
              <Icon className="h-[18px] w-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-[22px] font-bold leading-none text-white">
                <CountUp value={s.value} active={inView} />
              </div>
              <div className="mt-1 text-[13px] leading-tight text-white/70">{s.label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const NUM_RE = /^(\d+)([+%]?)$/;

/** Raqamning boshidagi sonni 0 dan target'gacha sanaydi (suffix +/% saqlanadi). */
function CountUp({ value, active }: { value: string; active: boolean }) {
  const reduce = useReducedMotion();
  // Initial holat DETERMINISTIK (server=klient) — hidratsiya mos kelishi uchun.
  const [display, setDisplay] = useState(() => {
    const m = value.match(NUM_RE);
    return m ? `0${m[2]}` : value;
  });

  // DIQQAT: `match`ni deps'ga QO'YMASLIK kerak — u har render'da yangi obyekt,
  // effektni qayta ishga tushirib animatsiyani 0'da qotiradi. value yetarli.
  useEffect(() => {
    const m = value.match(NUM_RE);
    if (!m || reduce || !active) {
      setDisplay(value);
      return;
    }
    const target = parseInt(m[1], 10);
    const suffix = m[2];
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      if (p < 1) {
        setDisplay(`${Math.round(target * eased)}${suffix}`);
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value, reduce]);

  return <>{display}</>;
}
