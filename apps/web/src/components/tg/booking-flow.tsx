'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { api, type Availability, type Booking } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { useAuth } from '@/components/auth-provider';
import { Sheet, TgButton, Skel, Chip } from './tg-ui';

interface Svc { id: string; name: string; price: string; durationMin: number }

function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function hhmm(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Bron oqimi: sana → bo'sh vaqt → tasdiq. onBooked'da to'lovga o'tiladi. */
export function BookingFlow({
  open,
  onClose,
  service,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  service: Svc | null;
  onBooked: (b: Booking) => void;
}) {
  const t = useTranslations('tg.booking');
  const { user, openLogin } = useAuth();
  const [dayIdx, setDayIdx] = useState(0);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Sana o'zgarganda bo'sh vaqtlarni yuklaymiz
  useEffect(() => {
    if (!open || !service) return;
    setAvail(null);
    setSlot(null);
    setError('');
    api
      .availability(service.id, isoDate(days[dayIdx]))
      .then(setAvail)
      .catch(() => setAvail({ serviceId: service.id, serviceName: service.name, vendorId: '', vendorName: '', date: '', durationMin: service.durationMin, slots: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service, dayIdx]);

  // Sheet ochilganда holатni tiklash
  useEffect(() => {
    if (open) { setDayIdx(0); setSlot(null); setError(''); }
  }, [open]);

  async function confirm() {
    if (!service || !slot) return;
    if (!user) { openLogin({ onDone: () => void doCreate() }); return; }
    void doCreate();
  }
  async function doCreate() {
    if (!service || !slot) return;
    setCreating(true);
    setError('');
    try {
      const booking = await api.createBooking({ serviceId: service.id, slotStart: slot });
      haptic.notify('success');
      onBooked(booking);
    } catch (e) {
      haptic.notify('error');
      setError(e instanceof Error ? e.message : t('failed'));
    } finally {
      setCreating(false);
    }
  }

  const dayLabel = (i: number) => (i === 0 ? t('today') : i === 1 ? t('tomorrow') : `${String(days[i].getDate()).padStart(2, '0')}.${String(days[i].getMonth() + 1).padStart(2, '0')}`);

  return (
    <Sheet open={open} onClose={onClose} title={service?.name}>
      {service && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-[13px]">
          <span className="text-muted">{t('duration', { min: service.durationMin })}</span>
          <span className="font-display text-base font-bold text-navy">{formatUZS(service.price)}</span>
        </div>
      )}

      {/* Sana */}
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-navy">
        <CalendarClock className="h-4 w-4 text-brand" /> {t('pickDate')}
      </p>
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 tg-noscroll">
        {days.map((_, i) => (
          <Chip key={i} active={dayIdx === i} onClick={() => setDayIdx(i)}>
            {dayLabel(i)}
          </Chip>
        ))}
      </div>

      {/* Bo'sh vaqtlar */}
      <p className="mb-2 text-[13px] font-semibold text-navy">{t('pickTime')}</p>
      {!avail ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skel key={i} className="h-10 rounded-xl" />
          ))}
        </div>
      ) : avail.slots.filter((s) => s.available).length === 0 ? (
        <p className="rounded-xl bg-bg px-4 py-6 text-center text-[13px] text-muted">{t('noSlots')}</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {avail.slots.filter((s) => s.available).map((s) => (
            <button
              key={s.start}
              type="button"
              onClick={() => { haptic.select(); setSlot(s.start); }}
              className={`h-10 rounded-xl text-[13px] font-semibold transition active:scale-95 ${
                slot === s.start ? 'bg-brand text-white' : 'bg-bg text-ink'
              }`}
            >
              {hhmm(s.start)}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-center text-[13px] text-danger">{error}</p>}

      <div className="mt-5">
        <TgButton full size="lg" disabled={!slot} loading={creating} onClick={confirm}>
          <CheckCircle2 className="h-5 w-5" /> {t('confirm')}
        </TgButton>
      </div>
    </Sheet>
  );
}
