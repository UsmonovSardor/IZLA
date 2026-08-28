'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Star, PenLine, X, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { api, type MyReview } from '@/lib/api';

/** "Sharh qoldirish" — yulduzli baho + fikr. Login-gate, bittadan, toast + sahifa yangilash. */
export function ReviewComposer({ vendorId, accent }: { vendorId: string; accent: string }) {
  const t = useTranslations('reviewForm');
  const { user, openLogin } = useAuth();
  const [mine, setMine] = useState<MyReview | null | undefined>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setMine(null); return; }
    let alive = true;
    api.reviewMine(vendorId).then((r) => { if (alive) setMine(r.review); }).catch(() => { if (alive) setMine(null); });
    return () => { alive = false; };
  }, [user, vendorId]);

  if (user && mine) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-slate2">
        <CheckCircle2 size={16} className="text-emerald-500" /> {t('already')}
        <span className="inline-flex items-center gap-0.5 font-semibold text-navy">{mine.rating}<Star size={13} className="fill-warning text-warning" /></span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => (user ? setOpen(true) : openLogin())}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        style={{ background: accent }}
      >
        <PenLine size={16} /> {t('leave')}
      </button>
      <ReviewModal vendorId={vendorId} accent={accent} open={open} onClose={() => setOpen(false)} onDone={(r) => { setMine(r); setOpen(false); }} />
    </>
  );
}

function ReviewModal({ vendorId, accent, open, onClose, onDone }: {
  vendorId: string; accent: string; open: boolean; onClose: () => void; onDone: (r: MyReview) => void;
}) {
  const t = useTranslations('reviewForm');
  const router = useRouter();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setRating(0); setHover(0); setText(''); setErr(null); return; }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const submit = async () => {
    if (rating < 1) { setErr(t('pickRating')); return; }
    setBusy(true); setErr(null);
    try {
      const r = await api.createReview({ vendorId, rating, text: text.trim() || undefined });
      toast({ variant: 'success', title: t('thanks'), description: t('published') });
      onDone({ id: r.id, rating: r.rating, text: r.text, createdAt: r.createdAt });
      router.refresh(); // Yangi sharh + yangilangan reyting ko'rinishi uchun
    } catch (e) {
      const er = e as Error & { status?: number };
      setErr(er.status === 409 ? t('already') : er.message || t('error'));
    } finally { setBusy(false); }
  };

  const active = hover || rating;
  const labels = [t('r1'), t('r2'), t('r3'), t('r4'), t('r5')];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-[#0B1F33]/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-t-2xl border border-line bg-surface p-6 shadow-xl sm:rounded-2xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <button onClick={onClose} aria-label={t('close')} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate2 hover:bg-bg hover:text-ink"><X size={16} /></button>
            <h2 className="font-display text-lg font-bold text-navy">{t('title')}</h2>
            <p className="mt-1 text-sm text-slate2">{t('subtitle')}</p>

            {/* Yulduzlar */}
            <div className="mt-5 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n}`} className="transition-transform hover:scale-110">
                    <Star size={34} className={n <= active ? 'fill-warning text-warning' : 'text-slate-300'} />
                  </button>
                ))}
              </div>
              <span className="h-5 text-sm font-medium text-slate2">{active ? labels[active - 1] : t('tapStar')}</span>
            </div>

            <textarea
              rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
              placeholder={t('placeholder')}
              className="mt-4 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: text ? accent : undefined }}
            />

            {err && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{err}</div>}

            <button onClick={submit} disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" style={{ background: accent }}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {t('submit')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
