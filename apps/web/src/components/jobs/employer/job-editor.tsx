'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Loader2, Check, Plus } from 'lucide-react';
import { api, type EmployerJob, type EmployerJobInput, type JobEmployment, type JobExperience, type JobStatusValue } from '@/lib/api';

const EMPLOYMENTS: JobEmployment[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'];
const EXPERIENCES: JobExperience[] = ['NONE', 'JUNIOR', 'MIDDLE', 'SENIOR'];
const STATUSES: JobStatusValue[] = ['ACTIVE', 'DRAFT', 'CLOSED'];

const field = 'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none';
const lbl = 'text-sm font-medium text-navy';

export function JobEditor({ companyId, job, open, onClose, onSaved }: {
  companyId: string; job: EmployerJob | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const t = useTranslations('ishKabinet');
  const ti = useTranslations('ish');
  const reduce = useReducedMotion();
  const [f, setF] = useState<EmployerJobInput>(blank());
  const [skillInput, setSkillInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null); setSkillInput('');
    setF(job ? {
      title: job.title, description: job.description, employment: job.employment, remote: job.remote,
      region: job.region ?? '', experience: job.experience, salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined, currency: job.currency, skills: job.skills,
      category: job.category ?? '', status: job.status === 'ARCHIVED' ? 'CLOSED' : job.status,
    } : blank());
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, job, onClose]);

  const patch = (p: Partial<EmployerJobInput>) => setF((s) => ({ ...s, ...p }));
  const addSkill = () => {
    const v = skillInput.trim();
    const skills = f.skills ?? [];
    if (!v || skills.includes(v) || skills.length >= 30) { setSkillInput(''); return; }
    patch({ skills: [...skills, v] }); setSkillInput('');
  };

  const save = async () => {
    if (!f.title.trim() || !f.description.trim()) { setErr(t('jobRequired')); return; }
    setBusy(true); setErr(null);
    try {
      const body: EmployerJobInput = {
        ...f,
        region: f.region?.trim() || undefined,
        category: f.category?.trim() || undefined,
        salaryMin: f.salaryMin ? Number(f.salaryMin) : undefined,
        salaryMax: f.salaryMax ? Number(f.salaryMax) : undefined,
      };
      if (job) await api.employerUpdateJob(job.id, body);
      else await api.employerCreateJob(companyId, body);
      onSaved();
    } catch (e) {
      setErr((e as Error).message || t('saveError'));
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-[#0B1F33]/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl border border-line bg-surface sm:rounded-2xl"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-display text-lg font-bold text-navy">{job ? t('editJob') : t('newJob')}</h2>
              <button onClick={onClose} aria-label={ti('close')} className="grid h-8 w-8 place-items-center rounded-full text-slate2 hover:bg-bg hover:text-ink"><X size={16} /></button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div><label className={lbl}>{t('jobTitle')} <span className="text-rose-500">*</span></label>
                <input className={`${field} mt-1.5`} value={f.title} onChange={(e) => patch({ title: e.target.value })} placeholder={t('jobTitlePlaceholder')} /></div>
              <div><label className={lbl}>{t('jobDescription')} <span className="text-rose-500">*</span></label>
                <textarea rows={5} className={`${field} mt-1.5 resize-none`} value={f.description} onChange={(e) => patch({ description: e.target.value })} placeholder={t('jobDescriptionPlaceholder')} /></div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={lbl}>{ti('employment')}</label>
                  <select className={`${field} mt-1.5`} value={f.employment} onChange={(e) => patch({ employment: e.target.value as JobEmployment })}>
                    {EMPLOYMENTS.map((v) => <option key={v} value={v}>{ti(`emp.${v}`)}</option>)}
                  </select></div>
                <div><label className={lbl}>{ti('experience')}</label>
                  <select className={`${field} mt-1.5`} value={f.experience} onChange={(e) => patch({ experience: e.target.value as JobExperience })}>
                    {EXPERIENCES.map((v) => <option key={v} value={v}>{ti(`exp.${v}`)}</option>)}
                  </select></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={lbl}>{t('region')}</label>
                  <input className={`${field} mt-1.5`} value={f.region ?? ''} onChange={(e) => patch({ region: e.target.value })} placeholder="Toshkent" /></div>
                <div><label className={lbl}>{t('category')}</label>
                  <input className={`${field} mt-1.5`} value={f.category ?? ''} onChange={(e) => patch({ category: e.target.value })} placeholder="IT" /></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={lbl}>{t('salaryMin')}</label>
                  <input type="number" className={`${field} mt-1.5`} value={f.salaryMin ?? ''} onChange={(e) => patch({ salaryMin: e.target.value ? Number(e.target.value) : undefined })} placeholder="5000000" /></div>
                <div><label className={lbl}>{t('salaryMax')}</label>
                  <input type="number" className={`${field} mt-1.5`} value={f.salaryMax ?? ''} onChange={(e) => patch({ salaryMax: e.target.value ? Number(e.target.value) : undefined })} placeholder="9000000" /></div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={f.remote ?? false} onChange={(e) => patch({ remote: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm text-navy">{t('remoteJob')}</span>
              </label>

              <div>
                <label className={lbl}>{ti('skills')}</label>
                <div className="mt-1.5 flex gap-2">
                  <input className={field} value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); } }} placeholder="React, SQL..." />
                  <button onClick={addSkill} className="flex-none rounded-xl bg-violet-600 px-3.5 text-white transition hover:bg-violet-700"><Plus size={16} /></button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(f.skills ?? []).map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                      {s}<button onClick={() => patch({ skills: (f.skills ?? []).filter((x) => x !== s) })} className="text-violet-400 hover:text-violet-700"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div><label className={lbl}>{t('status')}</label>
                <select className={`${field} mt-1.5`} value={f.status} onChange={(e) => patch({ status: e.target.value as JobStatusValue })}>
                  {STATUSES.map((v) => <option key={v} value={v}>{t(`jobStatus.${v}`)}</option>)}
                </select></div>

              {err && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{err}</div>}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate2 transition hover:text-navy">{t('cancel')}</button>
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {t('save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function blank(): EmployerJobInput {
  return {
    title: '', description: '', employment: 'FULL_TIME', remote: false, region: '',
    experience: 'JUNIOR', currency: 'UZS', skills: [], category: '', status: 'ACTIVE',
  };
}
