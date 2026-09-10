'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/components/auth-provider';
import { telegramLogin } from '@/lib/auth';
import {
  getWebApp,
  isTelegram,
  setChrome,
  backButton,
  type TgUser,
} from '@/lib/telegram';
import { TgTabbar } from './tg-tabbar';

interface TgState {
  ready: boolean;
  inTelegram: boolean;
  tgUser: TgUser | null;
  colorScheme: 'light' | 'dark';
}
const TgContext = createContext<TgState>({ ready: false, inTelegram: false, tgUser: null, colorScheme: 'light' });
export const useTg = () => useContext(TgContext);

// Ildiz tab yo'llari — bularда BackButton yashiriladi.
const ROOT_ROUTES = ['/tg', '/tg/qidiruv', '/tg/bronlar', '/tg/profil'];

// Palitraga mos Telegram header/fon ranglari.
const CHROME = {
  light: { header: '#ffffff', bg: '#f6f8fc' },
  dark: { header: '#0b1f33', bg: '#0b1f33' },
};

export function TgApp({ children }: { children: React.ReactNode }) {
  const { applyUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<TgState>({ ready: false, inTelegram: false, tgUser: null, colorScheme: 'light' });
  const loggedIn = useRef(false);

  const applyTheme = useCallback((scheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (scheme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.setAttribute('data-theme', 'light');
    const c = CHROME[scheme];
    setChrome(c.header, c.bg);
  }, []);

  const setViewportVar = useCallback(() => {
    const wa = getWebApp();
    if (wa?.viewportStableHeight) {
      document.documentElement.style.setProperty('--tg-vh', `${wa.viewportStableHeight}px`);
    }
  }, []);

  const init = useCallback(() => {
    const wa = getWebApp();
    const scheme = wa?.colorScheme ?? 'light';
    if (wa) {
      try { wa.ready(); } catch { /* ignore */ }
      try { wa.expand(); } catch { /* ignore */ }
    }
    applyTheme(scheme);
    setViewportVar();
    setState({
      ready: true,
      inTelegram: isTelegram(),
      tgUser: wa?.initDataUnsafe?.user ?? null,
      colorScheme: scheme,
    });

    // initData bilan sessiya ochamiz (HMAC server tekshiruvi). Bir marta.
    if (wa?.initData && !loggedIn.current) {
      loggedIn.current = true;
      telegramLogin(wa.initData)
        .then((r) => applyUser(r.user))
        .catch(() => { loggedIn.current = false; });
    }

    // Tema/viewport o'zgarishlarini kuzatamiz.
    if (wa) {
      const onTheme = () => {
        const s = getWebApp()?.colorScheme ?? 'light';
        applyTheme(s);
        setState((p) => ({ ...p, colorScheme: s }));
      };
      const onViewport = () => setViewportVar();
      try {
        wa.onEvent('themeChanged', onTheme);
        wa.onEvent('viewportChanged', onViewport);
      } catch { /* ignore */ }
    }
  }, [applyTheme, applyUser, setViewportVar]);

  // Agar SDK skript boshqa sahifada allaqachon yuklangan bo'lsa (layout qayta mount bo'lmaydi,
  // lekin himoya sifatida) — mavjud bo'lsa darrov init.
  useEffect(() => {
    if (getWebApp() && !state.ready) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fon scroll'ini bloklaymiz (native app hissi) — tg ochilganda.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // BackButton — ildiz bo'lmagan yo'llarda ko'rsatiladi, bosilганda orqaga.
  useEffect(() => {
    const isRoot = ROOT_ROUTES.includes(pathname ?? '');
    const cleanup = backButton(!isRoot, isRoot ? undefined : () => router.back());
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [pathname, router]);

  return (
    <TgContext.Provider value={state}>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={init}
      />
      <div className="tg-shell fixed inset-x-0 top-0 z-[60] flex flex-col overflow-hidden bg-bg text-ink">
        <div className="tg-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
        <TgTabbar />
      </div>
    </TgContext.Provider>
  );
}
