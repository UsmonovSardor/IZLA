'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Briefcase, Building2, Users2, UserCheck, Eye, Loader2, Plus, Check, Pencil,
  Archive, ArrowRight, Sparkles, ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import {
  api, type EmployerCompany, type EmployerJob, type EmployerStats, type EmployerCompanyInput,
} from '@/lib/api';
import { JobEditor } from '@/components/jobs/employer/job-editor';
import { AtsBoard } from '@/components/jobs/employer/ats-board';

type Tab = 'jobs' | 'profile';

export default function EmployerCabinetPage() {
  const t = useTranslations('ishKabinet');
  const { user, loading, openLogin } = useAuth();
  const [companies, setCompanies] = useState<EmployerCompany[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const loadCompanies = useCallback(() => {
    api.employerCompanies().then((c) => {
      setCompanies(c);
      setActiveId((cur) => cur ?? (c[0]?.id ?? null));
    }).catch(() => setCompanies([]));
  }, []);

  useEffect(() => { if (user) loadCompanies(); }, [user, loadCompanies]);

  if (loading) return <Center><Loader2 className="animate-spin text-violet-600" /></Center>;
  if (!user) {
    return (
      <Center>
        <Building2 className="text-slate-300" size={44} />
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">{t('title')}</h1>
        <p className="mt-2 text-slate2">{t('loginNeeded')}</p>
        <button onClick={() => openLogin()} className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">{t('login')}</button>
      </Center>
    );
  }
  if (companies === null) return <Center><Loader2 className="animate-spin text-violet-600" /></Center>;

  if (companies.length === 0) {
    return (
      <div className="container-wide py-8 md:py-12">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-brand text-white"><Building2 size={28} /></div>
            <h1 className="mt-5 font-display text-2xl font-bold text-navy">{t('createCompanyTitle')}</h1>
            <p className="mt-2 text-slate2">{t('createCompanyHint')}</p>
          </div>
          <CompanyForm submitLabel={t('createCompany')} onSaved={(c) => { setCompanies([c]); setActiveId(c.id); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-slate2">{t('subtitle')}</p>
        </div>
        {companies.length > 1 && (
          <select value={activeId ?? ''} onChange={(e) => setActiveId(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      {activeId && <CompanyDashboard key={activeId} companyId={activeId} onCompanyChange={loadCompanies} />}
    </div>
  );
}

function CompanyDashboard({ companyId, onCompanyChange }: { companyId: string; onCompanyChange: () => void }) {
  const t = useTranslations('ishKabinet');
  const [tab, setTab] = useState<Tab>('jobs');
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [jobs, setJobs] = useState<EmployerJob[] | null>(null);
  const [atsJob, setAtsJob] = useState<EmployerJob | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; job: EmployerJob | null }>({ open: false, job: null });

  const reload = useCallback(() => {
    api.employerStats(companyId).then(setStats).catch(() => {});
    api.employerJobs(companyId).then(setJobs).catch(() => setJobs([]));
  }, [companyId]);
  useEffect(() => { reload(); }, [reload]);

  if (atsJob) {
    return <div className="mt-6"><AtsBoard job={atsJob} onBack={() => { setAtsJob(null); reload(); }} /></div>;
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Briefcase size={18} />} label={t('stats.activeJobs')} value={stats ? String(stats.jobsActive) : '—'} />
        <StatCard icon={<Users2 size={18} />} label={t('stats.applications')} value={stats ? String(stats.applicationsTotal) : '—'} />
        <StatCard icon={<Sparkles size={18} />} label={t('stats.new')} value={stats ? String(stats.applicationsNew) : '—'} />
        <StatCard icon={<UserCheck size={18} />} label={t('stats.hired')} value={stats ? String(stats.hired) : '—'} />
      </div>

      <div className="mt-8 flex gap-1 border-b border-line">
        {(['jobs', 'profile'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`relative px-4 py-2.5 text-sm font-medium transition ${tab === tb ? 'text-violet-700' : 'text-slate2 hover:text-navy'}`}>
            {t(`tabs.${tb}`)}
            {tab === tb && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-violet-600" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'jobs' && (
          <JobsTab jobs={jobs} onNew={() => setEditor({ open: true, job: null })} onEdit={(j) => setEditor({ open: true, job: j })} onArchive={reload} onAts={setAtsJob} />
        )}
        {tab === 'profile' && <CompanyProfileTab companyId={companyId} onSaved={onCompanyChange} />}
      </div>

      <JobEditor companyId={companyId} job={editor.job} open={editor.open} onClose={() => setEditor({ open: false, job: null })} onSaved={() => { setEditor({ open: false, job: null }); reload(); }} />
    </>
  );
}

function JobsTab({ jobs, onNew, onEdit, onArchive, onAts }: {
  jobs: EmployerJob[] | null; onNew: () => void; onEdit: (j: EmployerJob) => void; onArchive: () => void; onAts: (j: EmployerJob) => void;
}) {
  const t = useTranslations('ishKabinet');
  const ti = useTranslations('ish');
  const locale = useLocale();
  const nf = useMemo(() => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ru-RU'), [locale]);

  const archive = async (id: string) => { await api.employerArchiveJob(id); onArchive(); };
  const salary = (j: EmployerJob) => {
    const f = (n: number) => nf.format(Math.round(n / 1000)) + ' ' + t('thousand');
    if (j.salaryMin && j.salaryMax) return `${f(j.salaryMin)} – ${f(j.salaryMax)}`;
    if (j.salaryMin || j.salaryMax) return `${t('from')} ${f((j.salaryMin ?? j.salaryMax)!)}`;
    return ti('negotiable');
  };
  const statusStyle: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-slate-100 text-slate-500 border-slate-200',
    CLOSED: 'bg-amber-50 text-amber-700 border-amber-200',
    ARCHIVED: 'bg-slate-100 text-slate-400 border-slate-200',
  };

  return (
    <div>
      <button onClick={onNew} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
        <Plus size={16} /> {t('newJob')}
      </button>

      {jobs === null ? (
        <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" /></div>
      ) : jobs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line py-16 text-center">
          <Briefcase className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 text-slate2">{t('noJobs')}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {jobs.map((j, i) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }} className="rounded-2xl border border-line bg-white p-4 transition hover:border-violet-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-navy">{j.title}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle[j.status]}`}>{t(`jobStatus.${j.status}`)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate2">
                    <span>{ti(`emp.${j.employment}`)}</span>
                    <span className="text-slate-300">·</span>
                    <span>{salary(j)}</span>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1"><Eye size={13} /> {j.views}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onAts(j)} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100">
                    <ClipboardList size={15} /> {t('applicantsN', { count: j.applicants })}
                  </button>
                  <button onClick={() => onEdit(j)} className="grid h-9 w-9 place-items-center rounded-xl border border-line text-slate2 transition hover:text-navy" aria-label={t('edit')}><Pencil size={15} /></button>
                  {j.status !== 'ARCHIVED' && (
                    <button onClick={() => archive(j.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-line text-slate2 transition hover:text-rose-500" aria-label={t('archive')}><Archive size={15} /></button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyProfileTab({ companyId, onSaved }: { companyId: string; onSaved: () => void }) {
  const t = useTranslations('ishKabinet');
  const [company, setCompany] = useState<EmployerCompany | null>(null);
  useEffect(() => { api.employerCompany(companyId).then(setCompany).catch(() => {}); }, [companyId]);
  if (!company) return <Loader2 className="mx-auto my-8 animate-spin text-violet-600" />;
  return <CompanyForm submitLabel={t('save')} initial={company} onSaved={onSaved} companyId={companyId} />;
}

function CompanyForm({ submitLabel, initial, companyId, onSaved }: {
  submitLabel: string; initial?: EmployerCompany; companyId?: string; onSaved: (c: EmployerCompany) => void;
}) {
  const t = useTranslations('ishKabinet');
  const [f, setF] = useState<EmployerCompanyInput>({
    name: initial?.name ?? '', industry: initial?.industry ?? '', size: initial?.size ?? '',
    about: initial?.about ?? '', district: initial?.district ?? '', website: initial?.website ?? '',
    logo: initial?.logo ?? '', cover: initial?.cover ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const field = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none';
  const patch = (p: Partial<EmployerCompanyInput>) => setF((s) => ({ ...s, ...p }));

  const save = async () => {
    if (!f.name.trim()) { setErr(t('companyNameRequired')); return; }
    setBusy(true); setErr(null); setSaved(false);
    try {
      const c = companyId ? await api.employerUpdateCompany(companyId, f) : await api.employerCreateCompany(f);
      setSaved(true); onSaved(c);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setErr((e as Error).message || t('saveError')); } finally { setBusy(false); }
  };

  return (
    <div className="mt-6 max-w-2xl space-y-4">
      <div><label className="text-sm font-medium text-navy">{t('companyName')} <span className="text-rose-500">*</span></label>
        <input className={`${field} mt-1.5`} value={f.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Izla Technologies" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="text-sm font-medium text-navy">{t('industry')}</label>
          <input className={`${field} mt-1.5`} value={f.industry} onChange={(e) => patch({ industry: e.target.value })} placeholder="IT / Dasturiy taʼminot" /></div>
        <div><label className="text-sm font-medium text-navy">{t('size')}</label>
          <input className={`${field} mt-1.5`} value={f.size} onChange={(e) => patch({ size: e.target.value })} placeholder="11-50" /></div>
      </div>
      <div><label className="text-sm font-medium text-navy">{t('about')}</label>
        <textarea rows={3} className={`${field} mt-1.5 resize-none`} value={f.about} onChange={(e) => patch({ about: e.target.value })} placeholder={t('aboutPlaceholder')} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="text-sm font-medium text-navy">{t('district')}</label>
          <input className={`${field} mt-1.5`} value={f.district} onChange={(e) => patch({ district: e.target.value })} placeholder="Toshkent, Chilonzor" /></div>
        <div><label className="text-sm font-medium text-navy">{t('website')}</label>
          <input className={`${field} mt-1.5`} value={f.website} onChange={(e) => patch({ website: e.target.value })} placeholder="https://..." /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="text-sm font-medium text-navy">{t('logo')}</label>
          <input className={`${field} mt-1.5`} value={f.logo} onChange={(e) => patch({ logo: e.target.value })} placeholder="https://...logo.png" /></div>
        <div><label className="text-sm font-medium text-navy">{t('cover')}</label>
          <input className={`${field} mt-1.5`} value={f.cover} onChange={(e) => patch({ cover: e.target.value })} placeholder="https://...cover.jpg" /></div>
      </div>
      {err && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{err}</div>}
      <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <ArrowRight size={16} />}
        {saved ? t('saved') : submitLabel}
      </button>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-2 text-violet-500">{icon}<span className="text-xs text-slate2">{label}</span></div>
      <div className="mt-1 font-display text-xl font-bold tabular-nums text-navy">{value}</div>
    </div>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <div className="container-wide py-24 text-center"><div className="mx-auto flex flex-col items-center">{children}</div></div>;
}
