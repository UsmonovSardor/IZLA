import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Tag } from 'lucide-react';
import { api, type PlanConfig } from '@/lib/api';
import { PlanCards } from '@/components/plans/plan-cards';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('narxlar');
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/narxlar' } };
}

export default async function NarxlarPage() {
  const t = await getTranslations('narxlar');
  const plans = await api.plans().catch(() => [] as PlanConfig[]);

  return (
    <section className="container-wide py-12 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
          <Tag className="h-3.5 w-3.5" /> {t('badge')}
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-heading md:text-4xl" style={{ textWrap: 'balance' }}>{t('title')}</h1>
        <p className="mt-3 text-muted">{t('subtitle')}</p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl">
        <PlanCards plans={plans} />
        <p className="mt-6 text-center text-sm text-muted">{t('kabinetHint')}</p>
      </div>
    </section>
  );
}
