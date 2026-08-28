'use client';
import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Quote, Star, ArrowLeft, ArrowRight, BadgeCheck } from 'lucide-react';

interface Review {
  id: string; rating: number; text?: string; bookingId?: string | null;
  photos?: string[]; user?: { name?: string; avatarUrl?: string | null };
}

/** Sharhlar karuseli — katta iqtibos + muallif + reyting kartasi (Dentaire uslubi). */
export function Testimonials({
  heading, subheading, reviews, accent, anonLabel, ratingLabel, verifiedLabel,
}: {
  heading?: string; subheading?: string; reviews: Review[]; accent: string; anonLabel: string; ratingLabel: string; verifiedLabel?: string;
}) {
  const withText = reviews.filter((r) => r.text);
  const [i, setI] = useState(0);
  if (!withText.length) return null;
  const r = withText[i % withText.length]!;
  const go = (d: number) => setI((v) => (v + d + withText.length) % withText.length);
  const avg = (reviews.reduce((s, x) => s + x.rating, 0) / reviews.length).toFixed(1);
  const photo = withText.find((x) => x.photos?.length)?.photos?.[0]
    ?? 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80&auto=format&fit=crop';

  return (
    <section>
      {heading && (
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{subheading}</span>
          <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>
        </div>
      )}

      <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
        {/* Rasm + reyting kartasi */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative aspect-square overflow-hidden rounded-3xl shadow-xl ring-1 ring-line">
            <Image src={photo} alt="" fill className="object-cover" sizes="(max-width:1024px) 90vw, 40vw" />
          </div>
          <div className="absolute -bottom-4 left-4 right-8 rounded-2xl p-4 text-white shadow-lg" style={{ backgroundColor: accent }}>
            <div className="flex items-end gap-2">
              <span className="font-display text-3xl font-extrabold leading-none">{avg}</span>
              <span className="pb-1 text-sm opacity-90">/ 5</span>
              <span className="pb-1 pl-2 text-xs opacity-90">{ratingLabel}</span>
            </div>
            <div className="mt-1 flex gap-0.5">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s < Math.round(+avg) ? 'fill-white text-white' : 'text-white/40'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Iqtibos */}
        <div>
          <Quote className="h-10 w-10" style={{ color: accent }} />
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="mt-3 text-lg leading-relaxed text-ink"
            >
              “{r.text}”
            </motion.blockquote>
          </AnimatePresence>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-line font-semibold text-navy">
              {r.user?.avatarUrl
                ? <Image src={r.user.avatarUrl} alt="" width={44} height={44} className="h-full w-full object-cover" />
                : (r.user?.name ?? anonLabel).charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-navy">{r.user?.name ?? anonLabel}</span>
                {r.bookingId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> {verifiedLabel ?? 'Tasdiqlangan tashrif'}
                  </span>
                )}
              </div>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s < r.rating ? 'fill-amber-400 text-amber-400' : 'text-line'}`} />
                ))}
              </div>
            </div>
          </div>

          {withText.length > 1 && (
            <div className="mt-6 flex gap-2">
              <button onClick={() => go(-1)} aria-label="prev" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-navy transition hover:bg-bg">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button onClick={() => go(1)} aria-label="next" className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition" style={{ backgroundColor: accent }}>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
