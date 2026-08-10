'use client';
// Yengil klient-tomon auth: telefon+OTP orqali token olish va localStorage'da saqlash.
// (To'liq login sahifasi keyingi bosqichda; hozircha bron oqimi uchun yetarli.)

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'izla_token';
const PHONE_KEY = 'izla_phone';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getSavedPhone(): string {
  if (typeof window === 'undefined') return '+998';
  return localStorage.getItem(PHONE_KEY) ?? '+998';
}

export async function requestOtp(phone: string): Promise<{ ok: boolean; devHint?: string }> {
  const res = await fetch(`${BASE}/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error('OTP yuborib bo‘lmadi');
  return res.json();
}

export async function verifyOtp(phone: string, code: string): Promise<{ access: string; userId: string; role: string }> {
  const res = await fetch(`${BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  if (!res.ok) throw new Error('Kod noto‘g‘ri');
  const data = await res.json();
  setToken(data.access);
  localStorage.setItem(PHONE_KEY, phone);
  return data;
}
