import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Link } from 'next-view-transitions';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft, Wifi, MapPin, Briefcase, TrendingUp, Eye, Users, Globe, BadgeCheck, Building2 } from 'lucide-react';
import { api, type JobDetail } from '@/lib/api';
import { ApplyButton } from '@/components/jobs/apply-button';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { JobCard } from '@/components/jobs/job-card';

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}
function salaryText(job: JobDetail, mln: string, sum: string, negotiable: string, from: string) {
  if (!job.salaryMin && !job.salaryMax) return negotiable;
  const f = (n: number) => (n / 1_000_000).toFixed(0);
  if (job.salaryMin && job.salaryMax) return `${f(job.salaryMin)}–${f(job.salaryMax)} ${mln} ${sum}`;
  return `${from} ${f(job.salaryMin ?? job.salaryMax!)} ${mln} ${sum}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const job = await api.job(id);
    return {
      title: `${job.title} — ${job.company.name}`,
      description: job.description.slice(0, 160),
      alternates: { canonical: `/ish/${id}` },
    };
  } catch {
    return { title: 'Vakansiya' };
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('ish');
  const locale = await getLocale();

  let job: JobDetail;
  try {
    job = await api.job(id);
  } catch {
    notFound();
  }

  const similar = job.category
    ? await api.jobs(`?category=${encodeURIComponent(job.category)}&limit=3`).then((r) => r.items.filter((j) => j.id !== job.id).slice(0, 2)).catch(() => [])
    : [];

  const days = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000);
  const posted = days <= 0 ? t('today') : t('daysAgo', { count: days });
  const co = job.company;

  const fact = (icon: ReactNode, label: string, value: string) => (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-violet-50 text-violet-600">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="truncate text-sm font-medium text-navy">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="container-wide py-8 md:py-12">
      <Link href="/ish" className="inline-flex items-center gap-1.5 text-sm text-slate2 transition hover:text-violet-700">
        <ArrowLeft size={16} /> {t('backToJobs')}
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Asosiy */}
        <div>
          <div className="rounded-3xl border border-line bg-surface p-6 md:p-8">
            <div className="flex items-start gap-4">
              {co.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={co.logo} alt="" className="h-16 w-16 flex-none rounded-2xl object-cover" />
              ) : (
                <span className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-brand text-xl font-bold text-white">
                  {initials(co.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl font-bold leading-tight text-navy md:text-[1.75rem]">{job.title}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate2">
                  <Link href={`/ish?q=${encodeURIComponent(co.name)}`} className="inline-flex items-center gap-1 font-medium text-navy hover:text-violet-700">
                    {co.name}
                    {co.verified && <BadgeCheck size={14} className="text-violet-500" />}
                  </Link>
                  {job.region && <><span className="text-slate-300">·</span><span className="inline-flex items-center gap-1"><MapPin size={13} />{job.region}</span></>}
                  <span className="text-slate-300">·</span><span>{posted}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-lg bg-bg px-3 py-1.5 text-sm text-slate2">{t(`emp.${job.employment}`)}</span>
              <span className="rounded-lg bg-bg px-3 py-1.5 text-sm text-slate2">{t(`exp.${job.experience}`)}</span>
              {job.remote && <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600/10 px-3 py-1.5 text-sm font-medium text-teal-600"><Wifi size={14} />{t('remote')}</span>}
              {job.category && <span className="rounded-lg bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700">{job.category}</span>}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-violet-50 to-brand-50 p-5">
              <div>
                <div className="text-xs text-slate2">{t('salary').replace(/\s*\(.*\)/, '')}</div>
                <div className="font-display text-xl font-bold text-navy">{salaryText(job, t('mln'), t('sum'), t('negotiable'), t('from'))}<span className="text-sm font-normal text-slate2"> / {t('perMonth')}</span></div>
              </div>
              <ApplyButton jobId={job.id} />
            </div>

            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-navy">{t('aboutRole')}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{job.description}</p>
            </div>

            {job.skills.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-lg font-semibold text-navy">{t('skills')}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span key={s} className="rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-navy">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {similar.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-navy">{t('similar')}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {similar.map((j, i) => <JobCard key={j.id} job={j} index={i} />)}
              </div>
            </div>
          )}
        </div>

        {/* Yon panel */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="space-y-4">
              {fact(<Briefcase size={16} />, t('employment'), t(`emp.${job.employment}`))}
              {fact(<TrendingUp size={16} />, t('experience'), t(`exp.${job.experience}`))}
              {job.region && fact(<MapPin size={16} />, t('remote'), job.remote ? t('remote') : job.region)}
              {fact(<Users size={16} />, t('applicants'), `${job.applicants}`)}
              {fact(<Eye size={16} />, t('views'), `${job.views}`)}
            </div>
            <div className="mt-5 space-y-2.5">
              <ApplyButton jobId={job.id} block />
              <SaveJobButton jobId={job.id} variant="inline" className="w-full justify-center" />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              {co.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={co.logo} alt="" className="h-11 w-11 rounded-xl object-cover" />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-brand text-sm font-bold text-white">{initials(co.name)}</span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1 font-display font-semibold text-navy">{co.name}{co.verified && <BadgeCheck size={15} className="text-violet-500" />}</div>
                {co.industry && <div className="truncate text-xs text-slate2">{co.industry}</div>}
              </div>
            </div>
            {co.about && <p className="mt-3 text-sm leading-relaxed text-slate-600">{co.about}</p>}
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              {co.size && <div className="flex items-center gap-2 text-slate2"><Building2 size={14} className="text-slate-400" /> {co.size}</div>}
              {co.district && <div className="flex items-center gap-2 text-slate2"><MapPin size={14} className="text-slate-400" /> {co.district}</div>}
              {co.website && <a href={co.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-violet-600 hover:underline"><Globe size={14} /> {co.website.replace(/^https?:\/\//, '')}</a>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
