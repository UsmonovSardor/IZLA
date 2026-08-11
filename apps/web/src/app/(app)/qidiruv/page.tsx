import { getLocale, getTranslations } from 'next-intl/server';
import { api, type Vendor } from '@/lib/api';
import { SearchExplorer } from '@/components/search-explorer';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('search');

  const qs = new URLSearchParams();
  if (sp.category) qs.set('category', sp.category);
  if (sp.q) qs.set('q', sp.q);
  if (sp.district) qs.set('district', sp.district);
  qs.set('sort', 'rating');

  let vendors: Vendor[] = [];
  try {
    vendors = await api.vendors(`?${qs.toString()}`, locale);
  } catch {
    vendors = [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">{t('title')}</h1>
      <p className="text-slate2 text-sm mb-6">
        {t('found', { count: vendors.length })}
        {sp.category ? ` · ${sp.category}` : ''}
      </p>
      <SearchExplorer vendors={vendors} />
    </div>
  );
}
