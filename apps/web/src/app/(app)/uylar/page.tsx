import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { api, type Property } from '@/lib/api';
import { PropertyCard } from '@/components/property-card';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return { alternates: { canonical: '/uylar' } };
}

const TABS = [
  { key: '', labelKey: 'tabAll' },
  { key: 'NEW', labelKey: 'tabNew' },
  { key: 'CONSTRUCTION', labelKey: 'tabConstruction' },
  { key: 'SECONDARY', labelKey: 'tabSecondary' },
] as const;

export default async function UylarPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const t = await getTranslations('realEstate');
  const type = sp.type ?? '';
  let items: Property[] = [];
  try {
    items = await api.properties(type ? `?type=${type}` : '');
  } catch {
    items = [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">{t('title')}</h1>
      <p className="text-slate2 text-sm mb-4">{t('subtitle')}</p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map((tab) => (
          <Link key={tab.key} href={tab.key ? `/uylar?type=${tab.key}` : '/uylar'}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border transition ${type === tab.key ? 'bg-brand text-white border-brand' : 'bg-surface text-ink border-line hover:border-brand/40'}`}>
            {t(tab.labelKey)}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-8 text-center text-slate2">{t('empty')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
