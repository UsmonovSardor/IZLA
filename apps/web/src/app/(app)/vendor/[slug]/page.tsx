import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BadgeCheck, Clock, MapPin, Phone } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { api, type VendorDetail } from '@/lib/api';
import { Rating } from '@/components/ui/rating';
import { Button } from '@/components/ui/button';
import { BookingWidget } from '@/components/booking-widget';
import { formatUZS } from '@/lib/utils';
import { JsonLd } from '@/components/json-ld';
import { abs, breadcrumbJsonLd, vendorJsonLd } from '@/lib/seo';
import type { Metadata } from 'next';
import { cache } from 'react';

export const dynamic = 'force-dynamic';

// generateMetadata va sahifa bir xil vendorni oladi — cache() ikki so'rovni birlashtiradi.
const loadVendor = cache((slug: string, locale: string) => api.vendor(slug, locale));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  try {
    const v = await loadVendor(slug, locale);
    const title = v.district ? `${v.name} — ${v.district}` : v.name;
    const description = (v.description || `${v.name} — Izla.uz'da reyting, xizmatlar va narxlar. Online navbatsiz bron qiling.`).slice(0, 165);
    const img = v.photos?.[0];
    return {
      title,
      description,
      alternates: { canonical: `/vendor/${slug}` },
      openGraph: { type: 'website', title, description, url: abs(`/vendor/${slug}`), ...(img ? { images: [img] } : {}) },
      twitter: { card: 'summary_large_image', title, description, ...(img ? { images: [img] } : {}) },
    };
  } catch {
    return { title: 'Topilmadi', robots: { index: false } };
  }
}

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations('vendor');
  let v: VendorDetail;
  try {
    v = await loadVendor(slug, locale);
  } catch {
    notFound();
  }

  const crumbs = [{ name: 'Bosh sahifa', path: '/' }];
  if (v.category) crumbs.push({ name: v.category.name, path: `/qidiruv?category=${v.category.slug}` });
  crumbs.push({ name: v.name, path: `/vendor/${v.slug}` });

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <JsonLd data={[vendorJsonLd(v), breadcrumbJsonLd(crumbs)]} />
      <div className="md:col-span-2 space-y-6">
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-bg">
          <Image src={v.photos[0] ?? 'https://picsum.photos/seed/izla/1200/700'} alt={v.name} fill className="object-cover" sizes="66vw" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-navy">{v.name}</h1>
            {v.verified && <BadgeCheck className="h-6 w-6 text-brand" />}
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm">
            <Rating value={v.rating} count={v.reviewCount} />
            <span className="text-slate2 flex items-center gap-1"><MapPin className="h-4 w-4" />{v.district}</span>
          </div>
          {v.description && <p className="mt-3 text-ink">{v.description}</p>}
        </div>

        <section>
          <h2 className="font-display text-lg font-bold text-navy mb-3">{t('services')}</h2>
          <div className="divide-y divide-line rounded-lg border border-line bg-surface">
            {v.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium text-ink">{s.name}</div>
                  <div className="text-xs text-slate2 flex items-center gap-1"><Clock className="h-3 w-3" />{t('minutes', { count: s.durationMin })}</div>
                </div>
                <div className="font-mono font-semibold text-navy">{formatUZS(s.price)}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-navy mb-3">{t('reviewsTitle', { count: v.reviews.length })}</h2>
          <div className="space-y-3">
            {v.reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{r.user?.name ?? t('anonUser')}</span>
                  <Rating value={r.rating} />
                </div>
                {r.text && <p className="mt-1 text-sm text-slate2">{r.text}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky bron paneli */}
      <aside className="md:sticky md:top-20 h-fit space-y-3">
        {v.services.length > 0 ? (
          <BookingWidget services={v.services} vendorName={v.name} />
        ) : (
          <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <Button className="w-full" disabled>{t('noBooking')}</Button>
          </div>
        )}
        <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
          {v.phone && <a href={`tel:${v.phone}`} className="mb-2 flex items-center gap-2 text-sm text-ink"><Phone className="h-4 w-4 text-brand" />{v.phone}</a>}
          <Button variant="secondary" className="w-full">{t('callTaxi')}</Button>
        </div>
      </aside>
    </div>
  );
}
