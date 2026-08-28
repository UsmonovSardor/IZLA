import type { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { ShieldCheck, Zap, FileText } from 'lucide-react';
import { api, type InsuranceProduct, type InsuranceFacets } from '@/lib/api';
import { InsuranceMarketplace } from '@/components/insurance/marketplace';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('sugurta');
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: '/sugurta' },
  };
}

const EMPTY_FACETS: InsuranceFacets = { total: 0, types: [], insurers: [], priceRange: null };

export default async function SugurtaPage() {
  const t = await getTranslations('sugurta');
  const [products, facets] = await Promise.all([
    api.insuranceProducts('?sort=popular').catch(() => [] as InsuranceProduct[]),
    api.insuranceFacets('').catch(() => EMPTY_FACETS),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-28 h-[420px] w-[420px] rounded-full bg-brand/12 blur-3xl" />
          <div className="absolute right-0 top-6 h-[340px] w-[340px] rounded-full bg-teal-500/12 blur-3xl" />
        </div>
        <div className="container-wide py-14 md:py-18">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
            <ShieldCheck className="h-3.5 w-3.5" /> {t('badge')}
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-heading md:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{t('subtitle')}</p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <span className="inline-flex items-center gap-2 text-ink"><Zap className="h-4 w-4 text-brand" /> {t('point1')}</span>
            <span className="inline-flex items-center gap-2 text-ink"><FileText className="h-4 w-4 text-brand" /> {t('point2')}</span>
            <span className="inline-flex items-center gap-2 text-ink"><ShieldCheck className="h-4 w-4 text-brand" /> {t('point3')}</span>
          </div>

          <div className="mt-6">
            <Link href="/sugurta/mening-polislarim" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {t('myPoliciesLink')} →
            </Link>
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section className="container-wide py-10 md:py-12">
        <InsuranceMarketplace initialProducts={products} initialFacets={facets} />
      </section>
    </>
  );
}
