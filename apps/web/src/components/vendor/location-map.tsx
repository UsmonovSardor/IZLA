'use client';
import { MapPin, Navigation, Phone, Clock } from 'lucide-react';
import { VendorMap } from '@/components/vendor-map';
import { TaxiButton } from '@/components/vendor/taxi-button';
import type { VendorDetail } from '@/lib/api';

/** Bugungi kun kaliti (Toshkent vaqti bo'yicha). */
function todayKey(): 'mon_fri' | 'sat' | 'sun' {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tashkent', weekday: 'short' }).format(new Date());
  if (wd === 'Sat') return 'sat';
  if (wd === 'Sun') return 'sun';
  return 'mon_fri';
}
function tashkentMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}
function parseRange(s?: string): [number, number] | null {
  const m = s?.match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return [Number(m[1]) * 60 + Number(m[2]), Number(m[3]) * 60 + Number(m[4])];
}
/** true=ochiq, false=yopiq, null=noma'lum (badge ko'rsatilmaydi). */
function isOpenNow(hours?: Record<string, string>): boolean | null {
  const raw = hours?.[todayKey()];
  if (!raw) return null;
  if (raw === 'off') return false;
  const r = parseRange(raw);
  if (!r) return null;
  const now = tashkentMinutes();
  let [a, b] = r;
  if (b <= a) b += 1440; // tunab ishlaydigan joylar
  return now >= a && now < b;
}

/** Bitta vendor uchun joylashuv kartasi — xarita + yo'nalish paneli (taksi/yo'l/qo'ng'iroq). */
export function LocationMap({
  vendor, heading, subheading, accent, detailsWord, reviewsWord, directionsWord, labels,
}: {
  vendor: VendorDetail;
  heading: string;
  subheading?: string;
  accent: string;
  detailsWord: string;
  reviewsWord: string;
  directionsWord: string;
  labels: { taxi: string; taxiHint: string; call: string; openNow: string; closedNow: string; hoursTitle: string; closed: string };
}) {
  const mapVendor = {
    id: vendor.id, slug: vendor.slug, name: vendor.name, lat: vendor.lat, lng: vendor.lng,
    rating: vendor.rating, reviewCount: vendor.reviewCount, district: vendor.district ?? '',
    photos: vendor.photos, verified: vendor.verified, category: vendor.category,
  } as never;
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${vendor.lat},${vendor.lng}`;
  const open = isOpenNow(vendor.hours);
  const todayRaw = vendor.hours?.[todayKey()];
  const todayLabel = todayRaw === 'off' ? labels.closed : (todayRaw || undefined);

  return (
    <section>
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: accent }}>{subheading}</span>
        <h2 className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{heading}</h2>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.9fr_1fr]">
        {/* Xarita + ochiq/yopiq badge */}
        <div className="relative overflow-hidden rounded-3xl border border-line shadow-card">
          <VendorMap
            vendors={[mapVendor]}
            selectedId={vendor.id}
            hoveredId={null}
            onSelect={() => {}}
            labels={{ details: detailsWord, reviews: (n: number) => `${n} ${reviewsWord}` }}
            className="h-[300px] w-full lg:h-full lg:min-h-[340px]"
          />
          {open !== null && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
              <span className={`h-2 w-2 rounded-full ${open ? 'bg-emerald-500' : 'bg-rose-400'}`} />
              {open ? labels.openNow : labels.closedNow}
              {open && todayLabel ? <span className="font-medium text-muted">· {todayLabel}</span> : null}
            </span>
          )}
        </div>

        {/* Yo'nalish paneli */}
        <div className="flex flex-col gap-2.5 rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
            <div>
              <div className="text-sm font-semibold text-ink">{vendor.address || vendor.district}</div>
              {vendor.address && vendor.district && <div className="text-xs text-muted">{vendor.district}</div>}
            </div>
          </div>
          {todayLabel && (
            <div className="flex items-center gap-2.5 border-b border-line pb-3">
              <Clock className="h-5 w-5 shrink-0" style={{ color: accent }} />
              <div className="text-xs text-muted"><span className="text-muted/80">{labels.hoursTitle}:</span> {todayLabel}</div>
            </div>
          )}

          <div className="mt-1 space-y-2.5">
            <TaxiButton lat={vendor.lat} lng={vendor.lng} accent={accent} label={labels.taxi} hint={labels.taxiHint} />

            <a
              href={gmaps} target="_blank" rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-[11px] text-sm font-semibold text-navy transition hover:border-[color:var(--a)] hover:text-[color:var(--a)]"
              style={{ ['--a' as string]: accent }}
            >
              <Navigation className="h-[17px] w-[17px]" style={{ color: accent }} />
              {directionsWord}
            </a>

            {vendor.phone && (
              <a
                href={`tel:${vendor.phone}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-[11px] text-sm font-semibold text-navy transition hover:border-[color:var(--a)] hover:text-[color:var(--a)]"
                style={{ ['--a' as string]: accent }}
              >
                <Phone className="h-[17px] w-[17px]" style={{ color: accent }} />
                {labels.call}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
