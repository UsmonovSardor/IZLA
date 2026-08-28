import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { Star, Check, ArrowLeft, ShieldCheck, BadgeCheck } from 'lucide-react';
import { api, type InsuranceProductDetail } from '@/lib/api';
import { TYPE_ACCENT } from '@/lib/insurance-meta';
import { InsuranceCalculator } from '@/components/insurance/calculator';
import { formatUZS } from '@/lib/utils';

async function load(slug: string): Promise<InsuranceProductDetail | null> {
  try {
    return await api.insuranceProduct(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) return { title: 'Sug‘urta' };
  return {
    title: `${p.name} — ${p.insurer.name}`,
    description: p.summary ?? undefined,
    alternates: { canonical: `/sugurta/${p.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  const t = await getTranslations('sugurta');
  const accent = TYPE_ACCENT[p.type];

  return (
    <section className="container-wide py-8 md:py-12">
      <Link href="/sugurta" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-heading">
        <ArrowLeft className="h-4 w-4" /> {t('backToList')}
      </Link>

      {/* Sarlavha */}
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{t(`types.${p.type}.name`)}</span>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-heading md:text-4xl">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              {p.insurer.verified && <BadgeCheck className="h-4 w-4 text-brand" />} {p.insurer.name}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}
            </span>
          </div>
          {p.summary && <p className="mt-3 max-w-xl text-muted">{p.summary}</p>}
        </div>
      </div>

      {/* Afzalliklar */}
      {p.features.length > 0 && (
        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {p.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-card">
              <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} /> {f}
            </li>
          ))}
        </ul>
      )}

      {/* Kalkulyator */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-heading">
          <ShieldCheck className="h-5 w-5" style={{ color: accent }} /> {t('calc.heading')}
        </h2>
        <InsuranceCalculator product={p} />
      </div>

      {/* Ishonch qatori */}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-line bg-bg px-5 py-4 text-sm text-muted">
        <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-brand" /> {t('trust.licensed')}</span>
        <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> {t('trust.coverageFrom', { sum: formatUZS(p.coverageFrom) })}</span>
      </div>
    </section>
  );
}
