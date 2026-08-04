import Link from 'next/link';
import { Search } from 'lucide-react';
import { api, type Category, type Vendor } from '@/lib/api';
import { VendorCard } from '@/components/vendor-card';

export const dynamic = 'force-dynamic';

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [categories, vendors] = await Promise.all([
    safe<Category[]>(api.categories(), []),
    safe<Vendor[]>(api.vendors('?sort=rating&take=6'), []),
  ]);

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-xl bg-brand-gradient text-white p-8 md:p-14">
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">
            Barcha xizmatlar — bitta ilovada
          </h1>
          <p className="mt-3 text-white/90 md:text-lg">
            Klinika, salon, restoran, fitnes, uy-joy… Qidiring, xaritadan eng yaqinini toping va navbatsiz online bron qiling.
          </p>
          <form action="/qidiruv" className="mt-6 flex items-center gap-2 rounded-lg bg-white p-2 shadow-pop">
            <Search className="h-5 w-5 text-slate2 ml-2" />
            <input name="q" placeholder="Xizmat, joy yoki kategoriya qidiring…" className="flex-1 bg-transparent text-ink outline-none placeholder:text-slate2" />
            <button className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Qidirish</button>
          </form>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      </section>

      {/* KATEGORIYALAR */}
      <section>
        <h2 className="font-display text-xl font-bold text-navy mb-4">Kategoriyalar</h2>
        {categories.length === 0 ? (
          <p className="text-slate2 text-sm">Ma’lumot yuklanmoqda… (API ishga tushganini tekshiring)</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categories.map((c) => (
              <Link key={c.id} href={`/qidiruv?category=${c.slug}`} className="flex flex-col items-center gap-2 rounded-lg bg-surface border border-line p-3 hover:shadow-card hover:border-brand/40 transition">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs text-center text-ink font-medium leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* TOP VENDORLAR */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-navy">Top joylar</h2>
          <Link href="/qidiruv" className="text-sm text-brand font-medium">Barchasi →</Link>
        </div>
        {vendors.length === 0 ? (
          <p className="text-slate2 text-sm">Hozircha bo‘sh.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <VendorCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
