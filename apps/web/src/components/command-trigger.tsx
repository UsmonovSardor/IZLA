'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

function openPalette() {
  window.dispatchEvent(new Event('izla:open-command'));
}

/** Header'dagi "Qidirish ⌘K" tugmasi — command palette'ni ochadi. */
export function CommandTrigger() {
  const t = useTranslations('cmd');
  const [mac, setMac] = useState(false);
  useEffect(() => {
    try { setMac(/Mac|iPhone|iPad/.test(navigator.platform)); } catch { /* ignore */ }
  }, []);

  return (
    <>
      {/* Desktop: kengroq tugma */}
      <button
        onClick={openPalette}
        aria-label={t('open')}
        className="hidden items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-sm text-slate2 transition hover:border-brand-200 hover:text-brand lg:inline-flex"
      >
        <Search size={15} />
        <span>{t('open')}</span>
        <kbd className="rounded border border-line bg-bg px-1.5 py-0.5 text-[10px] font-medium">{mac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      {/* Mobil/planshet: ikonka */}
      <button
        onClick={openPalette}
        aria-label={t('open')}
        className="grid h-9 w-9 place-items-center rounded-full text-slate2 transition hover:bg-brand-50 hover:text-brand lg:hidden"
      >
        <Search size={18} />
      </button>
    </>
  );
}
