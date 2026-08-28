import type { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import { getLocale, getTranslations } from 'next-intl/server';
import { MapPin } from 'lucide-react';
import { api, type Category } from '@/lib/api';
import { Reveal } from '@/components/reveal';
import { districtSlug } from '@/lib/geo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing');
  return {
    title: t('hubTitle'),
    description: t('hubDesc'),
    alternates: { canonical: '/xizmatlar' },
  };
}

export default async function XizmatlarHub() {
  const locale = await getLocale();
  const t = await getTranslations('landing');
  const [categories, districts] = await Promise.all([
    api.categories(locale).catch(() => [] as Category[]),
    api.districts().catch(() => [] as { district: string; count: number }[]),
  ]);

  return (
    <div className="container-wide py-8 md:py-12">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-navy md:text-4xl">{t('hubH1')}</h1>
        <p className="mt-2 text-slate2">{t('hubIntro')}</p>
      </header>

      <div className="mt-8 space-y-6">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={i * 30}>
            <section className="rounded-2xl border border-line bg-surface p-5">
              <Link href={`/qidiruv?category=${c.slug}`} className="inline-flex items-center gap-2 font-display text-lg font-bold text-navy hover:text-brand">
                <span className="text-xl">{c.icon}</span> {c.name}
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                {districts.map((d) => (
                  <Link key={d.district} href={`/xizmatlar/${c.slug}/${districtSlug(d.district)}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-sm text-navy transition hover:border-brand-200 hover:bg-surface hover:text-brand">
                    <MapPin size={13} className="text-brand" /> {d.district}
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
