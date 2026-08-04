const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  categories: () => get<Category[]>('/categories'),
  vendors: (qs = '') => get<Vendor[]>(`/vendors${qs}`),
  vendor: (slug: string) => get<VendorDetail>(`/vendors/${slug}`),
  properties: (qs = '') => get<Property[]>(`/properties${qs}`),
  property: (id: string) => get<PropertyDetail>(`/properties/${id}`),
  base: BASE,
};

export interface Category { id: string; slug: string; name: string; icon?: string; _count?: { vendors: number } }
export interface Vendor {
  id: string; slug: string; name: string; description?: string; district?: string;
  rating: number; reviewCount: number; photos: string[]; verified: boolean;
  distanceKm?: number | null; category?: { slug: string; name: string; icon?: string };
}
export interface VendorDetail extends Vendor {
  phone?: string; address?: string; hours?: Record<string, string>;
  services: { id: string; name: string; price: string; durationMin: number }[];
  staff: { id: string; name: string }[];
  reviews: { id: string; rating: number; text?: string; createdAt: string; user?: { name?: string } }[];
}
export interface Property {
  id: string; type: string; title: string; price: string; pricePerM2?: string;
  areaM2: number; rooms: number; district?: string; photos: string[]; status: string;
  complex?: { name: string; readinessPercent: number; status: string } | null;
}
export interface PropertyDetail extends Property {
  description?: string; floor?: number; totalFloors?: number;
  complex?: {
    name: string; readinessPercent: number; status: string;
    developer?: { name: string; verified: boolean; rating: number };
    constructionUpdates?: { id: string; date: string; readinessPercent: number; note?: string }[];
  } | null;
}
