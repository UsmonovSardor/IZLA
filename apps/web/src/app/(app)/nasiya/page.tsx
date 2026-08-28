import type { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { getTranslations } from 'next-intl/server';
import { CreditCard, Zap, ShieldCheck } from 'lucide-react';
import { api, type NasiyaProvider } from '@/lib/api';
import { NasiyaComparison } from '@/components/nasiya/comparison';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nasiya');
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/nasiya' } };
}

export default async function NasiyaPage({ searchParams }: { searchParams: Promise<{ amount?: string }> }) {
  const t = await getTranslations('nasiya');
  const sp = await searchParams;
  const initialAmount = sp.amount ? Number(sp.amount) : undefined;
  const providers = await api.nasiyaProviders().catch(() => [] as NasiyaProvider[]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-28 h-[420px] w-[420px] rounded-full bg-violet-500/12 blur-3xl" />
          <div className="absolute right-0 top-6 h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>
        <div className="container-wide py-12 md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: '#7C3AED33', background: '#7C3AED0d', color: '#7C3AED' }}>
            <CreditCard className="h-3.5 w-3.5" /> {t('badge')}
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-heading md:text-5xl">{t('title')}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{t('subtitle')}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 text-ink"><Zap className="h-4 w-4" style={{ color: '#7C3AED' }} /> {t('point1')}</span>
            <span className="inline-flex items-center gap-2 text-ink"><CreditCard className="h-4 w-4" style={{ color: '#7C3AED' }} /> {t('point2')}</span>
            <span className="inline-flex items-center gap-2 text-ink"><ShieldCheck className="h-4 w-4" style={{ color: '#7C3AED' }} /> {t('point3')}</span>
          </div>
          <Link href="/nasiya/mening-arizalarim" className="mt-5 inline-block text-sm font-semibold underline-offset-4 hover:underline" style={{ color: '#7C3AED' }}>{t('myAppsLink')} →</Link>
        </div>
      </section>

      <section className="container-wide py-8 md:py-10">
        <NasiyaComparison providers={providers} initialAmount={initialAmount} />
      </section>
    </>
  );
}
