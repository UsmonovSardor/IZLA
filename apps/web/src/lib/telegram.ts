// Telegram WebApp SDK — tipli, SSR-xavfsiz o'rov.
// Barcha chaqiruvlar window/versiya mavjudligini tekshiradi va xatoni yutadi
// (eski Telegram klientlarida ba'zi metodlar yo'q — mini app baribir ishlashi kerak).

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotify = 'error' | 'success' | 'warning';

export interface TgThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

export interface TgUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TgBackButton {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}
interface TgMainButton {
  text: string;
  isVisible: boolean;
  isActive: boolean;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
  setParams: (p: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
}
interface TgHaptic {
  impactOccurred: (style: HapticStyle) => void;
  notificationOccurred: (type: HapticNotify) => void;
  selectionChanged: () => void;
}

export interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: TgUser; start_param?: string };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TgThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  ready: () => void;
  expand: () => void;
  close: () => void;
  onEvent: (type: string, cb: () => void) => void;
  offEvent: (type: string, cb: () => void) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  openTelegramLink: (url: string) => void;
  openLink: (url: string, opts?: { try_instant_view?: boolean }) => void;
  showAlert: (msg: string, cb?: () => void) => void;
  showConfirm: (msg: string, cb?: (ok: boolean) => void) => void;
  BackButton: TgBackButton;
  MainButton: TgMainButton;
  HapticFeedback: TgHaptic;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TgWebApp };
  }
}

export function getWebApp(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

/** Haqiqiy Telegram klientida ochilganmi (initData bor). */
export function isTelegram(): boolean {
  const wa = getWebApp();
  return !!wa && typeof wa.initData === 'string' && wa.initData.length > 0;
}

/** Versiya >= talab qilingan (metod mavjudligini gate qilish uchun). */
function versionAtLeast(wa: TgWebApp, target: string): boolean {
  const a = (wa.version || '6.0').split('.').map((n) => parseInt(n, 10));
  const b = target.split('.').map((n) => parseInt(n, 10));
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return true;
}

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    /* eski klient / metod yo'q — jim */
  }
}

// ---------- Haptika (butun app bo'ylab ishlatiladi) ----------
export const haptic = {
  impact(style: HapticStyle = 'light') {
    const wa = getWebApp();
    if (wa && versionAtLeast(wa, '6.1')) safe(() => wa.HapticFeedback.impactOccurred(style));
  },
  notify(type: HapticNotify) {
    const wa = getWebApp();
    if (wa && versionAtLeast(wa, '6.1')) safe(() => wa.HapticFeedback.notificationOccurred(type));
  },
  select() {
    const wa = getWebApp();
    if (wa && versionAtLeast(wa, '6.1')) safe(() => wa.HapticFeedback.selectionChanged());
  },
};

// ---------- Header / fon rangi ----------
export function setChrome(headerColor: string, bgColor: string) {
  const wa = getWebApp();
  if (!wa) return;
  if (versionAtLeast(wa, '6.1')) {
    safe(() => wa.setHeaderColor(headerColor));
    safe(() => wa.setBackgroundColor(bgColor));
  }
}

// ---------- BackButton ----------
export function backButton(show: boolean, onClick?: () => void): (() => void) | void {
  const wa = getWebApp();
  if (!wa) return;
  if (show) {
    if (onClick) safe(() => wa.BackButton.onClick(onClick));
    safe(() => wa.BackButton.show());
    return () => {
      if (onClick) safe(() => wa.BackButton.offClick(onClick));
      safe(() => wa.BackButton.hide());
    };
  }
  safe(() => wa.BackButton.hide());
}

// ---------- Yopish tasdig'i ----------
export function closingConfirmation(on: boolean) {
  const wa = getWebApp();
  if (!wa || !versionAtLeast(wa, '6.2')) return;
  safe(() => (on ? wa.enableClosingConfirmation() : wa.disableClosingConfirmation()));
}

// ---------- Havolalar ----------
export function openLink(url: string) {
  const wa = getWebApp();
  if (wa) {
    if (url.startsWith('https://t.me') || url.includes('t.me/')) safe(() => wa.openTelegramLink(url));
    else safe(() => wa.openLink(url));
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener');
  }
}
