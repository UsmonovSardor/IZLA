import type { Vendor } from '@/lib/api';

/** Toshkent markazi (lng, lat) */
export const TASHKENT: [number, number] = [69.2797, 41.3111];

export const BRAND = '#2563EB';
export const TEAL = '#14B8A6';
export const VIOLET = '#7C3AED';
export const NAVY = '#0B1F33';

export type MapLabels = { details: string; reviews: (n: number) => string };

/** Barcha xarita provayderlari (MapLibre / 2GIS) uchun yagona prop shakli. */
export type VendorMapProps = {
  vendors: Vendor[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  labels: MapLabels;
  className?: string;
};

/** XSS'siz HTML matn — popup/marker ichiga qo'yishdan oldin. */
export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

/** Koordinatasi bor vendorlar (xaritaga qo'yiladiganlar). */
export function withGeo(vendors: Vendor[]): Vendor[] {
  return vendors.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng));
}

/** Popup/kartaning ichki HTML'i — provayderlar orasida bir xil ko'rinish. */
export function popupCardHTML(v: Vendor, labels: MapLabels): string {
  const rating = Number(v.rating).toFixed(1);
  const img = v.photos?.[0]
    ? `<span class="izla-pop-img" style="background-image:url('${esc(v.photos[0])}')"></span>`
    : '';
  const loc = [esc(v.category?.name ?? ''), esc(v.district ?? '')].filter(Boolean).join(' · ');
  return `<a class="izla-pop" href="/vendor/${esc(v.slug)}">
    ${img}
    <span class="izla-pop-body">
      <span class="izla-pop-title">${esc(v.name)}</span>
      <span class="izla-pop-meta"><b>★ ${rating}</b> · ${esc(labels.reviews(Number(v.reviewCount) || 0))}</span>
      <span class="izla-pop-cat">${esc(v.category?.icon ?? '📍')} ${loc}</span>
      <span class="izla-pop-link">${esc(labels.details)} →</span>
    </span>
  </a>`;
}
