'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Send, Check, Loader2, X, FileText, FilePlus2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { api, type ApplicationStatusValue, type Resume } from '@/lib/api';

/** Vakansiyaga real ariza topshirish oqimi: login-gate → qisqa xat + rezyume → yuborish.
 * Foydalanuvchi allaqachon topshirgan bo'lsa — holatni ko'rsatadi (qayta yubormaydi). */
export function ApplyButton({ jobId, block = false }: { jobId: string; block?: boolean }) {
  const t = useTranslations('ish');
  const { user, openLogin } = useAuth();
  const [applied, setApplied] = useState<ApplicationStatusValue | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);

  // Kirgan foydalanuvchi uchun — avval topshirilganmi tekshiramiz.
  useEffect(() => {
    let alive = true;
    if (!user) { setApplied(null); setChecked(false); return; }
    api.jobApplicationStatus(jobId)
      .then((r) => { if (alive) { setApplied(r.applied ? r.application!.status : null); setChecked(true); } })
      .catch(() => { if (alive) setChecked(true); });
    return () => { alive = false; };
  }, [user, jobId]);

  const onClick = () => {
    if (!user) { openLogin(); return; }
    setOpen(true);
  };

  if (user && applied) {
    return (
      <span className={`inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 ${block ? 'w-full' : ''}`}>
        <Check size={16} /> {t('applied')}
        <span className="rounded-md bg-surface/70 px-1.5 py-0.5 text-xs font-medium">{t(`appStatus.${applied}`)}</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={onClick}
        disabled={Boolean(user) && !checked}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60 ${block ? 'w-full' : ''}`}
      >
        {user && !checked ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {t('apply')}
      </button>
      <ApplyModal
        jobId={jobId}
        open={open}
        onClose={() => setOpen(false)}
        onDone={(status) => { setApplied(status); setOpen(false); }}
      />
    </>
  );
}

function ApplyModal({ jobId, open, onClose, onDone }: {
  jobId: string; open: boolean; onClose: () => void; onDone: (s: ApplicationStatusValue) => void;
}) {
  const t = useTranslations('ish');
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [note, setNote] = useState('');
  const [resume, setResume] = useState<Resume | null | undefined>(undefined); // undefined=yuklanmoqda
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setResume(undefined);
    api.resumeMe().then((r) => setResume(r)).catch(() => setResume(null));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api.applyJob(jobId, note.trim() || undefined);
      toast({ variant: 'success', title: t('applied'), description: t('applySub') });
      onDone(r.status);
    } catch (e) {
      const err = e as Error & { status?: number };
      setError(err.status === 409 ? t('alreadyApplied') : err.message || t('applyError'));
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-[#0B1F33]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-t-2xl border border-line bg-surface p-6 shadow-xl sm:rounded-2xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <button onClick={onClose} aria-label={t('close')} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-bg hover:text-ink">
              <X size={16} />
            </button>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-brand text-white">
              <Send size={18} />
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-navy">{t('applyTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('applySub')}</p>

            {/* Rezyume holati */}
            <div className="mt-4">
              {resume === undefined ? (
                <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3.5 py-3 text-sm text-muted">
                  <Loader2 size={15} className="animate-spin" /> {t('resumeChecking')}
                </div>
              ) : resume ? (
                <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/60 px-3.5 py-3">
                  <FileText size={18} className="flex-none text-violet-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-navy">{t('resumeAttached')}</div>
                    <div className="truncate text-xs text-muted">{resume.headline}</div>
                  </div>
                  <Link href="/rezyume" className="flex-none text-xs font-medium text-violet-700 hover:underline">{t('edit')}</Link>
                </div>
              ) : (
                <Link href="/rezyume" className="flex items-center gap-3 rounded-xl border border-dashed border-violet-300 bg-violet-50/40 px-3.5 py-3 transition hover:bg-violet-50">
                  <FilePlus2 size={18} className="flex-none text-violet-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-navy">{t('resumeCreate')}</div>
                    <div className="text-xs text-muted">{t('resumeCreateHint')}</div>
                  </div>
                </Link>
              )}
            </div>

            {/* Qisqa xat */}
            <div className="mt-4">
              <label className="text-sm text-muted">{t('coverNote')}</label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1500}
                placeholder={t('coverNotePlaceholder')}
                className="mt-1 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {t('applySubmit')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
