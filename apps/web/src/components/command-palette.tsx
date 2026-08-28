'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Search, Home, Briefcase, Building2, CalendarCheck, Heart, Bookmark, User, HelpCircle, CornerDownLeft, ArrowUp, ArrowDown, History, Star } from 'lucide-react';
import { readRecent, type RecentVendor } from '@/lib/recently-viewed';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Suggestion = { id: string; slug: string; name: string; icon?: string; category: string };
type Item = { key: string; label: string; sub?: string; icon: React.ReactNode; emoji?: string; href: string };

const NAV = [
  { key: 'home', href: '/', Icon: Home },
  { key: 'search', href: '/qidiruv', Icon: Search },
  { key: 'jobs', href: '/ish', Icon: Briefcase },
  { key: 'realEstate', href: '/uylar', Icon: Building2 },
  { key: 'bookings', href: '/bron', Icon: CalendarCheck },
  { key: 'favorites', href: '/sevimlilar', Icon: Heart },
  { key: 'saved', href: '/ish/saqlanganlar', Icon: Bookmark },
  { key: 'profile', href: '/profil', Icon: User },
  { key: 'help', href: '/yordam', Icon: HelpCircle },
] as const;

/** ⌘K global qidiruv/navigatsiya paneli — istalgan sahifadan. */
export function CommandPalette() {
  const t = useTranslations('cmd');
  const locale = useLocale();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sugg, setSugg] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<RecentVendor[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ochish: ⌘K / Ctrl+K + tashqi hodisa (header tugmasi)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('izla:open-command', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('izla:open-command', onOpen);
    };
  }, []);

  // Ochilganda: fokus, recent yuklash, holatni tiklash
  useEffect(() => {
    if (open) {
      setRecent(readRecent().slice(0, 5));
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      setQ('');
      setSugg([]);
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Debounced vendor suggest
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setSugg([]); return; }
    if (timer.current) clearTimeout(timer.current);
    const ctrl = new AbortController();
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/vendors/suggest?q=${encodeURIComponent(term)}&lang=${locale}`, { signal: ctrl.signal });
        if (!res.ok) return;
        setSugg((await res.json()) as Suggestion[]);
      } catch { /* abort / tarmoq — jim */ }
    }, 160);
    return () => { ctrl.abort(); if (timer.current) clearTimeout(timer.current); };
  }, [q, locale]);

  // Ko'rsatiladigan tekis ro'yxat
  const navItems: Item[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    return NAV
      .map((n) => ({ key: `nav:${n.key}`, label: t(`nav.${n.key}`), icon: <n.Icon size={17} />, href: n.href }))
      .filter((it) => !term || it.label.toLowerCase().includes(term));
  }, [q, t]);

  const vendorItems: Item[] = useMemo(
    () => sugg.map((s) => ({ key: `v:${s.id}`, label: s.name, sub: s.category, emoji: s.icon ?? '📍', icon: null, href: `/vendor/${s.slug}` })),
    [sugg]
  );

  const recentItems: Item[] = useMemo(
    () => (q.trim() ? [] : recent.map((r) => ({ key: `r:${r.slug}`, label: r.name, sub: r.district, emoji: r.icon ?? '🕘', icon: null, href: `/vendor/${r.slug}` }))),
    [recent, q]
  );

  // Qidiruv harakati (Enter, moslik yo'q bo'lsa /qidiruv ga)
  const searchAction: Item | null = q.trim()
    ? { key: 'search-all', label: t('searchFor', { q: q.trim() }), icon: <Search size={17} />, href: `/qidiruv?q=${encodeURIComponent(q.trim())}` }
    : null;

  // MUHIM: flat tartibi render tartibiga AYNAN mos bo'lishi kerak (search → vendor → recent → nav)
  const flat: Item[] = useMemo(
    () => [...(searchAction ? [searchAction] : []), ...vendorItems, ...recentItems, ...navItems],
    [searchAction, vendorItems, recentItems, navItems]
  );

  useEffect(() => { setActive(0); }, [q, sugg.length]);

  const go = useCallback((it: Item) => {
    setOpen(false);
    router.push(it.href);
  }, [router]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (flat[active]) go(flat[active]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const renderRow = (it: Item, idx: number) => (
    <button
      key={it.key}
      onMouseEnter={() => setActive(idx)}
      onClick={() => go(it)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${idx === active ? 'bg-brand-50' : 'hover:bg-bg'}`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg text-base text-muted">
        {it.emoji ?? it.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{it.label}</span>
        {it.sub && <span className="block truncate text-xs text-muted">{it.sub}</span>}
      </span>
      {idx === active && <CornerDownLeft size={14} className="shrink-0 text-slate-300" />}
    </button>
  );

  // Guruh chegaralarini bilish uchun indeks hisoblagich
  let idx = -1;
  const next = () => (idx += 1);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          role="dialog" aria-modal="true" aria-label={t('title')}
        >
          <div className="absolute inset-0 bg-[#0B1F33]/40 backdrop-blur-sm" />
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/60 bg-surface/95 shadow-pop backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder={t('placeholder')}
                aria-label={t('placeholder')}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent py-4 text-ink outline-none placeholder:text-muted"
              />
              <kbd className="hidden shrink-0 rounded-md border border-line bg-bg px-1.5 py-0.5 text-[11px] font-medium text-muted sm:block">Esc</kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2" data-lenis-prevent>
              {flat.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted">{t('empty')}</div>
              ) : (
                <>
                  {searchAction && <div className="px-1">{renderRow(searchAction, next())}</div>}
                  {vendorItems.length > 0 && (
                    <Group label={t('resultsTitle')}>{vendorItems.map((it) => renderRow(it, next()))}</Group>
                  )}
                  {recentItems.length > 0 && (
                    <Group label={t('recentTitle')} icon={<History size={12} />}>{recentItems.map((it) => renderRow(it, next()))}</Group>
                  )}
                  {navItems.length > 0 && (
                    <Group label={t('navTitle')}>{navItems.map((it) => renderRow(it, next()))}</Group>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1"><ArrowUp size={12} /><ArrowDown size={12} /> {t('hintNav')}</span>
              <span className="inline-flex items-center gap-1"><CornerDownLeft size={12} /> {t('hintOpen')}</span>
              <span className="ml-auto inline-flex items-center gap-1"><Star size={11} className="fill-warning text-warning" /> Izla</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Group({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-1">
      <div className="flex items-center gap-1 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}{label}
      </div>
      {children}
    </div>
  );
}
