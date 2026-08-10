import { api, type Vendor } from '@/lib/api';
import { VendorCard } from '@/components/vendor-card';

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
      {/* Xarita bu yerga qo'shiladi (MapLibre) — MVP keyingi bosqich */}
      {vendors.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-8 text-center text-slate2">Hech narsa topilmadi yoki API ishga tushmagan.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {vendors.map((v) => <VendorCard key={v.id} v={v} />)}
        </div>
      )}
    </div>
  );
}
