'use client';

import { useEffect, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Briefcase, Loader2, MapPin, Wifi, BadgeCheck, ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { api, type MyApplication, type ApplicationStatusValue } from '@/lib/api';

const STATUS_STYLE: Record<ApplicationStatusValue, string> = {
  NEW: 'bg-slate-100 text-slate-600 border-slate-200',
  VIEWED: 'bg-blue-50 text-brand border-blue-200',
  INTERVIEW: 'bg-violet-50 text-violet-700 border-violet-200',
  OFFER: 'bg-amber-50 text-amber-700 border-amber-200',
  HIRED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-200',
};

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function MyApplicationsPage() {
  const t = useTranslations('ish');
  const { user, loading, openLogin } = useAuth();
  const locale = useLocale();
  const [items, setItems] = useState<MyApplication[] | null>(null);

  useEffect(() => {
    if (!user) return;
    api.myApplications().then(setItems).catch(() => setItems([]));
  }, [user]);

  const dtf = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) return <div className="py-24 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" /></div>;
  if (!user) {
    return (
      <div className="py-24 text-center">
        <FileText className="mx-auto text-slate-300" size={44} />
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">{t('myApplications')}</h1>
        <p className="mt-2 text-slate2">{t('appsLoginNeeded')}</p>
        <button onClick={() => openLogin()} className="mt-5 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">{t('login')}</button>
      </div>
    );
  }

  return (
    <div className="container-wide py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/ish" className="inline-flex items-center gap-1.5 text-sm text-slate2 transition hover:text-violet-700">
          <ArrowRight size={16} className="rotate-180" /> {t('backToJobs')}
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold text-navy md:text-3xl">{t('myApplications')}</h1>

        {items === null ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" /></div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line py-16 text-center">
            <Briefcase className="mx-auto text-slate-300" size={40} />
            <p className="mt-3 text-slate2">{t('appsEmpty')}</p>
            <Link href="/ish" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
              {t('browseJobs')} <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <p className="mt-1 text-slate2">{t('appsCount', { count: items.length })}</p>
        )}

        <div className="mt-6 space-y-3">
          {items?.map((a, i) => {
            const co = a.job.company;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="rounded-2xl border border-line bg-white p-4 transition hover:border-violet-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3.5">
                  {co.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={co.logo} alt="" className="h-12 w-12 flex-none rounded-xl object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-brand text-sm font-bold text-white">{initials(co.name)}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/ish/${a.job.id}`} className="font-display font-semibold text-navy hover:text-violet-700">{a.job.title}</Link>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>{t(`appStatus.${a.status}`)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate2">
                      <span className="inline-flex items-center gap-1 font-medium text-navy">{co.name}{co.verified && <BadgeCheck size={13} className="text-violet-500" />}</span>
                      <span className="text-slate-300">·</span>
                      <span>{t(`emp.${a.job.employment}`)}</span>
                      {a.job.remote && <><span className="text-slate-300">·</span><span className="inline-flex items-center gap-1 text-teal-600"><Wifi size={12} />{t('remote')}</span></>}
                      {a.job.region && !a.job.remote && <><span className="text-slate-300">·</span><span className="inline-flex items-center gap-1"><MapPin size={12} />{a.job.region}</span></>}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{t('appliedOn', { date: dtf.format(new Date(a.createdAt)) })}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
