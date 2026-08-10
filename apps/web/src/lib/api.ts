const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function authed<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `API ${path} → ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  categories: () => get<Category[]>('/categories'),
  vendors: (qs = '') => get<Vendor[]>(`/vendors${qs}`),
  vendor: (slug: string) => get<VendorDetail>(`/vendors/${slug}`),
  properties: (qs = '') => get<Property[]>(`/properties${qs}`),
  property: (id: string) => get<PropertyDetail>(`/properties/${id}`),
  availability: (serviceId: string, date: string) =>
    get<Availability>(`/bookings/availability?serviceId=${encodeURIComponent(serviceId)}&date=${date}`),
  createBooking: (token: string, body: { serviceId: string; slotStart: string; note?: string }) =>
    authed<Booking>('/bookings', token, { method: 'POST', body: JSON.stringify(body) }),
  myBookings: (token: string) => authed<Booking[]>('/bookings/me', token),
  cancelBooking: (token: string, id: string) =>
    authed<Booking>(`/bookings/${id}/cancel`, token, { method: 'PATCH' }),
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
export interface Slot { start: string; end: string; available: boolean }
export interface Availability {
  serviceId: string; serviceName: string; vendorId: string; vendorName: string;
  staffId?: string | null; date: string; durationMin: number; slots: Slot[];
}
export interface Booking {
  id: string; status: string; slotStart: string; slotEnd: string; note?: string; createdAt?: string;
  vendor?: { name: string; slug: string; address?: string; phone?: string };
  service?: { name: string; price: string; durationMin: number };
  staff?: { name: string } | null;
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
