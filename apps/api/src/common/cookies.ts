import { env } from '../config/env';

export const REFRESH_COOKIE = 'izla_rt';
export const OAUTH_STATE_COOKIE = 'izla_oauth_state';
// Cookie faqat /auth/* yo'llariga yuboriladi (kamroq ekspozitsiya).
const AUTH_PATH = '/auth';

interface CookieRes {
  cookie(name: string, value: string, opts: Record<string, unknown>): void;
  clearCookie(name: string, opts?: Record<string, unknown>): void;
}

/** `Cookie` sarlavhasini parse qiladi (cookie-parser kerak emas). */
export function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Prod (cross-site) → SameSite=None;Secure. Dev (localhost) → Lax.
function baseOpts() {
  const secure = env.COOKIE_SECURE;
  return { httpOnly: true, secure, sameSite: secure ? 'none' : 'lax' } as const;
}

export function setRefreshCookie(res: CookieRes, token: string, maxAgeMs: number) {
  res.cookie(REFRESH_COOKIE, token, { ...baseOpts(), path: AUTH_PATH, maxAge: maxAgeMs });
}

export function clearRefreshCookie(res: CookieRes) {
  res.clearCookie(REFRESH_COOKIE, { ...baseOpts(), path: AUTH_PATH });
}

export function setStateCookie(res: CookieRes, state: string) {
  res.cookie(OAUTH_STATE_COOKIE, state, { ...baseOpts(), path: AUTH_PATH, maxAge: 10 * 60 * 1000 });
}

export function clearStateCookie(res: CookieRes) {
  res.clearCookie(OAUTH_STATE_COOKIE, { ...baseOpts(), path: AUTH_PATH });
}
