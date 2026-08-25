'use client';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Reveal } from '@/components/reveal';

/** Foto galereya — mozaik to'r + lightbox. */
export function Gallery({ heading, subheading, photos, accent }: { heading: string; subheading?: string; photos: string[]; accent: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const move = useCallback((d: number) => setOpen((v) => (v == null ? v : (v + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, move]);

  if (photos.length < 2) return null;

  return (
    <section>
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{subheading}</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((src, i) => (
          <Reveal key={i} delay={i * 60}>
            <button
              onClick={() => setOpen(i)}
              className={`group relative block w-full overflow-hidden rounded-2xl ${i % 5 === 0 ? 'aspect-[4/5]' : 'aspect-square'}`}
            >
              <Image src={src} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width:640px) 45vw, 22vw" />
              <span className="absolute inset-0 bg-navy/0 transition group-hover:bg-navy/15" />
            </button>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {open != null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
          >
            <button onClick={close} aria-label="close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); move(-1); }} aria-label="prev" className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <motion.div
              key={open}
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              className="relative h-[80vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={photos[open]!} alt="" fill className="object-contain" sizes="90vw" />
            </motion.div>
            <button onClick={(e) => { e.stopPropagation(); move(1); }} aria-label="next" className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <ChevronRight className="h-7 w-7" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
