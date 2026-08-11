import type { VendorDetail } from './api';

/** Saytning kanonik manzili. Domenga o'tganda Railway'da NEXT_PUBLIC_SITE_URL=https://izla.uz qo'ying. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://web-production-66316.up.railway.app'
).replace(/\/+$/, '');

/** Nisbiy yo'lni to'liq (absolute) URL'ga aylantiradi. */
export function abs(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Tashkilot (brand) — har sahifada bir marta (layout). */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Izla.uz',
    url: SITE_URL,
    logo: abs('/icon-512.png'),
    description: "O'zbekiston №1 xizmatlar super-platformasi — qidiring, xaritadan toping, online bron qiling.",
  };
}

/** WebSite + Sitelinks Search Box (Google qidiruv oynasi). */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Izla.uz',
    url: SITE_URL,
    inLanguage: ['uz', 'ru', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/qidiruv?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Non (breadcrumb) zanjiri. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

/** Vendor → LocalBusiness (+ reyting, geo, manzil, telefon). */
export function vendorJsonLd(v: VendorDetail) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: v.name,
    url: abs(`/vendor/${v.slug}`),
    ...(v.photos?.length ? { image: v.photos } : {}),
    ...(v.description ? { description: v.description } : {}),
    ...(v.phone ? { telephone: v.phone } : {}),
    ...(v.category?.name ? { '@type': 'LocalBusiness', additionalType: v.category.name } : {}),
    ...(v.address || v.district
      ? { address: { '@type': 'PostalAddress', ...(v.address ? { streetAddress: v.address } : {}), ...(v.district ? { addressLocality: v.district } : {}), addressCountry: 'UZ' } }
      : {}),
    ...(v.lat && v.lng ? { geo: { '@type': 'GeoCoordinates', latitude: v.lat, longitude: v.lng } } : {}),
  };
  if (v.reviewCount > 0 && v.rating > 0) {
    data.aggregateRating = { '@type': 'AggregateRating', ratingValue: v.rating, reviewCount: v.reviewCount, bestRating: 5, worstRating: 1 };
  }
  return data;
}
