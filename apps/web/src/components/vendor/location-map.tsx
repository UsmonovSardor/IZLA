'use client';
import { MapPin, Navigation } from 'lucide-react';
import { VendorMap } from '@/components/vendor-map';
import type { VendorDetail } from '@/lib/api';

/** Bitta vendor uchun joylashuv kartasi — MapLibre xarita + manzil + "yo'l ko'rsatish". */
export function LocationMap({
  vendor, heading, subheading, accent, detailsWord, reviewsWord, directionsWord,
}: {
  vendor: VendorDetail; heading: string; subheading?: string; accent: string;
  detailsWord: string; reviewsWord: string; directionsWord: string;
}) {
  const mapVendor = {
    id: vendor.id, slug: vendor.slug, name: vendor.name, lat: vendor.lat, lng: vendor.lng,
    rating: vendor.rating, reviewCount: vendor.reviewCount, district: vendor.district ?? '',
    photos: vendor.photos, verified: vendor.verified, category: vendor.category,
  } as never;
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${vendor.lat},${vendor.lng}`;

  return (
    <section>
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{subheading}</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>
      </div>
      <div className="mt-8 overflow-hidden rounded-3xl border border-line shadow-card">
        <VendorMap
          vendors={[mapVendor]}
          selectedId={vendor.id}
          hoveredId={null}
          onSelect={() => {}}
          labels={{ details: detailsWord, reviews: (n: number) => `${n} ${reviewsWord}` }}
          className="h-[360px] w-full"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface px-5 py-4">
          <span className="flex items-center gap-2 text-sm text-ink">
            <MapPin className="h-4 w-4" style={{ color: accent }} />
            {vendor.address || vendor.district}
          </span>
          <a
            href={gmaps} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            <Navigation className="h-4 w-4" />
            {directionsWord}
          </a>
        </div>
      </div>
    </section>
  );
}
