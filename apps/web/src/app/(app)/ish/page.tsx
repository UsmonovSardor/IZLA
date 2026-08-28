import type { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { FileText, ClipboardList, Building2, Bookmark } from 'lucide-react';
import { api } from '@/lib/api';
import { JobBoard } from '@/components/jobs/job-board';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ish');
  return {
    title: t('heroTitle'),
    description: t('heroSub'),
    alternates: { canonical: '/ish' },
  };
}

export default async function IshPage() {
  const t = await getTranslations('ish');
  const ts = await getTranslations('savedJobs');
  const [initial, facets] = await Promise.all([
    api.jobs('?limit=20').catch(() => ({ total: 0, page: 0, limit: 20, items: [] })),
    api.jobFacets().catch(() => ({ total: 0, employment: {}, experience: {}, categories: [] })),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 -top-24 h-[380px] w-[380px] rounded-full bg-violet-500/15 blur-3xl" />
          <div className="absolute right-0 top-10 h-[320px] w-[320px] rounded-full bg-brand/10 blur-3xl" />
        </div>
        <div className="container-wide py-14 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Izla&nbsp;Ish · {facets.total}+ {t('results', { count: facets.total }).replace(/^\s*[\d\s]+/, '')}
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy md:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate2">{t('heroSub')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/rezyume" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">
              <FileText size={16} /> {t('createResume')}
            </Link>
            <Link href="/ish/arizalarim" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-bg">
              <ClipboardList size={16} /> {t('myApplications')}
            </Link>
            <Link href="/ish/saqlanganlar" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-bg">
              <Bookmark size={16} /> {ts('title')}
            </Link>
          </div>
          <Link href="/ish/kabinet" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 transition hover:gap-2.5">
            <Building2 size={15} /> {t('forEmployersCta')}
          </Link>
        </div>
      </section>

      {/* Doska */}
      <section className="container-wide py-8 md:py-10">
        <JobBoard initial={initial} facets={facets} />
      </section>
    </>
  );
}
