// Yaqinda ko'rilgan vendorlar — brauzer localStorage'da (serverga tegmaydi, shaxsiy).

export interface RecentVendor {
  slug: string;
  name: string;
  photo?: string;
  category?: string;
  icon?: string;
  rating: number;
  district?: string;
  at: number; // timestamp
}

const KEY = 'izla:recent:v1';
const CAP = 12;

export function readRecent(): RecentVendor[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RecentVendor[]) : [];
  } catch {
    return [];
  }
}

/** Vendorni ro'yxat boshiga qo'yadi (dublikatni olib tashlab), CAP bilan cheklaydi. */
export function pushRecent(item: Omit<RecentVendor, 'at'>): RecentVendor[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = readRecent().filter((r) => r.slug !== item.slug);
    const next = [{ ...item, at: Date.now() }, ...list].slice(0, CAP);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('izla:recent'));
    return next;
  } catch {
    return [];
  }
}

export function clearRecent() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent('izla:recent'));
  } catch { /* ignore */ }
}
