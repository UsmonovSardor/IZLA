'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Star, MapPin, Phone, BadgeCheck, Clock, Heart, ChevronRight, CheckCircle2, ImageOff,
} from 'lucide-react';
import { api, type VendorDetail, type Booking } from '@/lib/api';
import { formatUZS } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import { useAuth } from '@/components/auth-provider';
import { BookingFlow } from '@/components/tg/booking-flow';
import { PaymentSheet } from '@/components/tg/payment-sheet';
import { StarRating, Skel, TgButton, Sheet } from '@/components/tg/tg-ui';

type Svc = VendorDetail['services'][number];

export default function TgVendorPage() {
  const t = useTranslations('tg');
  const locale = useLocale();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { user, openLogin } = useAuth();

  const [v, setV] = useState<VendorDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fav, setFav] = useState(false);
  const [bookingSvc, setBookingSvc] = useState<Svc | null>(null);
  const [payFor, setPayFor] = useState<{ id: string; amount: number } | null>(null);
  const [booked, setBooked] = useState<Booking | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.vendor(slug, locale).then(setV).catch(() => setNotFound(true));
  }, [slug, locale]);

  useEffect(() => {
    if (!user) return;
    api.favoriteIds().then((ids) => v && setFav(ids.includes(v.id))).catch(() => {});
  }, [user, v]);

  async function toggleFav() {
    if (!v) return;
    if (!user) { openLogin({ onDone: () => void doFav() }); return; }
    void doFav();
  }
  async function doFav() {
    if (!v) return;
    haptic.impact('medium');
    setFav((p) => !p);
    try {
      const r = await api.toggleFavorite(v.id);
      setFav(r.favorited);
    } catch {
      setFav((p) => !p); // qaytar
    }
  }

  function onBooked(b: Booking) {
    setBookingSvc(null);
    setBooked(b);
    const amount = Number(b.payment?.amount ?? b.service?.price ?? 0);
    if (amount > 0) setPayFor({ id: b.id, amount });
  }

  if (notFound) {
    return <div className="px-6 py-24 text-center text-muted">{t('vendor.notFound')}</div>;
  }
  if (!v) {
    return (
      <div>
        <Skel className="h-56 w-full rounded-none" />
        <div className="space-y-4 p-4">
          <Skel className="h-7 w-2/3" />
          <Skel className="h-20 w-full rounded-2xl" />
          <Skel className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const meta = [v.category?.name, v.district].filter(Boolean).join(' · ');

  return (
    <div className="pb-6">
      {/* Hero */}
      <div className="relative h-56 w-full overflow-hidden bg-line">
        {v.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.photos[0]} alt={v.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted"><ImageOff className="h-10 w-10" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy/80 to-transparent" />
        <button
          type="button"
          onClick={toggleFav}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] grid h-10 w-10 place-items-center rounded-full bg-surface/90 shadow-md backdrop-blur transition active:scale-90"
          aria-label="favorite"
        >
          <Heart className={`h-5 w-5 ${fav ? 'fill-danger text-danger' : 'text-navy'}`} />
        </button>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h1 className="flex items-center gap-1.5 font-display text-2xl font-bold text-white drop-shadow">
            {v.name}
            {v.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-teal-300" />}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-[13px] text-white/90">
            <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {v.rating.toFixed(1)} · {t('card.reviews', { n: v.reviewCount })}</span>
          </div>
        </div>
      </div>

      {/* Gallereya */}
      {v.photos && v.photos.length > 1 && (
        <div className="-mx-0 flex gap-2 overflow-x-auto px-4 pt-4 tg-noscroll">
          {v.photos.slice(1, 8).map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt="" loading="lazy" className="h-20 w-28 shrink-0 rounded-xl object-cover" />
          ))}
        </div>
      )}

      {/* Meta + aloqa */}
      <div className="px-4 pt-4">
        <p className="text-[14px] text-muted">{meta}</p>
        {v.description && <p className="mt-2 text-[14px] leading-relaxed text-ink">{v.description}</p>}

        <div className="mt-4 space-y-2">
          {v.address && (
            <div className="flex items-start gap-2.5 text-[14px] text-ink">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet" /> <span>{v.address}</span>
            </div>
          )}
          {v.phone && (
            <a href={`tel:${v.phone}`} onClick={() => haptic.impact('light')} className="flex items-center gap-2.5 text-[14px] font-semibold text-brand">
              <Phone className="h-4 w-4 shrink-0" /> {v.phone}
            </a>
          )}
        </div>
      </div>

      {/* Xizmatlar */}
      {v.services.length > 0 && (
        <section className="mt-6 px-4">
          <h2 className="mb-3 font-display text-[15px] font-bold text-navy">{t('vendor.services')}</h2>
          <div className="space-y-2.5">
            {v.services.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{s.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
                    <span className="font-display font-bold text-navy">{formatUZS(s.price)}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t('booking.duration', { min: s.durationMin })}</span>
                  </p>
                </div>
                <TgButton size="sm" onClick={() => setBookingSvc(s)}>{t('vendor.book')}</TgButton>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sharhlar */}
      {v.reviews.length > 0 && (
        <section className="mt-6 px-4">
          <h2 className="mb-3 font-display text-[15px] font-bold text-navy">{t('vendor.reviews')}</h2>
          <div className="space-y-3">
            {v.reviews.slice(0, 4).map((r) => (
              <div key={r.id} className="rounded-2xl border border-line bg-surface p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-navy">{r.user?.name || t('anonUser')}</span>
                  <StarRating value={r.rating} size={13} />
                </div>
                {r.text && <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{r.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Muvaffaqiyat sheet (to'lovsiz holat / eslatma) */}
      <Sheet open={!!booked && !payFor} onClose={() => setBooked(null)} title={t('vendor.bookedTitle')}>
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="h-14 w-14 text-teal-500" />
          <p className="mt-3 text-[14px] text-muted">{t('vendor.bookedSub')}</p>
        </div>
        <TgButton full onClick={() => setBooked(null)}>
          {t('vendor.ok')} <ChevronRight className="h-4 w-4" />
        </TgButton>
      </Sheet>

      <BookingFlow open={!!bookingSvc} onClose={() => setBookingSvc(null)} service={bookingSvc} onBooked={onBooked} />
      <PaymentSheet open={!!payFor} onClose={() => setPayFor(null)} bookingId={payFor?.id ?? null} amount={payFor?.amount ?? 0} />
    </div>
  );
}
