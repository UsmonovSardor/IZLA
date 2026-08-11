import Link from 'next/link';
import { Search, Sparkles, ArrowRight, Send, BadgeCheck, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { api, type Category, type Vendor } from '@/lib/api';
import { VendorCard } from '@/components/vendor-card';
import { Reveal } from '@/components/reveal';
import { RotatingWord } from '@/components/rotating-word';
import { StatsRow, type Stat } from '@/components/stats-row';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return { alternates: { canonical: '/' } };
}

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
  const locale = await getLocale();
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const th = await getTranslations('hero');
  const allLabel = tc('all');

  const [categories, topVendors, restoran, gozallik] = await Promise.all([
    safe<Category[]>(api.categories(locale), []),
    safe<Vendor[]>(api.vendors('?sort=rating', locale), []),
    safe<Vendor[]>(api.vendors('?category=restoran&sort=rating', locale), []),
    safe<Vendor[]>(api.vendors('?category=gozallik&sort=rating', locale), []),
  ]);

  const rotatingWords = categories.slice(0, 6).map((c) => c.name);

  const stats: Stat[] = [
    { iconKey: 'pin', value: `${topVendors.length || 50}+`, label: t('statPlaces'), from: '#2563EB', to: '#14B8A6', numGrad: 'linear-gradient(120deg,#5eead4,#ffffff)' },
    { iconKey: 'sparkles', value: `${categories.length || 12}`, label: t('statDirections'), from: '#3b82f6', to: '#6366f1', numGrad: 'linear-gradient(120deg,#93c5fd,#ffffff)' },
    { iconKey: 'shield', value: '100%', label: t('statSecure'), from: '#7c3aed', to: '#a855f7', numGrad: 'linear-gradient(120deg,#c4b5fd,#ffffff)' },
    { iconKey: 'clock', value: '24/7', label: t('statBooking'), from: '#f59e0b', to: '#f97316', numGrad: 'linear-gradient(120deg,#fcd34d,#ffffff)' },
  ];

  return (
    <div>
      {/* ===== HERO (ochiq fon + to'q banner — kafil uslubi) ===== */}
      <section className="relative overflow-hidden bg-aurora-soft">
        <div className="container-wide relative z-10 py-12 md:py-16 lg:py-20">
          {/* ===== YAGONA BANNER (kafil uslubi): video to'ldiradi, kontent chapda ustida blend ===== */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.12] bg-gradient-to-br from-[#0b1f3a] via-[#0c2338] to-[#0a2c31] shadow-[0_40px_100px_-30px_rgba(0,0,0,.85)] lg:min-h-[520px]">
            {/* Jonli video — butun bannerni to'ldiradi */}
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src="/izla.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden
            />
            {/* Blend qatlamlari — yupqa (video ko'proq ko'rinadi), matn baribir o'qiladi */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1b30]/72 via-[#0a1b30]/78 to-[#0a1b30]/90 lg:hidden" aria-hidden />
            <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(10,27,48,0.94)_0%,rgba(10,27,48,0.6)_40%,rgba(10,27,48,0.15)_62%,transparent_80%)] lg:block" aria-hidden />
            {/* Pastki-o'ng burchak vinetka — video ichidagi ✦ ikonkani yashiradi */}
            <div className="pointer-events-none absolute bottom-0 right-0 z-[2] h-[42%] w-[38%] bg-[radial-gradient(130%_130%_at_100%_100%,rgba(10,27,48,0.97)_0%,rgba(10,27,48,0.82)_32%,transparent_70%)]" aria-hidden />
            {/* Aurora urg'u */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-brand/25 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-12 left-1/3 h-64 w-64 rounded-full bg-teal/[0.18] blur-3xl" aria-hidden />

            {/* KONTENT — banner ustida, chapda */}
            <div className="relative z-10 max-w-xl px-6 py-10 sm:px-9 md:py-14 lg:max-w-[56%] lg:px-14 lg:py-16">
              <span className="chip bg-white/10 text-white/90 border border-white/20 animate-fade-up">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" /> {t('badge')}
              </span>
              <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.05] text-white animate-fade-up">
                {t('titleA')}{' '}
                <span className="bg-gradient-to-r from-teal-400 via-white to-brand-100 bg-clip-text text-transparent">
                  {t('titleB')}
                </span>
              </h1>
              <p className="mt-5 text-lg text-white/80 animate-fade-up">{t('subtitle')}</p>

              {/* Aylanuvchi kategoriya so'zi */}
              <p className="mt-5 flex items-center gap-2 text-white/70 animate-fade-up">
                <span>{th('lookingFor')}</span>
                <span className="font-display text-xl font-bold">
                  <RotatingWord words={rotatingWords} />
                </span>
              </p>

              {/* Qidiruv (glass) */}
              <form
                action="/qidiruv"
                className="mt-6 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-pop max-w-xl animate-fade-up"
              >
                <Search className="ml-3 h-5 w-5 text-slate2" />
                <input
                  name="q"
                  placeholder={t('searchPlaceholder')}
                  className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-ink outline-none placeholder:text-slate2"
                />
                <button className="shrink-0 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700">
                  {t('searchBtn')}
                </button>
              </form>

              {/* Tezkor kategoriya piluslari + xarita CTA */}
              <div className="mt-5 flex flex-wrap items-center gap-2 animate-fade-up">
                {categories.slice(0, 6).map((c) => (
                  <Link
                    key={c.id}
                    href={`/qidiruv?category=${c.slug}`}
                    className="chip bg-white/10 text-white/85 border border-white/15 transition hover:bg-white/20"
                  >
                    <span>{c.icon}</span> {c.name}
                  </Link>
                ))}
                <Link
                  href="/qidiruv"
                  className="chip border border-white/25 bg-transparent font-semibold text-white transition hover:bg-white/10"
                >
                  <MapPin className="h-3.5 w-3.5 text-teal-400" /> {th('ctaMap')}
                </Link>
              </div>

              {/* Ishonch chiplari */}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-teal-400" /> {th('trustVerified')}</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-teal-400" /> {th('trustSecure')}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-teal-400" /> {th('trustOnline')}</span>
              </div>
            </div>
          </div>

          {/* Stats (ixcham, ochiq fon uchun oq kartalar, count-up) */}
          <StatsRow stats={stats} light />
        </div>
      </section>

      {/* ===== KATEGORIYALAR ===== */}
      <section className="container-wide py-16">
        <Reveal>
          <SectionHead title={t('catTitle')} subtitle={t('catSub')} href="/qidiruv" allLabel={allLabel} />
        </Reveal>
        {categories.length === 0 ? (
          <p className="text-slate2 text-sm">{tc('loading')}</p>
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
          <SectionHead title={t('topTitle')} subtitle={t('topSub')} href="/qidiruv" allLabel={allLabel} />
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
      <CategoryRail title={t('restoranTitle')} href="/qidiruv?category=restoran" vendors={restoran} allLabel={allLabel} />
      <CategoryRail title={t('gozallikTitle')} href="/qidiruv?category=gozallik" vendors={gozallik} allLabel={allLabel} />

      {/* ===== CTA ===== */}
      <section className="container-wide py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-aurora p-10 md:p-14">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-teal/30 blur-3xl animate-float" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl">
                <h3 className="font-display text-2xl md:text-3xl font-bold text-white">{t('ctaTitle')}</h3>
                <p className="mt-2 text-white/75">{t('ctaSub')}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/tg"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-navy shadow-pop transition hover:scale-105"
                >
                  <Send className="h-4 w-4 text-brand" /> {t('ctaTelegram')}
                </Link>
                <Link
                  href="/qidiruv"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3.5 text-sm font-semibold text-white border border-white/20 transition hover:bg-white/20"
                >
                  {t('ctaStart')} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function SectionHead({
  title,
  subtitle,
  href,
  allLabel,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  allLabel: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-navy">{title}</h2>
        {subtitle && <p className="mt-1 text-slate2">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand">
          {allLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

function CategoryRail({
  title,
  href,
  vendors,
  allLabel,
}: {
  title: string;
  href: string;
  vendors: Vendor[];
  allLabel: string;
}) {
  if (!vendors || vendors.length === 0) return null;
  return (
    <section className="container-wide py-10">
      <Reveal>
        <SectionHead title={title} href={href} allLabel={allLabel} />
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
