import { api, type Vendor } from '@/lib/api';
import { SearchExplorer } from '@/components/search-explorer';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.category) qs.set('category', sp.category);
  if (sp.q) qs.set('q', sp.q);
  if (sp.district) qs.set('district', sp.district);
  qs.set('sort', 'rating');

  let vendors: Vendor[] = [];
  try {
    vendors = await api.vendors(`?${qs.toString()}`);
  } catch {
    vendors = [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Qidiruv natijalari</h1>
      <p className="text-slate2 text-sm mb-6">{vendors.length} ta joy topildi{sp.category ? ` · ${sp.category}` : ''}</p>
      <SearchExplorer vendors={vendors} />
    </div>
  );
}
