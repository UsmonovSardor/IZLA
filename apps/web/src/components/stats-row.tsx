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

/** Hero stat kartalari (Variant A — frosted glass + gradient). Count-up + stagger. */
export function StatsRow({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  return (
    <div ref={ref} className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
      {stats.map((s, i) => {
        const Icon = ICONS[s.iconKey] ?? Sparkles;
        return (
          <motion.div
            key={s.label}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={inView && !reduce ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-2xl p-px transition-transform duration-300 hover:-translate-y-1"
            style={{ background: 'linear-gradient(140deg, rgba(255,255,255,.38), rgba(255,255,255,.05))' }}
          >
            <div className="h-full rounded-[15px] bg-white/[0.07] p-4 backdrop-blur-xl transition-colors duration-300 group-hover:bg-white/[0.11]">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl shadow-lg"
                style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div
                className="mt-3 font-display text-[26px] font-bold leading-none"
                style={{ backgroundImage: s.numGrad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
              >
                <CountUp value={s.value} active={inView} />
              </div>
              <div className="mt-1.5 text-sm text-white/60">{s.label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Raqamning boshidagi sonni 0 dan target'gacha sanaydi (suffix +/% saqlanadi). */
function CountUp({ value, active }: { value: string; active: boolean }) {
  const reduce = useReducedMotion();
  const match = value.match(/^(\d+)([+%]?)$/);
  const [display, setDisplay] = useState(() => (match && !reduce ? `0${match[2]}` : value));

  useEffect(() => {
    if (!match || reduce || !active) {
      setDisplay(value);
      return;
    }
    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(`${Math.round(target * eased)}${suffix}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value, reduce, match]);

  return <>{display}</>;
}
