'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Link } from 'next-view-transitions';
import { useLocale, useTranslations } from 'next-intl';
import { api, type Category } from '@/lib/api';
import { telegramLogin } from '@/lib/auth';
import { useAuth } from '@/components/auth-provider';

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
  const { applyUser } = useAuth();
  const t = useTranslations('tg');
  const locale = useLocale();
  const [name, setName] = useState<string>('');
  const [authed, setAuthed] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.categories(locale).then(setCategories).catch(() => setCategories([]));
  }, [locale]);

  function initTelegram() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    setName(tg.initDataUnsafe.user?.first_name ?? t('anonUser'));
    setReady(true);

    // initData'ni backendga yuborib sessiya ochamiz (HMAC tekshiruvi serverda)
    if (tg.initData) {
      telegramLogin(tg.initData)
        .then((r) => {
          applyUser(r.user);
          setAuthed(true);
        })
        .catch(() => setAuthed(false));
    }
  }

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={initTelegram} />
      <div className="space-y-6">
        <div className="rounded-xl bg-brand-gradient text-white p-6">
          <h1 className="font-display text-2xl font-bold">{t('title')}</h1>
          <p className="text-white/90 text-sm mt-1">
            {ready ? `${t('greeting', { name })} ${authed ? t('confirmed') : ''}` : t('openInTg')}
          </p>
        </div>

        <div>
          <h2 className="font-display font-bold text-navy mb-3">{t('categories')}</h2>
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
          <Link href="/qidiruv" className="rounded-lg bg-brand text-white text-center py-3 font-medium">{t('search')}</Link>
          <Link href="/uylar" className="rounded-lg bg-teal text-white text-center py-3 font-medium">{t('realEstate')}</Link>
        </div>

        {!authed && ready && (
          <p className="text-xs text-slate2 text-center">{t('authNote')}</p>
        )}
      </div>
    </>
  );
}
