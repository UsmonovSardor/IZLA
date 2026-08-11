'use client';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Hero'dagi aurora bloklari — scroll bo'yicha parallaks (Phase 4).
 * `prefers-reduced-motion` bo'lsa parallaks o'chadi (bloklar joyida qoladi).
 */
export function HeroAurora() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, 140]);
  const y2 = useTransform(scrollY, [0, 600], [0, -90]);
  const y3 = useTransform(scrollY, [0, 600], [0, 70]);

  return (
    <>
      <motion.div
        style={reduce ? undefined : { y: y1 }}
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand/30 blur-3xl animate-aurora-shift"
      />
      <motion.div
        style={reduce ? undefined : { y: y2 }}
        className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-teal/25 blur-3xl animate-float"
      />
      <motion.div
        style={reduce ? undefined : { y: y3 }}
        className="pointer-events-none absolute top-10 right-1/3 h-72 w-72 rounded-full bg-violet/25 blur-3xl animate-aurora-shift"
      />
    </>
  );
}
