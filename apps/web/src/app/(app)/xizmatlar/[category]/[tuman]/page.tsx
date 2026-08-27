import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import { api, type Category, type Vendor } from '@/lib/api';
import { VendorCard } from '@/components/vendor-card';
import { Reveal } from '@/components/reveal';
import { JsonLd } from '@/components/json-ld';
import { abs, breadcrumbJsonLd } from '@/lib/seo';
import { districtSlug, findDistrictBySlug } from '@/lib/geo';

export const dynamic = 'force-dynamic';

type Params = { category: string; tuman: string };

const loadCtx = cache(async (locale: string) => {
  const [categories, districts] = await Promise.all([
    api.categories(locale).catch(() => [] as Category[]),
    api.districts().catch(() => [] as { district: string; count: number }[]),
  ]);
  return { categories, districts };
});

async function resolve(params: Params, locale: string) {
  const { categories, districts } = await loadCtx(locale);
  const category = categories.find((c) => c.slug === params.category);
  const districtNames = districts.map((d) => d.district);
  const district = findDistrictBySlug(params.tuman, districtNames);
  return { category, district, categories, districts };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const locale = await getLocale();
  const { category, district } = await resolve(p, locale);
  if (!category || !district) return { title: 'Topilmadi', robots: { index: false } };
  const t = await getTranslations('landing');
  const title = t('metaTitle', { category: category.name, district });
  const description = t('metaDesc', { category: category.name.toLowerCase(), district });
  return {
    title,
    description,
    alternates: { canonical: `/xizmatlar/${p.category}/${p.tuman}` },
    openGraph: { type: 'website', title, description, url: abs(`/xizmatlar/${p.category}/${p.tuman}`) },
  };
}

export default async function LandingPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const locale = await getLocale();
  const t = await getTranslations('landing');
  const { category, district, categories, districts } = await resolve(p, locale);
  if (!category || !district) notFound();

  const vendors = await api
    .vendors(`?category=${encodeURIComponent(category.slug)}&district=${encodeURIComponent(district)}&sort=rating`, locale)
    .catch(() => [] as Vendor[]);

  const crumbs = [
    { name: 'Izla', path: '/' },
    { name: category.name, path: `/qidiruv?category=${category.slug}` },
    { name: district, path: `/xizmatlar/${p.category}/${p.tuman}` },
  ];

  // Ichki bog'lanish: shu kategoriya uchun boshqa tumanlar + shu tuman uchun boshqa kategoriyalar
  const otherDistricts = districts.filter((d) => d.district !== district).slice(0, 8);
  const otherCategories = categories.filter((c) => c.slug !== category.slug).slice(0, 8);

  return (
    <div className="container-wide py-8 md:py-12">
      <JsonLd data={[breadcrumbJsonLd(crumbs)]} />

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-slate2">
        <Link href="/" className="hover:text-brand">Izla</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <Link href={`/qidiruv?category=${category.slug}`} className="hover:text-brand">{category.icon} {category.name}</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="font-medium text-navy">{district}</span>
      </nav>

      {/* Hero */}
      <header className="mt-4">
        <h1 className="font-display text-3xl font-bold text-navy md:text-4xl">
          {t('h1', { category: category.name, district })}
        </h1>
        <p className="mt-2 max-w-2xl text-slate2">
          {t('intro', { category: category.name.toLowerCase(), district, count: vendors.length })}
        </p>
      </header>

      {/* Vendorlar */}
      {vendors.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.map((v, i) => (
            <Reveal key={v.id} delay={(i % 4) * 60}>
              <VendorCard v={v} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <MapPin className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 text-slate2">{t('empty', { category: category.name.toLowerCase(), district })}</p>
          <Link href={`/qidiruv?category=${category.slug}`} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
            {t('allCategory', { category: category.name })} <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Ichki bog'lanish — boshqa tumanlar */}
      <section className="mt-14 border-t border-line pt-8">
        <h2 className="font-display text-lg font-bold text-navy">{t('otherDistricts', { category: category.name })}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherDistricts.map((d) => (
            <Link key={d.district} href={`/xizmatlar/${p.category}/${districtSlug(d.district)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-navy transition hover:border-brand-200 hover:text-brand">
              <MapPin size={13} className="text-brand" /> {d.district}
            </Link>
          ))}
        </div>
      </section>

      {/* Ichki bog'lanish — boshqa kategoriyalar */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-navy">{t('otherCategories', { district })}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherCategories.map((c) => (
            <Link key={c.slug} href={`/xizmatlar/${c.slug}/${p.tuman}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-navy transition hover:border-brand-200 hover:text-brand">
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
