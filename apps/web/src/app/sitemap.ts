import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';

// Sitemap har soatda yangilanadi (vendorlar/uylar qo'shilganda)
export const revalidate = 3600;

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/qidiruv`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/uylar`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  const [vendors, properties, categories] = await Promise.all([
    safe(api.vendors(''), []),
    safe(api.properties(''), []),
    safe(api.categories(), []),
  ]);

  const vendorRoutes: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${SITE_URL}/vendor/${v.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const propertyRoutes: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${SITE_URL}/uylar/${p.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/qidiruv?category=${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...vendorRoutes, ...propertyRoutes, ...categoryRoutes];
}
