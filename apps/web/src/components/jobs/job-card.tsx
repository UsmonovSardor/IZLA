'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Wifi, Star, Eye } from 'lucide-react';
import type { Job } from '@/lib/api';
import { SaveJobButton } from '@/components/jobs/save-job-button';

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
function salary(job: Job, mln: string, sum: string, negotiable: string, from: string) {
  if (!job.salaryMin && !job.salaryMax) return negotiable;
  const f = (n: number) => (n / 1_000_000).toFixed(0);
  if (job.salaryMin && job.salaryMax) return `${f(job.salaryMin)}–${f(job.salaryMax)} ${mln} ${sum}`;
  const one = job.salaryMin ?? job.salaryMax!;
  return `${from} ${f(one)} ${mln} ${sum}`;
}

export function JobCard({ job, index = 0 }: { job: Job; index?: number }) {
  const t = useTranslations('ish');
  return (
    <Link
      href={`/ish/${job.id}`}
      style={{ animationDelay: `${Math.min(index * 55, 400)}ms` }}
      className="job-card group relative flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_18px_44px_-20px_rgba(124,58,237,0.35)]"
    >
      <div className="absolute right-3 top-3 z-10">
        <SaveJobButton jobId={job.id} />
      </div>
      <div className="flex items-start gap-3.5">
        {job.company?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.company.logo} alt="" className="h-[52px] w-[52px] flex-none rounded-xl object-cover" />
        ) : (
          <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-brand text-base font-bold text-white">
            {initials(job.company?.name ?? 'Izla')}
          </span>
        )}
        <div className="min-w-0 flex-1 pr-12">
          <h3 className="font-display text-[1.05rem] font-semibold leading-snug text-navy transition-colors group-hover:text-violet-700">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-slate2">
            {job.company?.name}
            {job.region && <span className="text-slate-400"> · {job.region}</span>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.featured && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
            <Star size={11} className="fill-violet-500 text-violet-500" /> {t('featured')}
          </span>
        )}
        <span className="rounded-lg bg-bg px-2.5 py-1 text-xs text-slate2">{t(`emp.${job.employment}`)}</span>
        <span className="rounded-lg bg-bg px-2.5 py-1 text-xs text-slate2">{t(`exp.${job.experience}`)}</span>
        {job.remote && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-teal-600/10 px-2.5 py-1 text-xs font-medium text-teal-600">
            <Wifi size={12} /> {t('remote')}
          </span>
        )}
        {job.category && <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">{job.category}</span>}
      </div>

      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-slate-500">{s}</span>
          ))}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
        <span className="font-mono text-sm font-semibold text-emerald-600">
          {salary(job, t('mln'), t('sum'), t('negotiable'), t('from'))}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Eye size={13} /> {job.views}
        </span>
      </div>
    </Link>
  );
}
