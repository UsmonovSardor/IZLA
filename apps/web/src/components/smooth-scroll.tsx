'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Lenis silliq scroll (Phase 4). Butun oyna scroll'iga inertsiya beradi.
 * `prefers-reduced-motion` bo'lsa umuman ishga tushmaydi (nativ scroll qoladi).
 * Ichki scroll konteynerlar `data-lenis-prevent` bilan chetlab o'tiladi.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
