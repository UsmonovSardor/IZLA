'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, CalendarCheck, CreditCard, Briefcase, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { api, type AppNotification } from '@/lib/api';

const ICON: Record<string, typeof Bell> = {
  booking_created: CalendarCheck,
  payment_paid: CreditCard,
  payment_refunded: CreditCard,
  job_application: Briefcase,
  review: Star,
};

export function NotificationsBell() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const loadUnread = useCallback(() => {
    api.notificationsUnread().then((r) => setUnread(r.count)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setUnread(0); setItems(null); return; }
    loadUnread();
    const id = setInterval(loadUnread, 60_000); // yengil polling
    return () => clearInterval(id);
  }, [user, loadUnread]);

  // Tashqariga bosilsa yopish
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const openPanel = () => {
    setOpen((v) => !v);
    if (!open) {
      setItems(null);
      api.notifications().then(setItems).catch(() => setItems([]));
    }
  };

  const markAll = async () => {
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? prev);
    setUnread(0);
    try { await api.notificationsReadAll(); } catch { /* keyingi load tuzatadi */ }
  };

  const rtf = new Intl.RelativeTimeFormat(locale === 'en' ? 'en' : locale === 'ru' ? 'ru' : 'uz', { numeric: 'auto' });
  const ago = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return t('now');
    if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute');
    if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
    return rtf.format(-Math.floor(diff / 86400), 'day');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openPanel}
        aria-label={t('title')}
        className="relative grid h-9 w-9 place-items-center rounded-full text-slate2 transition hover:bg-brand-50 hover:text-brand"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-11 z-50 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="font-display text-sm font-bold text-navy">{t('title')}</h3>
              {items && items.some((n) => !n.read) && (
                <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  <CheckCheck size={13} /> {t('markAll')}
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {items === null ? (
                <div className="py-10 text-center"><Loader2 className="mx-auto animate-spin text-brand" size={18} /></div>
              ) : items.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Bell className="mx-auto text-slate-300" size={28} />
                  <p className="mt-3 text-sm text-slate2">{t('empty')}</p>
                </div>
              ) : (
                items.map((n) => {
                  const Icon = ICON[n.type] ?? Bell;
                  const inner = (
                    <div className={`flex gap-3 px-4 py-3 transition hover:bg-bg ${n.read ? '' : 'bg-brand-50/40'}`}>
                      <div className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-50 text-brand"><Icon size={16} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-navy">{n.title}</span>
                          {!n.read && <span className="h-1.5 w-1.5 flex-none rounded-full bg-brand" />}
                        </div>
                        {n.body && <p className="truncate text-[13px] text-slate2">{n.body}</p>}
                        <span className="text-xs text-slate-400">{ago(n.createdAt)}</span>
                      </div>
                    </div>
                  );
                  return n.href ? (
                    <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="block border-b border-line/60 last:border-0">{inner}</Link>
                  ) : (
                    <div key={n.id} className="border-b border-line/60 last:border-0">{inner}</div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
