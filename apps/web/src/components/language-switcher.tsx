'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, Globe } from 'lucide-react';
import { LOCALE_COOKIE, localeNames, localeShort, locales, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const active = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function choose(l: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setOpen(false);
    if (l !== active) startTransition(() => router.refresh());
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Til / Язык / Language"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand ${
          pending ? 'opacity-60' : ''
        }`}
      >
        <Globe className="h-4 w-4 text-brand" />
        <span>{localeShort[active]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-fade-up">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => choose(l)}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-brand-50 ${
                l === active ? 'font-semibold text-brand' : 'text-ink'
              }`}
            >
              <span
                className={`grid h-6 w-8 shrink-0 place-items-center rounded-md text-[11px] font-bold ${
                  l === active ? 'bg-brand text-white' : 'bg-bg text-muted'
                }`}
              >
                {localeShort[l]}
              </span>
              <span className="flex-1 text-left">{localeNames[l]}</span>
              {l === active && <Check className="h-4 w-4 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
