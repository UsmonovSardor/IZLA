import type { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { Landmark, Percent, Calculator, FileText } from 'lucide-react';
import { api, type MortgageProgram, type MortgageFacets } from '@/lib/api';
import { MortgageCalculator } from '@/components/mortgage/calculator';
import { MortgageMarketplace } from '@/components/mortgage/marketplace';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('ipoteka');
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/ipoteka' } };
}

const EMPTY_FACETS: MortgageFacets = { total: 0, subsidized: 0, banks: [], rateRange: null };

export default async function IpotekaPage({ searchParams }: { searchParams: Promise<{ price?: string }> }) {
  const t = await getTranslations('ipoteka');
  const sp = await searchParams;
  const initialPrice = sp.price ? Number(sp.price) : undefined;
  const [programs, facets] = await Promise.all([
    api.mortgagePrograms('?sort=popular').catch(() => [] as MortgageProgram[]),
    api.mortgageFacets('').catch(() => EMPTY_FACETS),
  ]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-28 h-[420px] w-[420px] rounded-full bg-teal-600/12 blur-3xl" />
          <div className="absolute right-0 top-6 h-[340px] w-[340px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="container-wide py-12 md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: '#0F766E33', background: '#0F766E0d', color: '#0F766E' }}>
            <Landmark className="h-3.5 w-3.5" /> {t('badge')}
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-heading md:text-5xl">{t('title')}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{t('subtitle')}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-ink"><Calculator className="h-4 w-4" style={{ color: '#0F766E' }} /> {t('point1')}</span>
            <span className="inline-flex items-center gap-2 text-ink"><Percent className="h-4 w-4" style={{ color: '#0F766E' }} /> {t('point2')}</span>
            <span className="inline-flex items-center gap-2 text-ink"><FileText className="h-4 w-4" style={{ color: '#0F766E' }} /> {t('point3')}</span>
          </div>
          <Link href="/ipoteka/mening-arizalarim" className="mt-5 inline-block text-sm font-semibold underline-offset-4 hover:underline" style={{ color: '#0F766E' }}>{t('myAppsLink')} →</Link>
        </div>
      </section>

      {/* Tez kalkulyator (dastursiz) */}
      <section className="container-wide py-8 md:py-10">
        <h2 className="mb-4 font-display text-xl font-bold text-heading">{t('calcHeading')}</h2>
        <MortgageCalculator initialPrice={initialPrice} />
      </section>

      {/* Bank dasturlari */}
      <section className="container-wide pb-12">
        <h2 className="mb-4 font-display text-xl font-bold text-heading">{t('programsHeading')}</h2>
        <MortgageMarketplace initialPrograms={programs} initialFacets={facets} />
      </section>
    </>
  );
}
