'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'izla-pwa-dismissed';

export function PwaRegister() {
  const t = useTranslations('pwa');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Service worker'ni ro'yxatdan o'tkazish
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      try {
        if (localStorage.getItem(DISMISS_KEY)) return;
      } catch {
        /* localStorage bloklangan bo'lishi mumkin */
      }
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setShow(false));
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label={t('installTitle')}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-lg backdrop-blur pwa-banner sm:inset-x-auto sm:right-4"
    >
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand to-teal-400 text-white">
        <Download size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-navy leading-tight">{t('installTitle')}</p>
        <p className="text-slate2 text-xs mt-0.5 leading-snug">{t('installBody')}</p>
      </div>
      <button
        onClick={install}
        className="flex-none rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        {t('install')}
      </button>
      <button
        onClick={dismiss}
        aria-label={t('dismiss')}
        className="flex-none rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={18} />
      </button>
    </div>
  );
}
