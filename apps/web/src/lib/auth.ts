// Klient auth: access token XOTIRADA (localStorage EMAS — XSS himoyasi).
// Refresh token httpOnly cookie'da (API o'rnatadi). authFetch 401'da jim yangilaydi.
// (Bu modul faqat funksiyalar — 'use client' kerak emas; server ham import qila oladi.)

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const PHONE_KEY = 'izla_phone';

let accessToken: string | null = null;
export function getAccess(): string | null {
  return accessToken;
}
export function setAccess(t: string | null) {
  accessToken = t;
}

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  provider: 'phone' | 'telegram' | 'google';
  role: string;
  locale: string;
  avatarUrl: string | null;
  coins: number;
}
export interface Session {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}
export interface Providers {
  phone: boolean;
  telegram: boolean;
  google: boolean;
}
interface AuthResp {
  access: string;
  user: AuthUser;
}

async function toError(res: Response): Promise<Error> {
  let msg = `Xatolik (${res.status})`;
  try {
    const b = await res.json();
    if (b?.message) msg = Array.isArray(b.message) ? b.message.join(', ') : b.message;
  } catch {
    /* ignore */
  }
  const e = new Error(msg) as Error & { status?: number };
  e.status = res.status;
  return e;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await toError(res);
  return res.json() as Promise<T>;
}

// ---------- kirish oqimi ----------

export function requestOtp(phone: string): Promise<{ resendAfter: number; expiresIn: number; devHint?: string }> {
  return post('/auth/otp/request', { phone });
}

export async function verifyOtp(phone: string, code: string): Promise<AuthResp> {
  const r = await post<AuthResp>('/auth/otp/verify', { phone, code });
  setAccess(r.access);
  savePhone(phone);
  return r;
}

export async function telegramLogin(initData: string): Promise<AuthResp> {
  const r = await post<AuthResp>('/auth/telegram', { initData });
  setAccess(r.access);
  return r;
}

/** Sahifa yuklanganda jim tiklash (cookie mavjud bo'lsa). */
export async function refreshSession(): Promise<AuthUser | null> {
  try {
    const r = await post<AuthResp>('/auth/refresh');
    setAccess(r.access);
    return r.user;
  } catch {
    setAccess(null);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await post('/auth/logout');
  } catch {
    /* ignore */
  }
  setAccess(null);
}

export async function getProviders(): Promise<Providers> {
  try {
    const res = await fetch(`${BASE}/auth/providers`, { cache: 'no-store' });
    return (await res.json()) as Providers;
  } catch {
    return { phone: true, telegram: false, google: false };
  }
}

export function googleLoginUrl(): string {
  return `${BASE}/auth/google`;
}

// ---------- avtorizatsiyali so'rov (Bearer + 401→refresh→retry) ----------

export async function authFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const res = await fetch(`${BASE}${path}`, { ...init, credentials: 'include', headers });
  if (res.status === 401 && retry) {
    const user = await refreshSession();
    if (user) return authFetch(path, init, false);
  }
  return res;
}

// ---------- profil / sessiyalar ----------

export async function fetchMe(): Promise<AuthUser> {
  const r = await authFetch('/auth/me');
  if (!r.ok) throw await toError(r);
  return r.json() as Promise<AuthUser>;
}

export async function updateProfile(data: { name?: string; locale?: string; avatarUrl?: string }): Promise<AuthUser> {
  const r = await authFetch('/auth/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw await toError(r);
  return r.json() as Promise<AuthUser>;
}

export async function fetchSessions(): Promise<Session[]> {
  const r = await authFetch('/auth/sessions');
  if (!r.ok) throw await toError(r);
  return r.json() as Promise<Session[]>;
}

export async function revokeSession(id: string): Promise<void> {
  const r = await authFetch(`/auth/sessions/${id}`, { method: 'DELETE' });
  if (!r.ok) throw await toError(r);
}

// ---------- yordamchi ----------

export function getSavedPhone(): string {
  if (typeof window === 'undefined') return '+998';
  return localStorage.getItem(PHONE_KEY) ?? '+998';
}
function savePhone(p: string) {
  if (typeof window !== 'undefined') localStorage.setItem(PHONE_KEY, p);
}
