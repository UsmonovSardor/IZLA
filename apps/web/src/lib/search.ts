/**
 * Qidiruv filtr holati + query qurish — server (page.tsx) va klient (search-explorer)
 * uchun YAGONA manba. Filtrlar URL searchParams'da yashaydi (ulashiladigan, SEO, back).
 * Geolokatsiya (lat/lng) URL'ga YOZILMAYDI (maxfiylik) — faqat klient fetch'ida beriladi.
 */

export type SortKey = 'popular' | 'rating' | 'az';

export type SearchFilters = {
  q?: string;
  category?: string;
  district?: string;
  verified: boolean;
  minRating: number;
  openNow: boolean;
  priceMin?: number;
  priceMax?: number;
  sort: SortKey;
};

export const PAGE_SIZE = 24;

const SORTS: SortKey[] = ['popular', 'rating', 'az'];

export function parseSearchFilters(sp: Record<string, string | undefined>): SearchFilters {
  return {
    q: sp.q || undefined,
    category: sp.category || undefined,
    district: sp.district || undefined,
    verified: sp.verified === 'true',
    minRating: sp.minRating ? Number(sp.minRating) : 0,
    openNow: sp.openNow === 'true',
    priceMin: sp.priceMin ? Number(sp.priceMin) : undefined,
    priceMax: sp.priceMax ? Number(sp.priceMax) : undefined,
    sort: SORTS.includes(sp.sort as SortKey) ? (sp.sort as SortKey) : 'popular',
  };
}

type BuildOpts = {
  withCategory?: boolean;
  page?: number;
  /** Geolokatsiya — berilsa lat/lng + sort=distance (URL'ga emas, faqat fetch). */
  geo?: { lat: number; lng: number } | null;
};

/** `/vendors` ro'yxati uchun query string (paginatsiya + geo). */
export function vendorsQS(f: SearchFilters, opts: BuildOpts = {}): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if ((opts.withCategory ?? true) && f.category) p.set('category', f.category);
  if (f.district) p.set('district', f.district);
  if (f.verified) p.set('verified', 'true');
  if (f.minRating) p.set('minRating', String(f.minRating));
  if (f.openNow) p.set('openNow', 'true');
  if (f.priceMin != null) p.set('priceMin', String(f.priceMin));
  if (f.priceMax != null) p.set('priceMax', String(f.priceMax));
  if (opts.geo) {
    p.set('lat', String(opts.geo.lat));
    p.set('lng', String(opts.geo.lng));
    p.set('sort', 'distance');
  } else if (f.sort) {
    p.set('sort', f.sort);
  }
  if (opts.page) {
    p.set('page', String(opts.page));
    p.set('limit', String(PAGE_SIZE));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** `/vendors/facets` uchun query — kategoriyasiz (chip sanoqlari barcha toifada). */
export function facetsQS(f: SearchFilters): string {
  return vendorsQS(f, { withCategory: false });
}
