'use client';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, MapPin, Phone, Star, CalendarCheck } from 'lucide-react';

interface Props {
  name: string;
  tagline?: string;
  categoryName?: string;
  categoryIcon?: string;
  district?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  image: string;
  phone?: string;
  established?: number;
  accent: string;
  labels: {
    book: string;
    call: string;
    basedOn: string; // "{count} sharh asosida"
    established: string; // "{year}-yildan"
    verified: string;
  };
}

/** Dentaire uslubidagi boy hero — bizning navy/brand palitrada, framer animatsiya bilan. */
export function VendorHero(p: Props) {
  const reduce = useReducedMotion();
  const float = reduce
    ? {}
    : { animate: { y: [0, -10, 0] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[var(--soft)] to-white px-6 py-10 sm:px-10 sm:py-14"
      style={{ ['--accent' as string]: p.accent, ['--soft' as string]: p.accent + '14' }}
    >
      {/* Yumshoq urg'u nuri (dekorativ, no'noq shakllarsiz) */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${p.accent}33, transparent 70%)` }}
      />

      <div className="relative grid items-center gap-8 md:grid-cols-2">
        {/* Chap: matn */}
        <div>
          {p.categoryName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent)] shadow-sm ring-1 ring-line">
              {p.categoryIcon && <span>{p.categoryIcon}</span>}
              {p.categoryName}
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-navy sm:text-4xl lg:text-5xl">
            {p.name}
          </h1>
          {p.tagline && <p className="mt-3 max-w-md text-base text-slate2">{p.tagline}</p>}

          {/* Reyting qatori */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(p.rating) ? 'fill-amber-400 text-amber-400' : 'text-line'}`} />
                ))}
              </span>
              <span className="font-bold text-navy">{p.rating.toFixed(1)}</span>
              <span className="text-slate2">{p.labels.basedOn.replace('{count}', String(p.reviewCount))}</span>
            </span>
            {p.district && (
              <span className="flex items-center gap-1 text-slate2">
                <MapPin className="h-4 w-4" style={{ color: p.accent }} />
                {p.district}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#booking"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: p.accent, boxShadow: `0 10px 24px -8px ${p.accent}` }}
            >
              <CalendarCheck className="h-4 w-4" />
              {p.labels.book}
            </a>
            {p.phone && (
              <a
                href={`tel:${p.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Phone className="h-4 w-4" />
                {p.labels.call}
              </a>
            )}
          </div>
        </div>

        {/* O'ng: rasm + suzuvchi kartalar */}
        <div className="relative mx-auto w-full max-w-md">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl ring-1 ring-line"
          >
            <Image src={p.image} alt={p.name} fill className="object-cover" sizes="(max-width:768px) 90vw, 40vw" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/25 to-transparent" />
          </motion.div>

          {/* Reyting kartasi (yuqori o'ng) */}
          <motion.div {...float} className="absolute -right-3 top-8 rounded-2xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-line backdrop-blur">
            <div className="flex items-center gap-1 text-amber-400">
              {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3 fill-current" />)}
            </div>
            <div className="mt-1 text-lg font-extrabold leading-none text-navy">{p.rating.toFixed(1)}</div>
            <div className="text-[11px] text-slate2">{p.labels.basedOn.replace('{count}', String(p.reviewCount))}</div>
          </motion.div>

          {/* Tasdiqlangan / tashkil etilgan (pastki chap) */}
          {(p.verified || p.established) && (
            <motion.div
              {...(reduce ? {} : { animate: { y: [0, 8, 0] }, transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const } })}
              className="absolute -left-3 bottom-10 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-line backdrop-blur"
            >
              <BadgeCheck className="h-6 w-6" style={{ color: p.accent }} />
              <div className="text-xs">
                {p.verified && <div className="font-semibold text-navy">{p.labels.verified}</div>}
                {p.established && <div className="text-slate2">{p.labels.established.replace('{year}', String(p.established))}</div>}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
