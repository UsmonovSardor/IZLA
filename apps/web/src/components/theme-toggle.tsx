'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const KEY = 'izla:theme';

/**
 * Tema toggle — OPT-IN dark (default light). Tanlov localStorage'да saqlanadi,
 * `data-theme` <html>'ga qo'yiladi. FOUC oldini olish uchun layout'da inline
 * skript ham bor (bu komponent faqat almashtirish tugmasi).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    } catch { /* ignore */ }
  }, []);

  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    setDark(!dark);
    try {
      if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(KEY, next);
    } catch { /* ignore */ }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Yorug‘ rejim' : 'Tungi rejim'}
      title={dark ? 'Yorug‘ rejim' : 'Tungi rejim'}
      className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition hover:text-brand hover:border-brand"
    >
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
