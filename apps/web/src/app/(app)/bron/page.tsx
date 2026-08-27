'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarClock, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { api, type Booking } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import { PayButtons } from '@/components/pay-buttons';
import { formatUZS } from '@/lib/utils';

const TZ = 'Asia/Tashkent';

const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-success/10 text-success',
  CANCELLED: 'bg-slate-100 text-slate-500',
  COMPLETED: 'bg-brand/10 text-brand',
  NO_SHOW: 'bg-danger/10 text-danger',
};
const STATUS_KEY: Record<string, string> = {
  PENDING: 'statusPending',
  CONFIRMED: 'statusConfirmed',
  CANCELLED: 'statusCancelled',
  COMPLETED: 'statusCompleted',
  NO_SHOW: 'statusNoShow',
};

function fmt(iso: string, locale: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: TZ })}, ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })}`;
}

export default function BronPage() {
  const { user, loading, openLogin } = useAuth();
  const t = useTranslations('bookings');
  const tc = useTranslations('common');
  const { toast } = useToast();
  const locale = useLocale();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setBookings(await api.myBookings());
    } catch {
      setError(t('loadError'));
    }
  }, [user, t]);

  useEffect(() => { if (user) void load(); }, [user, load]);

  async function cancel(id: string) {
    setCancelling(id);
    try {
      await api.cancelBooking(id);
      await load();
      toast({ variant: 'info', title: t('statusCancelled') });
    } catch {
      setError(t('cancelError'));
      toast({ variant: 'error', title: t('cancelError') });
    } finally {
      setCancelling(null);
    }
  }

  if (!loading && !user) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <CalendarClock className="h-10 w-10 text-brand mx-auto" />
        <h1 className="mt-3 font-display text-xl font-bold text-navy">{t('guestTitle')}</h1>
        <p className="mt-2 text-slate2">{t('needLogin')}</p>
        <Button className="mt-4" onClick={() => openLogin({ next: '/bron' })}>{tc('login')}</Button>
      </div>
    );
  }

  if (loading || !bookings) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate2 py-16">
        <Loader2 className="h-5 w-5 animate-spin" /> {tc('loading')}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-navy mb-4">{t('title')}</h1>
      {error && <p className="text-sm text-danger mb-3">{error}</p>}
      {bookings.length === 0 ? (
        <div className="text-center py-16 text-slate2">
          <p>{t('empty')}</p>
          <Link href="/qidiruv" className="mt-4 inline-block"><Button>{t('searchService')}</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const cls = STATUS_CLS[b.status] ?? 'bg-slate-100 text-slate-500';
            const stKey = STATUS_KEY[b.status];
            const stText = stKey ? t(stKey) : b.status;
            const active = b.status === 'PENDING' || b.status === 'CONFIRMED';
            const upcoming = new Date(b.slotStart).getTime() > Date.now();
            return (
              <div key={b.id} className="rounded-lg border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display font-bold text-navy">{b.service?.name ?? t('service')}</div>
                    {b.vendor && (
                      <Link href={`/vendor/${b.vendor.slug}`} className="mt-0.5 flex items-center gap-1 text-sm text-slate2 hover:text-brand">
                        <MapPin className="h-3.5 w-3.5" />{b.vendor.name}
                      </Link>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{stText}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                  <span className="flex items-center gap-1.5 text-ink">
                    <CalendarClock className="h-4 w-4 text-brand" />{fmt(b.slotStart, locale)}
                  </span>
                  {b.service && Number(b.service.price) > 0 && (
                    <span className="font-mono font-semibold text-navy">{formatUZS(b.service.price)}</span>
                  )}
                </div>
                {b.staff?.name && <p className="mt-1 text-xs text-slate2">{t('specialist', { name: b.staff.name })}</p>}
                {b.payment?.status === 'PAID' && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t('paid')}
                  </p>
                )}
                {active && upcoming && b.payment?.status !== 'PAID' && b.service && Number(b.service.price) > 0 && (
                  <div className="mt-3 border-t border-line pt-3">
                    <PayButtons bookingId={b.id} label={t('prepay')} />
                  </div>
                )}
                {active && upcoming && (
                  <button
                    onClick={() => cancel(b.id)}
                    disabled={cancelling === b.id}
                    className="mt-3 text-sm text-danger hover:underline disabled:opacity-50"
                  >
                    {cancelling === b.id ? t('cancelling') : t('cancel')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
