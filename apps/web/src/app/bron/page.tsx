'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Loader2, MapPin } from 'lucide-react';
import { api, type Booking } from '@/lib/api';
import { getToken, clearToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { formatUZS } from '@/lib/utils';

const TZ = 'Asia/Tashkent';

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { text: 'Tasdiqlangan', cls: 'bg-success/10 text-success' },
  CANCELLED: { text: 'Bekor qilingan', cls: 'bg-slate-100 text-slate-500' },
  COMPLETED: { text: 'Yakunlangan', cls: 'bg-brand/10 text-brand' },
  NO_SHOW: { text: 'Kelmadi', cls: 'bg-danger/10 text-danger' },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: TZ })}, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: TZ })}`;
}

export default function BronPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [noAuth, setNoAuth] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) { setNoAuth(true); return; }
    try {
      setBookings(await api.myBookings(token));
    } catch (e) {
      if (e instanceof Error && /401/.test(e.message)) { clearToken(); setNoAuth(true); }
      else setError('Bronlarni yuklab bo‘lmadi');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function cancel(id: string) {
    const token = getToken();
    if (!token) return;
    setCancelling(id);
    try {
      await api.cancelBooking(token, id);
      await load();
    } catch {
      setError('Bekor qilib bo‘lmadi');
    } finally {
      setCancelling(null);
    }
  }

  if (noAuth) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <CalendarClock className="h-10 w-10 text-brand mx-auto" />
        <h1 className="mt-3 font-display text-xl font-bold text-navy">Bronlaringiz</h1>
        <p className="mt-2 text-slate2">Bronlarni ko‘rish uchun avval biror joyni bron qiling — telefon orqali kirasiz.</p>
        <Link href="/qidiruv" className="mt-4 inline-block"><Button>Xizmat qidirish</Button></Link>
      </div>
    );
  }

  if (!bookings) {
    return (
      <div className="flex items-center justify-center gap-2 text-slate2 py-16">
        <Loader2 className="h-5 w-5 animate-spin" /> Yuklanmoqda…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-navy mb-4">Mening bronlarim</h1>
      {error && <p className="text-sm text-danger mb-3">{error}</p>}
      {bookings.length === 0 ? (
        <div className="text-center py-16 text-slate2">
          <p>Hozircha bron yo‘q.</p>
          <Link href="/qidiruv" className="mt-4 inline-block"><Button>Xizmat qidirish</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const st = STATUS_LABEL[b.status] ?? { text: b.status, cls: 'bg-slate-100 text-slate-500' };
            const active = b.status === 'PENDING' || b.status === 'CONFIRMED';
            const upcoming = new Date(b.slotStart).getTime() > Date.now();
            return (
              <div key={b.id} className="rounded-lg border border-line bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display font-bold text-navy">{b.service?.name ?? 'Xizmat'}</div>
                    {b.vendor && (
                      <Link href={`/vendor/${b.vendor.slug}`} className="mt-0.5 flex items-center gap-1 text-sm text-slate2 hover:text-brand">
                        <MapPin className="h-3.5 w-3.5" />{b.vendor.name}
                      </Link>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${st.cls}`}>{st.text}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                  <span className="flex items-center gap-1.5 text-ink">
                    <CalendarClock className="h-4 w-4 text-brand" />{fmt(b.slotStart)}
                  </span>
                  {b.service && Number(b.service.price) > 0 && (
                    <span className="font-mono font-semibold text-navy">{formatUZS(b.service.price)}</span>
                  )}
                </div>
                {b.staff?.name && <p className="mt-1 text-xs text-slate2">Mutaxassis: {b.staff.name}</p>}
                {active && upcoming && (
                  <button
                    onClick={() => cancel(b.id)}
                    disabled={cancelling === b.id}
                    className="mt-3 text-sm text-danger hover:underline disabled:opacity-50"
                  >
                    {cancelling === b.id ? 'Bekor qilinmoqda…' : 'Bronni bekor qilish'}
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
