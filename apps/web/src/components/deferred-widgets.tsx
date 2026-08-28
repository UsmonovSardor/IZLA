'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

/**
 * Og'ir, interaksiyaga bog'liq global widgetlar — initial bundle'dan CHIQARILGAN.
 *
 * AI yordamchi (framer-motion panel) va ⌘K komanda paneli birinchi ekranda
 * ko'rinmaydi va SEO qiymati yo'q → `ssr:false` + sahifa interaktiv bo'lgach
 * (idle) yuklanadi. Shu bois birinchi JS bundle sezilarli yengillashadi.
 *
 * ⌘K panel klaviatura (Ctrl/⌘+K) yoki 'izla:open-command' hodisasi bilan
 * ochiladi — mount bo'lgunча hodisa listener yo'q, shuning uchun palette o'zi
 * darrov (mount) yuklanadi; AI yordamchi launcher ko'rinishi kerak, u ham darrov.
 */
const AiAssistant = dynamic(() => import('./ai-assistant').then((m) => m.AiAssistant), { ssr: false });
const CommandPalette = dynamic(() => import('./command-palette').then((m) => m.CommandPalette), { ssr: false });

export function DeferredWidgets() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(() => setMounted(true), { timeout: 3000 })
      : window.setTimeout(() => setMounted(true), 1500);
    // ⌘K bosilsa idle'ni kutmasdan darrov yuklaymiz; mount bo'lgach palette
    // o'z listener'ini ulaydi, shu bois ochish hodisasini qayta yuboramiz.
    const reopen = () => setTimeout(() => window.dispatchEvent(new Event('izla:open-command')), 60);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        setMounted((m) => {
          if (!m) reopen();
          return true;
        });
      }
    };
    const onOpen = () => setMounted(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('izla:open-command', onOpen as EventListener);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else clearTimeout(id);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('izla:open-command', onOpen as EventListener);
    };
  }, []);

  if (!mounted) return null;
  return (
    <>
      <CommandPalette />
      <AiAssistant />
    </>
  );
}
