import { getLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { api, type Vendor, type Facets } from '@/lib/api';
import { SearchExplorer } from '@/components/search-explorer';
import { parseSearchFilters, vendorsQS, facetsQS, PAGE_SIZE } from '@/lib/search';

export const dynamic = 'force-dynamic';

// Qidiruv query kombinatsiyalari duplicate bo'lmasligi uchun asosiy sahifaga canonical.
export function generateMetadata(): Metadata {
  return { alternates: { canonical: '/qidiruv' } };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('search');
  const filters = parseSearchFilters(sp);

  // 1-sahifa (server) + facetlar (butun DB sanoqlari) — bir vaqtda.
  let vendors: Vendor[] = [];
  let facets: Facets = { total: 0, categories: [] };
  try {
    [vendors, facets] = await Promise.all([
      api.vendors(vendorsQS(filters, { withCategory: true, page: 1 }), locale),
      api.facets(facetsQS(filters), locale),
    ]);
  } catch {
    // bo'sh holat pastda ko'rsatiladi
  }

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">{t('title')}</h1>
        {filters.q && <span className="text-sm text-muted">“{filters.q}”</span>}
      </div>
      <SearchExplorer
        initialVendors={vendors}
        facets={facets}
        filters={filters}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
