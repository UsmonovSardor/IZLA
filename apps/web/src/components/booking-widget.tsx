'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Check, ChevronLeft, Clock, Loader2 } from 'lucide-react';
import { api, type Slot, type Booking } from '@/lib/api';
import { getToken, getSavedPhone, requestOtp, verifyOtp } from '@/lib/auth';
import { Button } from './ui/button';
import { PayButtons } from './pay-buttons';
import { formatUZS } from '@/lib/utils';

interface ServiceLite { id: string; name: string; price: string; durationMin: number }

type Step = 'pick' | 'auth' | 'review' | 'done';

const TZ = 'Asia/Tashkent';
const WEEKDAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

/** Toshkent sanasidan keyingi N kunni YYYY-MM-DD ro'yxati sifatida beradi. */
function nextDays(n: number): { value: string; wd: string; label: string }[] {
  const out: { value: string; wd: string; label: string }[] = [];
  const now = new Date();
  // Toshkent bugungi kunidan boshlaymiz
  const base = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    const value = d.toISOString().slice(0, 10);
    out.push({
      value,
      wd: i === 0 ? 'Bugun' : i === 1 ? 'Ertaga' : WEEKDAYS[d.getUTCDay()]!,
      label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`,
    });
  }
  return out;
}

function slotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}
function slotDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    weekday: 'short', day: 'numeric', month: 'long', timeZone: TZ,
  });
}

export function BookingWidget({ services, vendorName }: { services: ServiceLite[]; vendorName: string }) {
  const days = useMemo(() => nextDays(14), []);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [date, setDate] = useState(days[0]?.value ?? '');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotErr, setSlotErr] = useState('');
  const [selected, setSelected] = useState<Slot | null>(null);

  const [step, setStep] = useState<Step>('pick');
  const [note, setNote] = useState('');

  // Auth substep
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devHint, setDevHint] = useState<string | undefined>();

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
      setSlotErr('Slotlarni yuklab bo‘lmadi');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    setPhone(getSavedPhone());
  }, []);

  function goToConfirm() {
    if (!selected) return;
    setError('');
    if (getToken()) setStep('review');
    else setStep('auth');
  }

  async function sendOtp() {
    setError('');
    if (!/^\+998\d{9}$/.test(phone)) {
      setError('Telefon +998XXXXXXXXX formatida bo‘lishi kerak');
      return;
    }
    setSubmitting(true);
    try {
      const r = await requestOtp(phone);
      setOtpSent(true);
      setDevHint(r.devHint);
    } catch {
      setError('SMS yuborib bo‘lmadi. Qayta urinib ko‘ring.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmOtp() {
    setError('');
    setSubmitting(true);
    try {
      await verifyOtp(phone, code);
      setStep('review');
    } catch {
      setError('Kod noto‘g‘ri.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBooking() {
    if (!selected) return;
    const token = getToken();
    if (!token) { setStep('auth'); return; }
    setSubmitting(true);
    setError('');
    try {
      const b = await api.createBooking(token, {
        serviceId,
        slotStart: selected.start,
        note: note || undefined,
      });
      setBooking(b);
      setStep('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Xatolik';
      // Slot band bo'lib qolgan bo'lsa — qaytadan tanlashga qaytaramiz
      if (/band/i.test(msg)) {
        setError('Afsus, bu vaqt endigina band bo‘ldi. Boshqa vaqt tanlang.');
        setStep('pick');
        void loadSlots();
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
          <p className="mt-3 font-display font-bold text-navy">Bron qabul qilindi</p>
          <p className="text-sm text-slate2 mt-0.5">Holat: kutilmoqda (tasdiq)</p>
        </div>
        <dl className="mt-3 space-y-2 text-sm border-t border-line pt-3">
          <Row k="Xizmat" v={booking.service?.name ?? service?.name ?? '—'} />
          <Row k="Joy" v={booking.vendor?.name ?? vendorName} />
          {booking.staff?.name && <Row k="Mutaxassis" v={booking.staff.name} />}
          <Row k="Sana" v={slotDateLabel(booking.slotStart)} />
          <Row k="Vaqt" v={`${slotTime(booking.slotStart)}–${slotTime(booking.slotEnd)}`} />
          {service && Number(service.price) > 0 && <Row k="Narx" v={formatUZS(service.price)} />}
        </dl>
        {service && Number(service.price) > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <PayButtons bookingId={booking.id} label="Oldindan to‘lash (ixtiyoriy)" />
            <p className="mt-1.5 text-[11px] text-slate2 text-center">
              To‘lasangiz bron avtomatik tasdiqlanadi. Aks holda vendor qo‘ng‘iroq qiladi.
            </p>
          </div>
        )}
        <Link href="/bron" className="mt-3 block">
          <Button variant="secondary" className="w-full">Mening bronlarim</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-brand" />
        <h3 className="font-display font-bold text-navy">Bron qilish</h3>
      </div>

      {/* ---------- PICK ---------- */}
      {step === 'pick' && (
        <>
          {services.length > 1 && (
            <label className="block">
              <span className="text-xs font-medium text-slate2">Xizmat</span>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand bg-white"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.durationMin} daq{Number(s.price) > 0 ? ` · ${formatUZS(s.price)}` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div>
            <span className="text-xs font-medium text-slate2">Sana</span>
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
              <Clock className="h-3 w-3" /> Bo‘sh vaqtlar
            </span>
            {loadingSlots ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate2 py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda…
              </div>
            ) : slotErr ? (
              <p className="mt-2 text-sm text-danger">{slotErr}</p>
            ) : slots && slots.length === 0 ? (
              <p className="mt-2 text-sm text-slate2 py-3 text-center">Bu kunda ish vaqti yo‘q.</p>
            ) : slots && slots.every((s) => !s.available) ? (
              <p className="mt-2 text-sm text-slate2 py-3 text-center">Barcha vaqtlar band. Boshqa kun tanlang.</p>
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
                      {slotTime(s.start)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" disabled={!selected} onClick={goToConfirm}>
            {selected ? `${slotTime(selected.start)} — davom etish` : 'Vaqt tanlang'}
          </Button>
        </>
      )}

      {/* ---------- AUTH ---------- */}
      {step === 'auth' && (
        <div className="space-y-3">
          <BackButton onClick={() => setStep('pick')} />
          <p className="text-sm text-slate2">Bronni tasdiqlash uchun telefon raqamingizni kiriting.</p>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 XX XXX XX XX"
            inputMode="tel"
            disabled={otpSent}
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand disabled:bg-bg"
          />
          {otpSent && (
            <>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="SMS kod (6 raqam)"
                inputMode="numeric"
                className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand tracking-widest"
              />
              {devHint && (
                <p className="text-xs text-slate2">Dev rejim: kod <span className="font-mono font-semibold">{devHint}</span></p>
              )}
            </>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {!otpSent ? (
            <Button className="w-full" disabled={submitting} onClick={sendOtp}>
              {submitting ? 'Yuborilmoqda…' : 'Kod olish'}
            </Button>
          ) : (
            <Button className="w-full" disabled={submitting || code.length !== 6} onClick={confirmOtp}>
              {submitting ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
            </Button>
          )}
        </div>
      )}

      {/* ---------- REVIEW ---------- */}
      {step === 'review' && selected && (
        <div className="space-y-3">
          <BackButton onClick={() => setStep('pick')} />
          <dl className="space-y-2 text-sm rounded-md border border-line bg-bg/50 p-3">
            <Row k="Xizmat" v={service?.name ?? '—'} />
            <Row k="Joy" v={vendorName} />
            <Row k="Sana" v={slotDateLabel(selected.start)} />
            <Row k="Vaqt" v={`${slotTime(selected.start)}–${slotTime(selected.end)}`} />
            {service && <Row k="Davomiylik" v={`${service.durationMin} daqiqa`} />}
            {service && Number(service.price) > 0 && <Row k="Narx" v={formatUZS(service.price)} />}
          </dl>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Izoh (ixtiyoriy)"
            rows={2}
            className="w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" disabled={submitting} onClick={submitBooking}>
            {submitting ? 'Bron qilinmoqda…' : 'Bronni tasdiqlash'}
          </Button>
          <p className="text-[11px] text-slate2 text-center">To‘lovsiz — joyni band qilasiz, tasdiqni vendor beradi.</p>
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-slate2 hover:text-ink">
      <ChevronLeft className="h-4 w-4" /> Orqaga
    </button>
  );
}
