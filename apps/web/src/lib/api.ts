import { authFetch } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// Avtorizatsiyali so'rov — authFetch (Bearer xotiradan + 401'da jim refresh).
async function authed<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `API ${path} → ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch { /* ignore */ }
    const e = new Error(msg) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  return res.json() as Promise<T>;
}

/** Ochiq (avtorizatsiyasiz) POST — JSON. */
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

/** So'rov satriga `lang` ni to'g'ri ulaydi (? yoki & bilan). */
function withLang(qs: string, lang?: string): string {
  if (!lang) return qs;
  return qs.includes('?') ? `${qs}&lang=${lang}` : `${qs}?lang=${lang}`;
}

export const api = {
  categories: (lang?: string) => get<Category[]>(withLang('/categories', lang)),
  vendors: (qs = '', lang?: string) => get<Vendor[]>(withLang(`/vendors${qs}`, lang)),
  vendor: (slug: string, lang?: string) => get<VendorDetail>(withLang(`/vendors/${slug}`, lang)),
  facets: (qs = '', lang?: string) => get<Facets>(withLang(`/vendors/facets${qs}`, lang)),
  assistantStatus: () => get<{ enabled: boolean }>('/assistant/status'),
  assistantChat: (messages: ChatTurn[], lang?: string) =>
    post<AssistantReply>('/assistant/chat', { messages, lang }),
  properties: (qs = '') => get<Property[]>(`/properties${qs}`),
  property: (id: string) => get<PropertyDetail>(`/properties/${id}`),
  availability: (serviceId: string, date: string) =>
    get<Availability>(`/bookings/availability?serviceId=${encodeURIComponent(serviceId)}&date=${date}`),
  createBooking: (body: { serviceId: string; slotStart: string; note?: string }) =>
    authed<Booking>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  myBookings: () => authed<Booking[]>('/bookings/me'),
  cancelBooking: (id: string) => authed<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  createPayment: (body: { bookingId: string; provider: 'PAYME' | 'CLICK' }) =>
    authed<PaymentInvoice>('/payments', { method: 'POST', body: JSON.stringify(body) }),
  paymentStatus: (id: string) => authed<Payment>(`/payments/${id}`),
  base: BASE,
};

export interface Category { id: string; slug: string; name: string; icon?: string; _count?: { vendors: number } }
export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface AssistantReply {
  reply: string;
  vendors: Vendor[];
  filters: Record<string, string | number | boolean> | null;
  searchUrl: string | null;
}
export interface FacetCategory { slug: string; name: string; icon?: string; count: number }
export interface PriceRange { min: number; max: number }
export interface Facets { total: number; categories: FacetCategory[]; priceRange?: PriceRange | null }
export interface Vendor {
  id: string; slug: string; name: string; description?: string; district?: string;
  lat: number; lng: number; address?: string | null; phone?: string | null;
  rating: number; reviewCount: number; photos: string[]; verified: boolean;
  distanceKm?: number | null; category?: { slug: string; name: string; icon?: string };
}
/** Ijtimoiy tarmoq havolalari (`Vendor.socials` JSON). */
export interface VendorSocials {
  instagram?: string; telegram?: string; facebook?: string; youtube?: string; website?: string;
}
/** Kategoriyaga xos boy kontent (`Vendor.attributes` JSON). Barcha maydonlar ixtiyoriy. */
export interface VendorAttributes {
  tagline?: string;
  established?: number;
  experienceYears?: number;
  /** Statistika counterlari (hero ostidagi raqamlar). value raqam yoki "12+" ko'rinishida. */
  counters?: { value: string; label: string }[];
  /** Jamoa/shifokorlar — ko'rsatish uchun (bron uchun `staff` alohida). */
  team?: { name: string; role?: string; photo?: string; exp?: string }[];
  /** Qo'shimcha galereya rasmlari (`photos`dan tashqari). */
  gallery?: string[];
  /** Imkoniyatlar/qulayliklar teglari. */
  amenities?: string[];
  guarantee?: string;
  emergency?: boolean;
  insurance?: string[];
  priceNote?: string;
}
export interface VendorDetail extends Vendor {
  phone?: string; address?: string; hours?: Record<string, string>;
  socials?: VendorSocials;
  attributes?: VendorAttributes;
  services: { id: string; name: string; price: string; durationMin: number }[];
  staff: { id: string; name: string; avatarUrl?: string | null; role?: string | null }[];
  reviews: {
    id: string; rating: number; text?: string; createdAt: string;
    photos?: string[]; criteria?: Record<string, number>;
    user?: { name?: string; avatarUrl?: string | null };
  }[];
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
  payment?: Payment | null;
}
export type PaymentProviderId = 'PAYME' | 'CLICK';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export interface Payment {
  id: string; status: PaymentStatus; amount: string; provider: string; paidAt?: string | null;
  bookingId?: string | null; currency?: string; createdAt?: string;
}
export interface PaymentInvoice extends Payment {
  checkoutUrl: string;
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
