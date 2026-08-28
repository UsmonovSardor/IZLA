'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'next-view-transitions';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarClock, Check, ChevronLeft, Clock, Loader2 } from 'lucide-react';
import { api, type Slot, type Booking } from '@/lib/api';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { PayButtons } from './pay-buttons';
import { formatUZS } from '@/lib/utils';

interface ServiceLite { id: string; name: string; price: string; durationMin: number }

type Step = 'pick' | 'review' | 'done';

const TZ = 'Asia/Tashkent';

/** Toshkent sanasidan keyingi N kunni beradi (weekday/oy nomi tanlangan tilda). */
function nextDays(n: number, locale: string, todayLabel: string, tomorrowLabel: string) {
  const out: { value: string; wd: string; label: string }[] = [];
  const base = new Date(Date.now() + 5 * 60 * 60 * 1000); // +5 → Toshkent kuni
  const wdFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const lblFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    out.push({
      value: d.toISOString().slice(0, 10),
      wd: i === 0 ? todayLabel : i === 1 ? tomorrowLabel : wdFmt.format(d),
      label: lblFmt.format(d),
    });
  }
  return out;
}

function slotTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}
function slotDateLabel(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'long', timeZone: TZ,
  });
}

export function BookingWidget({ services, vendorName }: { services: ServiceLite[]; vendorName: string }) {
  const { user, openLogin } = useAuth();
  const t = useTranslations('booking');
  const locale = useLocale();
  const days = useMemo(() => nextDays(14, locale, t('today'), t('tomorrow')), [locale, t]);
  const fmtTime = useCallback((iso: string) => slotTime(iso, locale), [locale]);
  const fmtDate = useCallback((iso: string) => slotDateLabel(iso, locale), [locale]);

  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [date, setDate] = useState(days[0]?.value ?? '');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotErr, setSlotErr] = useState('');
  const [selected, setSelected] = useState<Slot | null>(null);

  const [step, setStep] = useState<Step>('pick');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);

  const service = services.find((s) => s.id === serviceId);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !date) return;
    setLoadingSlots(true);
    setSlotErr('');
    setSelected(null);
    try {
      const av = await api.availability(serviceId, date);
      setSlots(av.slots);
    } catch {
      setSlotErr(t('slotsError'));
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, date, t]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  function goToConfirm() {
    if (!selected) return;
    setError('');
    if (user) setStep('review');
    else openLogin({ onDone: () => setStep('review') });
  }

  async function submitBooking() {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const b = await api.createBooking({ serviceId, slotStart: selected.start, note: note || undefined });
      setBooking(b);
      setStep('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('error');
      if (/band/i.test(msg)) {
        setError(t('slotTaken'));
        setStep('pick');
        void loadSlots();
      } else if ((e as { status?: number })?.status === 401) {
        openLogin({ onDone: () => setStep('review') });
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- DONE ----------
  if (step === 'done' && booking) {
    return (
      <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
        <div className="flex flex-col items-center text-center py-2">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="h-6 w-6 text-success" />
          </div>
          <p className="mt-3 font-display font-bold text-navy">{t('done')}</p>
          <p className="text-sm text-slate2 mt-0.5">{t('statusPending')}</p>
        </div>
        <dl className="mt-3 space-y-2 text-sm border-t border-line pt-3">
          <Row k={t('service')} v={booking.service?.name ?? service?.name ?? '—'} />
          <Row k={t('place')} v={booking.vendor?.name ?? vendorName} />
          {booking.staff?.name && <Row k={t('specialist')} v={booking.staff.name} />}
          <Row k={t('date')} v={fmtDate(booking.slotStart)} />
          <Row k={t('time')} v={`${fmtTime(booking.slotStart)}–${fmtTime(booking.slotEnd)}`} />
          {service && Number(service.price) > 0 && <Row k={t('price')} v={formatUZS(service.price)} />}
        </dl>
        {service && Number(service.price) > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <PayButtons bookingId={booking.id} label={t('prepay')} />
            <p className="mt-1.5 text-[11px] text-slate2 text-center">{t('prepayNote')}</p>
          </div>
        )}
        <Link href="/bron" className="mt-3 block">
          <Button variant="secondary" className="w-full">{t('myBookings')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-brand" />
        <h3 className="font-display font-bold text-navy">{t('title')}</h3>
      </div>

      {/* ---------- PICK ---------- */}
      {step === 'pick' && (
        <>
          {services.length > 1 && (
            <label className="block">
              <span className="text-xs font-medium text-slate2">{t('service')}</span>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand bg-white"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {t('durationMin', { count: s.durationMin })}{Number(s.price) > 0 ? ` · ${formatUZS(s.price)}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div>
            <span className="text-xs font-medium text-slate2">{t('date')}</span>
            <div className="mt-1 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {days.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDate(d.value)}
                  className={`shrink-0 rounded-md border px-3 py-2 text-center min-w-[64px] transition ${
                    date === d.value ? 'border-brand bg-brand/5 text-brand' : 'border-line text-ink hover:border-brand/40'
                  }`}
                >
                  <div className="text-[11px] font-medium">{d.wd}</div>
                  <div className="text-xs">{d.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate2 flex items-center gap-1">
              <Clock className="h-3 w-3" /> {t('freeSlots')}
            </span>
            {loadingSlots ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate2 py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('loading')}
              </div>
            ) : slotErr ? (
              <p className="mt-2 text-sm text-danger">{slotErr}</p>
            ) : slots && slots.length === 0 ? (
              <p className="mt-2 text-sm text-slate2 py-3 text-center">{t('noHours')}</p>
            ) : slots && slots.every((s) => !s.available) ? (
              <p className="mt-2 text-sm text-slate2 py-3 text-center">{t('allBusy')}</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {slots?.map((s) => {
                  const active = selected?.start === s.start;
                  return (
                    <button
                      key={s.start}
                      disabled={!s.available}
                      onClick={() => setSelected(s)}
                      className={`rounded-md border px-2 py-2 text-sm font-mono transition ${
                        active
                          ? 'border-brand bg-brand text-white'
                          : s.available
                            ? 'border-line text-ink hover:border-brand'
                            : 'border-line/60 text-slate2/40 line-through cursor-not-allowed'
                      }`}
                    >
                      {fmtTime(s.start)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" disabled={!selected} onClick={goToConfirm}>
            {selected ? t('continue', { time: fmtTime(selected.start) }) : t('pickTime')}
          </Button>
        </>
      )}

      {/* ---------- REVIEW ---------- */}
      {step === 'review' && selected && (
        <div className="space-y-3">
          <BackButton onClick={() => setStep('pick')} label={t('back')} />
          <dl className="space-y-2 text-sm rounded-md border border-line bg-bg/50 p-3">
            <Row k={t('service')} v={service?.name ?? '—'} />
            <Row k={t('place')} v={vendorName} />
            <Row k={t('date')} v={fmtDate(selected.start)} />
            <Row k={t('time')} v={`${fmtTime(selected.start)}–${fmtTime(selected.end)}`} />
            {service && <Row k={t('duration')} v={t('durationMin', { count: service.durationMin })} />}
            {service && Number(service.price) > 0 && <Row k={t('price')} v={formatUZS(service.price)} />}
          </dl>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            rows={2}
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" disabled={submitting} onClick={submitBooking}>
            {submitting ? t('confirming') : t('confirm')}
          </Button>
          <p className="text-[11px] text-slate2 text-center">{t('freeNote')}</p>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate2">{k}</dt>
      <dd className="font-medium text-ink text-right">{v}</dd>
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-slate2 hover:text-ink">
      <ChevronLeft className="h-4 w-4" /> {label}
    </button>
  );
}
