'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { api, type Category } from '@/lib/api';

// Telegram WebApp tiplari (minimal)
interface TgWebApp {
  ready: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe: { user?: { first_name?: string; username?: string } };
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
}
declare global {
  interface Window {
    Telegram?: { WebApp: TgWebApp };
  }
}

export default function TgMiniApp() {
  const [name, setName] = useState<string>('');
  const [authed, setAuthed] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function initTelegram() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    setName(tg.initDataUnsafe.user?.first_name ?? 'Foydalanuvchi');
    setReady(true);

    // Backend'ga initData yuborib autentifikatsiya (HMAC tekshiruvi server tomonda)
    if (tg.initData) {
      fetch(`${api.base}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(() => setAuthed(true))
        .catch(() => setAuthed(false));
    }
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={initTelegram} />
      <div className="space-y-6">
        <div className="rounded-xl bg-brand-gradient text-white p-6">
          <h1 className="font-display text-2xl font-bold">Izla Mini App</h1>
          <p className="text-white/90 text-sm mt-1">
            {ready ? `Salom, ${name}! ${authed ? '✓ tasdiqlangan' : ''}` : 'Telegram ichida oching — barcha xizmatlar shu yerda.'}
          </p>
        </div>

        <div>
          <h2 className="font-display font-bold text-navy mb-3">Kategoriyalar</h2>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((c) => (
              <Link key={c.id} href={`/qidiruv?category=${c.slug}`} className="flex flex-col items-center gap-1 rounded-lg bg-surface border border-line p-3">
                <span className="text-xl">{c.icon}</span>
                <span className="text-[10px] text-center text-ink leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/qidiruv" className="rounded-lg bg-brand text-white text-center py-3 font-medium">Qidiruv</Link>
          <Link href="/uylar" className="rounded-lg bg-teal text-white text-center py-3 font-medium">Ko‘chmas mulk</Link>
        </div>

        {!authed && ready && (
          <p className="text-xs text-slate2 text-center">
            Auth uchun <code>TELEGRAM_BOT_TOKEN</code> backend .env’da sozlangan bo‘lishi kerak.
          </p>
        )}
      </div>
    </>
  );
}
