import Link from 'next/link';
import { api, type Property } from '@/lib/api';
import { PropertyCard } from '@/components/property-card';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: '', label: 'Barchasi' },
  { key: 'NEW', label: 'Yangi binolar' },
  { key: 'CONSTRUCTION', label: 'Qurilayotgan' },
  { key: 'SECONDARY', label: 'Ikkilamchi' },
];

export default async function UylarPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const type = sp.type ?? '';
  let items: Property[] = [];
  try {
    items = await api.properties(type ? `?type=${type}` : '');
  } catch {
    items = [];
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-1">Ko‘chmas mulk</h1>
      <p className="text-slate2 text-sm mb-4">Yangi, qurilayotgan va ikkilamchi uy-joylar — narx, lokatsiya va zayavka bilan.</p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key ? `/uylar?type=${t.key}` : '/uylar'}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border transition ${type === t.key ? 'bg-brand text-white border-brand' : 'bg-surface text-ink border-line hover:border-brand/40'}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-8 text-center text-slate2">Hozircha bo‘sh yoki API ishga tushmagan.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
