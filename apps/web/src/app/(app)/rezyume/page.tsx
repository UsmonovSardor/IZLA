'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  User, Sparkles, Briefcase, GraduationCap, Check, Loader2, Plus, Trash2,
  ArrowRight, ArrowLeft, FileText, X, PartyPopper,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { api, type Resume, type ResumeExperience, type ResumeEducation } from '@/lib/api';

type StepKey = 'basics' | 'skills' | 'experience' | 'education';
const STEPS: { key: StepKey; icon: typeof User }[] = [
  { key: 'basics', icon: User },
  { key: 'skills', icon: Sparkles },
  { key: 'experience', icon: Briefcase },
  { key: 'education', icon: GraduationCap },
];

interface Form {
  headline: string; summary: string; experienceYears: string; phone: string; email: string;
  skills: string[]; experience: ResumeExperience[]; education: ResumeEducation[];
}
const EMPTY: Form = {
  headline: '', summary: '', experienceYears: '', phone: '', email: '',
  skills: [], experience: [], education: [],
};

export default function ResumePage() {
  const t = useTranslations('rezyume');
  const { user, loading, openLogin } = useAuth();
  const reduce = useReducedMotion();

  const [form, setForm] = useState<Form>(EMPTY);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [existed, setExisted] = useState(false);

  useEffect(() => {
    if (!user) return;
    setReady(false);
    api.resumeMe().then((r: Resume | null) => {
      if (r) {
        setExisted(true);
        setForm({
          headline: r.headline ?? '', summary: r.summary ?? '',
          experienceYears: r.experienceYears ? String(r.experienceYears) : '',
          phone: r.phone ?? '', email: r.email ?? '',
          skills: r.skills ?? [], experience: r.experience ?? [], education: r.education ?? [],
        });
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, [user]);

  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));
  const go = (to: number) => { setDir(to > step ? 1 : -1); setStep(to); };

  const save = async () => {
    if (!form.headline.trim()) { go(0); return; }
    setSaving(true);
    try {
      await api.saveResume({
        headline: form.headline.trim(),
        summary: form.summary.trim() || undefined,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        skills: form.skills,
        experience: form.experience.filter((e) => e.title.trim() && e.company.trim()),
        education: form.education.filter((e) => e.degree.trim() && e.school.trim()),
      });
      setExisted(true);
      setDone(true);
    } finally { setSaving(false); }
  };

  if (loading || (user && !ready)) {
    return <div className="py-24 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" /></div>;
  }
  if (!user) {
    return (
      <div className="py-24 text-center">
        <FileText className="mx-auto text-slate-300" size={44} />
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">{t('title')}</h1>
        <p className="mt-2 text-slate2">{t('loginNeeded')}</p>
        <button onClick={() => openLogin()} className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">{t('login')}</button>
      </div>
    );
  }
  if (done) return <DoneScreen t={t} existed={existed} onEdit={() => { setDone(false); go(0); }} />;

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="container-wide py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-slate2">{existed ? t('subtitleEdit') : t('subtitle')}</p>
          </div>
          <button onClick={save} disabled={saving} className="hidden shrink-0 items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60 sm:inline-flex">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {t('save')}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step; const passed = i < step;
              return (
                <button key={s.key} onClick={() => go(i)} className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className={`grid h-10 w-10 place-items-center rounded-full border-2 transition ${active ? 'border-violet-600 bg-violet-600 text-white' : passed ? 'border-violet-600 bg-violet-50 text-violet-600' : 'border-slate-200 bg-white text-slate-400'}`}>
                    {passed ? <Check size={17} /> : <Icon size={17} />}
                  </span>
                  <span className={`hidden text-xs font-medium sm:block ${active ? 'text-navy' : 'text-slate-400'}`}>{t(`steps.${s.key}`)}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-brand" animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
          </div>
        </div>

        {/* Step body */}
        <div className="relative mt-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {step === 0 && <BasicsStep t={t} form={form} patch={patch} />}
              {step === 1 && <SkillsStep t={t} form={form} patch={patch} />}
              {step === 2 && <ExperienceStep t={t} form={form} patch={patch} />}
              {step === 3 && <EducationStep t={t} form={form} patch={patch} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
          <button onClick={() => go(step - 1)} disabled={step === 0} className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate2 transition hover:text-navy disabled:opacity-40">
            <ArrowLeft size={16} /> {t('back')}
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => go(step + 1)} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
              {t('next')} <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {t('finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type TFn = (k: string, v?: Record<string, string | number>) => string;
const field = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none';
const lbl = 'text-sm font-medium text-navy';

function BasicsStep({ t, form, patch }: { t: TFn; form: Form; patch: (p: Partial<Form>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={lbl}>{t('headline')} <span className="text-rose-500">*</span></label>
        <input className={`${field} mt-1.5`} value={form.headline} onChange={(e) => patch({ headline: e.target.value })} placeholder={t('headlinePlaceholder')} />
      </div>
      <div>
        <label className={lbl}>{t('summary')}</label>
        <textarea rows={4} className={`${field} mt-1.5 resize-none`} value={form.summary} onChange={(e) => patch({ summary: e.target.value })} placeholder={t('summaryPlaceholder')} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={lbl}>{t('years')}</label>
          <input type="number" min={0} max={60} className={`${field} mt-1.5`} value={form.experienceYears} onChange={(e) => patch({ experienceYears: e.target.value })} placeholder="3" />
        </div>
        <div>
          <label className={lbl}>{t('phone')}</label>
          <input className={`${field} mt-1.5`} value={form.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="+998 90 123 45 67" />
        </div>
        <div>
          <label className={lbl}>{t('email')}</label>
          <input className={`${field} mt-1.5`} value={form.email} onChange={(e) => patch({ email: e.target.value })} placeholder="siz@mail.uz" />
        </div>
      </div>
    </div>
  );
}

function SkillsStep({ t, form, patch }: { t: TFn; form: Form; patch: (p: Partial<Form>) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v || form.skills.includes(v) || form.skills.length >= 40) { setInput(''); return; }
    patch({ skills: [...form.skills, v] });
    setInput('');
  };
  const remove = (s: string) => patch({ skills: form.skills.filter((x) => x !== s) });
  return (
    <div>
      <label className={lbl}>{t('skills')}</label>
      <p className="mt-1 text-sm text-slate2">{t('skillsHint')}</p>
      <div className="mt-3 flex gap-2">
        <input
          className={field}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder={t('skillsPlaceholder')}
        />
        <button onClick={add} className="inline-flex flex-none items-center gap-1 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700"><Plus size={16} /></button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {form.skills.map((s) => (
            <motion.span
              key={s}
              layout
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700"
            >
              {s}
              <button onClick={() => remove(s)} className="text-violet-400 hover:text-violet-700" aria-label={t('remove')}><X size={13} /></button>
            </motion.span>
          ))}
        </AnimatePresence>
        {form.skills.length === 0 && <span className="text-sm text-slate-400">{t('skillsEmpty')}</span>}
      </div>
    </div>
  );
}

function ExperienceStep({ t, form, patch }: { t: TFn; form: Form; patch: (p: Partial<Form>) => void }) {
  const items = form.experience;
  const update = (i: number, p: Partial<ResumeExperience>) => patch({ experience: items.map((it, k) => (k === i ? { ...it, ...p } : it)) });
  const add = () => patch({ experience: [...items, { title: '', company: '', from: '', to: '', desc: '' }] });
  const remove = (i: number) => patch({ experience: items.filter((_, k) => k !== i) });
  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {items.map((it, i) => (
          <motion.div key={i} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-violet-600">{t('expEntry', { n: i + 1 })}</span>
              <button onClick={() => remove(i)} className="text-slate-400 hover:text-rose-500" aria-label={t('remove')}><Trash2 size={16} /></button>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <input className={field} value={it.title} onChange={(e) => update(i, { title: e.target.value })} placeholder={t('expTitle')} />
              <input className={field} value={it.company} onChange={(e) => update(i, { company: e.target.value })} placeholder={t('expCompany')} />
              <input className={field} value={it.from ?? ''} onChange={(e) => update(i, { from: e.target.value })} placeholder={t('expFrom')} />
              <input className={field} value={it.to ?? ''} onChange={(e) => update(i, { to: e.target.value })} placeholder={t('expTo')} />
            </div>
            <textarea rows={2} className={`${field} mt-3 resize-none`} value={it.desc ?? ''} onChange={(e) => update(i, { desc: e.target.value })} placeholder={t('expDesc')} />
          </motion.div>
        ))}
      </AnimatePresence>
      {items.length === 0 && <p className="py-4 text-center text-sm text-slate-400">{t('expEmpty')}</p>}
      <button onClick={add} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-violet-300 bg-violet-50/40 px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-50">
        <Plus size={16} /> {t('expAdd')}
      </button>
    </div>
  );
}

function EducationStep({ t, form, patch }: { t: TFn; form: Form; patch: (p: Partial<Form>) => void }) {
  const items = form.education;
  const update = (i: number, p: Partial<ResumeEducation>) => patch({ education: items.map((it, k) => (k === i ? { ...it, ...p } : it)) });
  const add = () => patch({ education: [...items, { degree: '', school: '', year: '' }] });
  const remove = (i: number) => patch({ education: items.filter((_, k) => k !== i) });
  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {items.map((it, i) => (
          <motion.div key={i} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-violet-600">{t('eduEntry', { n: i + 1 })}</span>
              <button onClick={() => remove(i)} className="text-slate-400 hover:text-rose-500" aria-label={t('remove')}><Trash2 size={16} /></button>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
              <input className={field} value={it.degree} onChange={(e) => update(i, { degree: e.target.value })} placeholder={t('eduDegree')} />
              <input className={field} value={it.school} onChange={(e) => update(i, { school: e.target.value })} placeholder={t('eduSchool')} />
              <input className={field} value={it.year ?? ''} onChange={(e) => update(i, { year: e.target.value })} placeholder={t('eduYear')} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {items.length === 0 && <p className="py-4 text-center text-sm text-slate-400">{t('eduEmpty')}</p>}
      <button onClick={add} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-violet-300 bg-violet-50/40 px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-50">
        <Plus size={16} /> {t('eduAdd')}
      </button>
    </div>
  );
}

function DoneScreen({ t, existed, onEdit }: { t: TFn; existed: boolean; onEdit: () => void }) {
  return (
    <div className="container-wide py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-brand text-white">
          <PartyPopper size={28} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-navy">{existed ? t('savedTitle') : t('createdTitle')}</h1>
        <p className="mt-2 text-slate2">{t('doneHint')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/ish" className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">
            {t('browseJobs')} <ArrowRight size={16} />
          </Link>
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-navy transition hover:bg-bg">
            {t('editResume')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
