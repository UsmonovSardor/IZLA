'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarX2, Clock, MapPin, User2 } from 'lucide-react';
import { api, type Booking } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { TgScreen } from '@/components/tg/tg-screen';
import { TgAuthGate } from '@/components/tg/tg-auth-gate';
import { PaymentSheet } from '@/components/tg/payment-sheet';
import { Skel, TgEmpty, TgButton, TgCard } from '@/components/tg/tg-ui';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-400/15 text-amber-600',
  CONFIRMED: 'bg-brand/10 text-brand',
  COMPLETED: 'bg-teal/15 text-teal-600',
  CANCELLED: 'bg-danger/10 text-danger',
};

function fmt(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function BookingsInner() {
  const t = useTranslations('tg');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pay, setPay] = useState<{ id: string; amount: number } | null>(null);

  useEffect(() => {
    api.myBookings().then(setBookings).catch(() => setBookings([]));
  }, []);

  async function cancel(id: string) {
    setBusy(id);
    try {
      const updated = await api.cancelBooking(id);
      haptic.notify('success');
      setBookings((prev) => prev?.map((b) => (b.id === id ? { ...b, status: updated.status } : b)) ?? null);
    } catch {
      haptic.notify('error');
    } finally {
      setBusy(null);
    }
  }

  if (!bookings) {
    return (
      <div className="space-y-3 pt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skel key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return <TgEmpty icon={CalendarX2} title={t('bookings.emptyTitle')} sub={t('bookings.emptySub')} />;
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const active = b.status === 'PENDING' || b.status === 'CONFIRMED';
        const unpaid = active && (!b.payment || b.payment.status !== 'PAID');
        const price = Number(b.payment?.amount ?? b.service?.price ?? 0);
        const known = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(b.status);
        return (
          <TgCard key={b.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-bold text-navy">{b.vendor?.name ?? '—'}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted">{b.service?.name}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${STATUS_STYLE[b.status] ?? 'bg-line text-muted'}`}>
                {known ? t(`status.${b.status}`) : b.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand" /> {fmt(b.slotStart)}</span>
              {b.staff?.name && <span className="inline-flex items-center gap-1.5"><User2 className="h-4 w-4 text-teal-600" /> {b.staff.name}</span>}
              {b.vendor?.address && <span className="inline-flex items-center gap-1.5 truncate"><MapPin className="h-4 w-4 text-violet" /> <span className="truncate">{b.vendor.address}</span></span>}
            </div>

            {price > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="font-display text-base font-bold text-navy">{formatUZS(price)}</span>
                {b.payment?.status === 'PAID' && <span className="text-[13px] font-semibold text-teal-600">{t('bookings.paid')}</span>}
              </div>
            )}

            {(unpaid || active) && (
              <div className="mt-3 flex gap-2">
                {unpaid && price > 0 && (
                  <TgButton size="sm" full onClick={() => setPay({ id: b.id, amount: price })}>
                    {t('bookings.pay')}
                  </TgButton>
                )}
                {active && (
                  <TgButton size="sm" variant="danger" full loading={busy === b.id} onClick={() => cancel(b.id)}>
                    {t('bookings.cancel')}
                  </TgButton>
                )}
              </div>
            )}
          </TgCard>
        );
      })}

      <PaymentSheet open={!!pay} onClose={() => setPay(null)} bookingId={pay?.id ?? null} amount={pay?.amount ?? 0} />
    </div>
  );
}

export default function TgBookings() {
  const t = useTranslations('tg');
  return (
    <TgScreen large title={t('tabs.bookings')}>
      <TgAuthGate>
        <BookingsInner />
      </TgAuthGate>
    </TgScreen>
  );
}
