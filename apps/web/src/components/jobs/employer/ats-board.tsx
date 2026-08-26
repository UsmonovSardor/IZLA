'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, Phone, Mail, ChevronDown, ChevronRight, FileText, Sparkles, Users2,
} from 'lucide-react';
import { api, type AtsApplication, type ApplicationStatusValue, type EmployerJob } from '@/lib/api';

const PIPELINE: ApplicationStatusValue[] = ['NEW', 'VIEWED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const STATUS_STYLE: Record<ApplicationStatusValue, string> = {
  NEW: 'bg-slate-100 text-slate-600 border-slate-200',
  VIEWED: 'bg-blue-50 text-brand border-blue-200',
  INTERVIEW: 'bg-violet-50 text-violet-700 border-violet-200',
  OFFER: 'bg-amber-50 text-amber-700 border-amber-200',
  HIRED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-200',
};

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function AtsBoard({ job, onBack }: { job: EmployerJob; onBack: () => void }) {
  const t = useTranslations('ishKabinet');
  const locale = useLocale();
  const [items, setItems] = useState<AtsApplication[] | null>(null);
  const [filter, setFilter] = useState<ApplicationStatusValue | 'ALL'>('ALL');

  useEffect(() => {
    api.employerJobApplications(job.id).then(setItems).catch(() => setItems([]));
  }, [job.id]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (items ?? []).forEach((a) => { c[a.status] = (c[a.status] ?? 0) + 1; });
    return c;
  }, [items]);

  const setStatus = async (id: string, status: ApplicationStatusValue) => {
    setItems((prev) => prev?.map((a) => (a.id === id ? { ...a, status } : a)) ?? prev);
    try { await api.employerUpdateApplication(id, status); } catch { /* revert emas — keyingi load tuzatadi */ }
  };

  const visible = (items ?? []).filter((a) => filter === 'ALL' || a.status === filter);
  const dtf = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate2 transition hover:text-violet-700">
        <ArrowLeft size={16} /> {t('backToJobs')}
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold text-navy">{job.title}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"><Users2 size={13} /> {t('applicantsN', { count: items?.length ?? 0 })}</span>
      </div>

      {/* Pipeline filtr */}
      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip label={t('allStage')} active={filter === 'ALL'} count={items?.length ?? 0} onClick={() => setFilter('ALL')} />
        {PIPELINE.map((s) => (
          <FilterChip key={s} label={t(`appStatus.${s}`)} active={filter === s} count={counts[s] ?? 0} onClick={() => setFilter(s)} />
        ))}
      </div>

      {items === null ? (
        <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" /></div>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line py-16 text-center">
          <Users2 className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 text-slate2">{t('noApplicants')}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((a) => (
              <ApplicantCard key={a.id} app={a} t={t} date={dtf.format(new Date(a.createdAt))} onStatus={(s) => setStatus(a.id, s)} statusStyle={STATUS_STYLE} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, count, onClick }: { label: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${active ? 'border-violet-600 bg-violet-600 text-white' : 'border-line bg-white text-slate2 hover:border-violet-200'}`}>
      {label}<span className={`rounded-full px-1.5 text-xs ${active ? 'bg-white/25' : 'bg-bg text-slate-400'}`}>{count}</span>
    </button>
  );
}

function ApplicantCard({ app, t, date, onStatus, statusStyle }: {
  app: AtsApplication; t: (k: string, v?: Record<string, string | number>) => string; date: string;
  onStatus: (s: ApplicationStatusValue) => void; statusStyle: Record<ApplicationStatusValue, string>;
}) {
  const [open, setOpen] = useState(false);
  const r = app.resume;
  const name = app.applicant.name || t('unnamed');

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start gap-3.5">
        {app.applicant.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.applicant.avatarUrl} alt="" className="h-12 w-12 flex-none rounded-xl object-cover" />
        ) : (
          <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-brand text-sm font-bold text-white">{initials(app.applicant.name)}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display font-semibold text-navy">{name}</div>
              {r?.headline && <div className="truncate text-sm text-slate2">{r.headline}</div>}
            </div>
            {app.aiScore != null && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-violet-50 to-brand-50 px-2 py-1 text-xs font-semibold text-violet-700"><Sparkles size={12} /> {app.aiScore}%</span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate2">
            {app.applicant.phone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {app.applicant.phone}</span>}
            {app.applicant.email && <span className="inline-flex items-center gap-1"><Mail size={12} /> {app.applicant.email}</span>}
            <span className="text-slate-400">{date}</span>
          </div>
        </div>
      </div>

      {app.coverNote && <p className="mt-3 rounded-xl bg-bg px-3.5 py-2.5 text-sm text-slate-600">{app.coverNote}</p>}

      {/* Rezyume ochish */}
      {r && (
        <div className="mt-3">
          <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:underline">
            <FileText size={15} /> {t('viewResume')} {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-3 space-y-4 rounded-xl border border-line bg-bg/50 p-4 text-sm">
                  {r.summary && <p className="text-slate-600">{r.summary}</p>}
                  {r.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.skills.map((s) => <span key={s} className="rounded-md border border-line bg-white px-2 py-0.5 text-xs text-navy">{s}</span>)}
                    </div>
                  )}
                  {r.experience.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('experienceLbl')}</div>
                      <div className="mt-2 space-y-2">
                        {r.experience.map((e, i) => (
                          <div key={i} className="border-l-2 border-violet-200 pl-3">
                            <div className="font-medium text-navy">{e.title} · {e.company}</div>
                            {(e.from || e.to) && <div className="text-xs text-slate-400">{e.from} — {e.to || t('present')}</div>}
                            {e.desc && <div className="text-xs text-slate-600">{e.desc}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.education.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('educationLbl')}</div>
                      <div className="mt-2 space-y-1">
                        {r.education.map((e, i) => (
                          <div key={i} className="text-navy">{e.degree} · {e.school}{e.year ? ` (${e.year})` : ''}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Status pipeline selector */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <span className="text-xs text-slate-400">{t('moveTo')}</span>
        {PIPELINE.map((s) => (
          <button
            key={s}
            onClick={() => onStatus(s)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${app.status === s ? statusStyle[s] : 'border-line bg-white text-slate-400 hover:border-slate-300 hover:text-slate2'}`}
          >
            {t(`appStatus.${s}`)}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
