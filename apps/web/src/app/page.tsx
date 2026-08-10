import Link from 'next/link';
import { Search, MapPin, Sparkles, ShieldCheck, Clock, ArrowRight, Send } from 'lucide-react';
import { api, type Category, type Vendor } from '@/lib/api';
import { VendorCard } from '@/components/vendor-card';
import { Reveal } from '@/components/reveal';

export const dynamic = 'force-dynamic';

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

const TILE_GRADIENTS = [
  'from-blue-500/15 to-indigo-500/15',
  'from-teal-500/15 to-emerald-500/15',
  'from-fuchsia-500/15 to-pink-500/15',
  'from-amber-500/15 to-orange-500/15',
  'from-violet-500/15 to-purple-500/15',
  'from-cyan-500/15 to-sky-500/15',
];

export default async function HomePage() {
  const [categories, topVendors, restoran, gozallik] = await Promise.all([
    safe<Category[]>(api.categories(), []),
    safe<Vendor[]>(api.vendors('?sort=rating'), []),
    safe<Vendor[]>(api.vendors('?category=restoran&sort=rating'), []),
    safe<Vendor[]>(api.vendors('?category=gozallik&sort=rating'), []),
  ]);

  const stats = [
    { icon: MapPin, value: `${topVendors.length || 50}+`, label: 'Tekshirilgan joy' },
    { icon: Sparkles, value: `${categories.length || 12}`, label: 'Yo‘nalish' },
    { icon: ShieldCheck, value: '100%', label: 'Xavfsiz to‘lov' },
    { icon: Clock, value: '24/7', label: 'Onlayn bron' },
  ];

  return (
    <div>
      {/* ===== HERO (aurora, full-bleed) ===== */}
      <section className="relative overflow-hidden bg-aurora">
        {/* Animatsion aurora bloklar */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand/30 blur-3xl animate-aurora-shift" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-teal/25 blur-3xl animate-float" />
        <div className="pointer-events-none absolute top-10 right-1/3 h-72 w-72 rounded-full bg-violet/25 blur-3xl animate-aurora-shift" />

        <div className="container-wide relative z-10 py-20 md:py-28 lg:py-32">
          <div className="max-w-3xl">
            <span className="chip bg-white/10 text-white/90 border border-white/20 animate-fade-up">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" /> O‘zbekiston №1 xizmatlar platformasi
            </span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-white animate-fade-up">
              Barcha xizmatlar —{' '}
              <span className="bg-gradient-to-r from-teal-400 via-white to-brand-100 bg-clip-text text-transparent">
                bitta ilovada
              </span>
            </h1>
            <p className="mt-5 text-lg text-white/80 max-w-2xl animate-fade-up">
              Klinika, salon, restoran, fitnes, uy-joy… Qidiring, xaritadan eng yaqinini toping va navbatsiz online bron qiling.
            </p>

            {/* Qidiruv (glass) */}
            <form
              action="/qidiruv"
              className="mt-8 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-pop max-w-2xl animate-fade-up"
            >
              <Search className="ml-3 h-5 w-5 text-slate2" />
              <input
                name="q"
                placeholder="Xizmat, joy yoki kategoriya qidiring…"
                className="flex-1 bg-transparent px-1 py-2.5 text-ink outline-none placeholder:text-slate2"
              />
              <button className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700">
                Qidirish
              </button>
            </form>

            {/* Tezkor kategoriya piluslari */}
            {categories.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2 animate-fade-up">
                {categories.slice(0, 7).map((c) => (
                  <Link
                    key={c.id}
                    href={`/qidiruv?category=${c.slug}`}
                    className="chip bg-white/10 text-white/85 border border-white/15 transition hover:bg-white/20"
                  >
                    <span>{c.icon}</span> {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
            {stats.map((s) => (
              <div key={s.label} className="glass-dark rounded-xl p-4">
                <s.icon className="h-5 w-5 text-teal-400" />
                <div className="mt-2 font-display text-2xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KATEGORIYALAR ===== */}
      <section className="container-wide py-16">
        <Reveal>
          <SectionHead title="Kategoriyalar" subtitle="Kerakli yo‘nalishni tanlang" href="/qidiruv" />
        </Reveal>
        {categories.length === 0 ? (
          <p className="text-slate2 text-sm">Ma’lumot yuklanmoqda…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 40}>
                <Link
                  href={`/qidiruv?category=${c.slug}`}
                  className={`group flex flex-col items-center gap-3 rounded-xl border border-line bg-gradient-to-br ${TILE_GRADIENTS[i % TILE_GRADIENTS.length]} p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-card`}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm transition-transform group-hover:scale-110">
                    {c.icon}
                  </span>
                  <span className="text-center text-sm font-semibold text-ink leading-tight">{c.name}</span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ===== TOP JOYLAR ===== */}
      <section className="container-wide py-6">
        <Reveal>
          <SectionHead title="Top joylar" subtitle="Eng yuqori reytingli xizmatlar" href="/qidiruv" />
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {topVendors.slice(0, 8).map((v, i) => (
            <Reveal key={v.id} delay={(i % 4) * 60}>
              <VendorCard v={v} priority={i < 4} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== KATEGORIYA RAIL'LARI ===== */}
      <CategoryRail title="Restoran va kafelar" href="/qidiruv?category=restoran" vendors={restoran} />
      <CategoryRail title="Go‘zallik salonlari" href="/qidiruv?category=gozallik" vendors={gozallik} />

      {/* ===== CTA ===== */}
      <section className="container-wide py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-aurora p-10 md:p-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-teal/30 blur-3xl animate-float" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                <h3 className="font-display text-2xl md:text-3xl font-bold text-white">
                  Izla’ni cho‘ntagingizda olib yuring
                </h3>
                <p className="mt-2 text-white/75">
                  Telegram Mini App orqali istalgan joyni toping va bir tegishda bron qiling.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/tg" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-navy shadow-pop transition hover:scale-105">
                  <Send className="h-4 w-4 text-brand" /> Telegram’da ochish
                </Link>
                <Link href="/qidiruv" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-sm font-semibold text-white border border-white/20 transition hover:bg-white/20">
                  Qidirishni boshlash <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function SectionHead({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-navy">{title}</h2>
        {subtitle && <p className="mt-1 text-slate2">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand">
          Barchasi <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

function CategoryRail({ title, href, vendors }: { title: string; href: string; vendors: Vendor[] }) {
  if (!vendors || vendors.length === 0) return null;
  return (
    <section className="container-wide py-10">
      <Reveal>
        <SectionHead title={title} href={href} />
      </Reveal>
      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {vendors.slice(0, 10).map((v) => (
          <div key={v.id} className="w-[280px] shrink-0">
            <VendorCard v={v} />
          </div>
        ))}
      </div>
    </section>
  );
}
