import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BadgeCheck, Building2, TrendingUp } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { api, type PropertyDetail } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { LeadForm } from '@/components/lead-form';
import { formatUZS } from '@/lib/utils';
import { JsonLd } from '@/components/json-ld';
import { abs, breadcrumbJsonLd } from '@/lib/seo';
import type { Metadata } from 'next';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

const TYPE_KEY: Record<string, string> = { NEW: 'typeNewLong', CONSTRUCTION: 'typeConstruction', SECONDARY: 'typeSecondary', RENT: 'typeRent' };

const loadProperty = cache((id: string) => api.property(id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await loadProperty(id);
    const title = p.title;
    const description = `${p.title} — ${p.rooms}-xona, ${p.areaM2} m²${p.district ? `, ${p.district}` : ''}. Narx: ${formatUZS(p.price)}. Izla.uz.`.slice(0, 165);
    const img = p.photos?.[0];
    return {
      title,
      description,
      alternates: { canonical: `/uylar/${id}` },
      openGraph: { type: 'website', title, description, url: abs(`/uylar/${id}`), ...(img ? { images: [img] } : {}) },
      twitter: { card: 'summary_large_image', title, description, ...(img ? { images: [img] } : {}) },
    };
  } catch {
    return { title: 'Topilmadi', robots: { index: false } };
  }
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('realEstate');
  let p: PropertyDetail;
  try {
    p = await loadProperty(id);
  } catch {
    notFound();
  }

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    ...(p.photos?.length ? { image: p.photos } : {}),
    description: `${p.rooms}-xona · ${p.areaM2} m²${p.district ? ` · ${p.district}` : ''}`,
    offers: {
      '@type': 'Offer',
      price: String(p.price).replace(/[^\d.]/g, ''),
      priceCurrency: 'UZS',
      availability: 'https://schema.org/InStock',
      url: abs(`/uylar/${p.id}`),
    },
  };
  const crumbs = [
    { name: 'Bosh sahifa', path: '/' },
    { name: "Ko'chmas mulk", path: '/uylar' },
    { name: p.title, path: `/uylar/${p.id}` },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <JsonLd data={[productLd, breadcrumbJsonLd(crumbs)]} />
      <div className="md:col-span-2 space-y-5">
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-bg">
          <Image src={p.photos[0] ?? 'https://picsum.photos/seed/uy/1200/700'} alt={p.title} fill className="object-cover" sizes="66vw" />
          <Badge className="absolute top-3 left-3 bg-surface/90 text-ink">{t(TYPE_KEY[p.type] ?? 'typeNewLong')}</Badge>
        </div>

        <div>
          <div className="font-display text-3xl font-bold text-navy">{formatUZS(p.price)}</div>
          <div className="text-muted">{formatUZS(p.pricePerM2 ?? 0)}/m²</div>
          <h1 className="mt-2 text-xl font-semibold text-ink">{p.title}</h1>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            {[[t('roomsLabel'), p.rooms], [t('areaLabel'), `${p.areaM2} m²`], [t('floorLabel'), p.floor ? `${p.floor}/${p.totalFloors}` : '—']].map(([k, val]) => (
              <div key={String(k)} className="rounded-lg border border-line bg-surface p-3">
                <div className="text-lg font-semibold text-navy">{val}</div>
                <div className="text-xs text-muted">{k}</div>
              </div>
            ))}
          </div>
          {p.description && <p className="mt-4 text-ink">{p.description}</p>}
        </div>

        {/* Qurilish progressi */}
        {p.complex && p.type === 'CONSTRUCTION' && (
          <section className="rounded-lg border border-line bg-surface p-4">
            <h2 className="font-display font-bold text-navy flex items-center gap-2"><TrendingUp className="h-5 w-5 text-warning" />{t('constructionProgress')}</h2>
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">{t('readiness')}</span>
                <span className="font-semibold text-ink">{p.complex.readinessPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-line overflow-hidden">
                <div className="h-full bg-brand-gradient" style={{ width: `${p.complex.readinessPercent}%` }} />
              </div>
            </div>
            {p.complex.constructionUpdates?.map((u) => (
              <p key={u.id} className="mt-2 text-sm text-muted">• {u.note} ({u.readinessPercent}%)</p>
            ))}
          </section>
        )}

        {/* Developer */}
        {p.complex?.developer && (
          <section className="rounded-lg border border-line bg-surface p-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-brand/10"><Building2 className="h-6 w-6 text-brand" /></div>
            <div>
              <div className="font-semibold text-ink flex items-center gap-1">
                {p.complex.developer.name}
                {p.complex.developer.verified && <BadgeCheck className="h-4 w-4 text-brand" />}
              </div>
              <div className="text-sm text-muted">{t('developer', { rating: p.complex.developer.rating })}</div>
            </div>
          </section>
        )}
      </div>

      <aside className="md:sticky md:top-20 h-fit">
        <LeadForm propertyId={p.id} />
      </aside>
    </div>
  );
}
