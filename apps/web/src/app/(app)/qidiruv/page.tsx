import { getLocale, getTranslations } from 'next-intl/server';
import { api, type Vendor } from '@/lib/api';
import { SearchExplorer } from '@/components/search-explorer';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('search');

  // Barcha kategoriyalarni olib kelamiz (klientda tez almashtirish uchun) — URL'dagi
  // ?category faqat boshlang'ich tanlov sifatida ishlatiladi.
  const qs = new URLSearchParams();
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
      <div className="mb-1 flex items-baseline gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">{t('title')}</h1>
        {sp.q && <span className="text-sm text-muted">“{sp.q}”</span>}
      </div>
      <SearchExplorer vendors={vendors} initialCategory={sp.category ?? undefined} />
    </div>
  );
}
