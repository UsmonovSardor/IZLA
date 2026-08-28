import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { Star, Check, ArrowLeft, BadgeCheck, Landmark, Sparkles } from 'lucide-react';
import { api, type MortgageProgramDetail } from '@/lib/api';
import { MortgageCalculator } from '@/components/mortgage/calculator';
import { formatUZS } from '@/lib/utils';

const ACCENT = '#0F766E';

async function load(slug: string): Promise<MortgageProgramDetail | null> {
  try {
    return await api.mortgageProgram(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) return { title: 'Ipoteka' };
  return { title: `${p.name} — ${p.bank.name}`, description: p.summary ?? undefined, alternates: { canonical: `/ipoteka/${p.slug}` } };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  const t = await getTranslations('ipoteka');
  const years = Math.round(p.maxTermMonths / 12);

  return (
    <section className="container-wide py-8 md:py-12">
      <Link href="/ipoteka" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-heading">
        <ArrowLeft className="h-4 w-4" /> {t('backToList')}
      </Link>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {p.subsidized && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><Sparkles className="h-3 w-3" /> {t('card.subsidized')}</span>}
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
            {p.bank.verified && <BadgeCheck className="h-4 w-4 text-brand" />} {p.bank.name}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-muted"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-heading md:text-4xl">{p.name}</h1>
        {p.summary && <p className="mt-2 max-w-xl text-muted">{p.summary}</p>}
      </div>

      {/* Fakt paneli */}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          { label: t('card.rate'), value: `${p.annualRate}%` },
          { label: t('card.minDown'), value: `${p.minDownPct}%` },
          { label: t('facts.maxTerm'), value: `${years} ${t('card.years')}` },
          { label: t('facts.maxAmount'), value: p.maxAmount ? formatUZS(p.maxAmount) : '—' },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-card">
            <div className="text-xs text-muted">{f.label}</div>
            <div className="font-display text-lg font-bold" style={{ color: i === 0 ? ACCENT : 'var(--c-heading)', fontVariantNumeric: 'tabular-nums' }}>{f.value}</div>
          </div>
        ))}
      </div>

      {p.features.length > 0 && (
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {p.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-card">
              <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} /> {f}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-heading"><Landmark className="h-5 w-5" style={{ color: ACCENT }} /> {t('calcHeading')}</h2>
        <MortgageCalculator program={p} />
      </div>
    </section>
  );
}
