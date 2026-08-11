import { getLocale, getTranslations } from 'next-intl/server';
import { api, type Vendor, type Facets } from '@/lib/api';
import { SearchExplorer } from '@/components/search-explorer';
import { SearchFilters } from '@/components/search-filters';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// Qidiruv query kombinatsiyalari duplicate bo'lmasligi uchun asosiy sahifaga canonical.
export function generateMetadata(): Metadata {
  return { alternates: { canonical: '/qidiruv' } };
}

const FILTER_KEYS = ['category', 'q', 'district', 'verified', 'minRating', 'priceMin', 'priceMax', 'openNow'] as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('search');

  // Ro'yxat uchun — barcha filtrlar + sort
  const listQs = new URLSearchParams();
  for (const k of FILTER_KEYS) if (sp[k]) listQs.set(k, sp[k]);
  // Sort: aniq berilsa — o'sha; aks holda q bo'lsa relevance (sort'siz), bo'lmasa rating
  const sort = sp.sort || (sp.q ? '' : 'rating');
  if (sort) listQs.set('sort', sort);

  // Facets uchun — kategoriyadan tashqari barcha filtrlar
  const facetQs = new URLSearchParams();
  for (const k of FILTER_KEYS) if (k !== 'category' && sp[k]) facetQs.set(k, sp[k]);

  let vendors: Vendor[] = [];
  let facets: Facets = { total: 0, categories: [] };
  try {
    [vendors, facets] = await Promise.all([
      api.vendors(`?${listQs.toString()}`, locale),
      api.facets(facetQs.toString() ? `?${facetQs.toString()}` : '', locale),
    ]);
  } catch {
    vendors = [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">{t('title')}</h1>
      <p className="text-slate2 text-sm mb-5">{t('found', { count: vendors.length })}</p>

      <SearchFilters categories={facets.categories} />
      <SearchExplorer vendors={vendors} />
    </div>
  );
}
