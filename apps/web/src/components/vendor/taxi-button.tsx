'use client';

import { useCallback, useState } from 'react';
import { Car, Loader2 } from 'lucide-react';

/**
 * Taksi chaqirish (C1) — Yandex Go deep-link.
 * Mo'ljal (vendor koordinatasi) oldindan to'ldiriladi. Foydalanuvchi joylashuviga
 * ruxsat bersa, ketish nuqtasi ham qo'shiladi (aks holda Yandex Go o'zi so'raydi).
 *
 * Kalitsiz/bepul: rasmiy appmetrica redirect — ilova bo'lsa Yandex Go ochiladi,
 * bo'lmasa web'ga tushadi. Keyinchalik provayder tanlash (C2) ga oson kengaytiriladi.
 */
const YANDEX_TRACKING_ID = '1178268795219780156';

function buildYandexGoUrl(destLat: number, destLng: number, start?: GeolocationCoordinates): string {
  const p = new URLSearchParams({
    'end-lat': String(destLat),
    'end-lon': String(destLng),
    ref: 'izla',
    appmetrica_tracking_id: YANDEX_TRACKING_ID,
  });
  if (start) {
    p.set('start-lat', String(start.latitude));
    p.set('start-lon', String(start.longitude));
  }
  return `https://3.redirect.appmetrica.yandex.com/route?${p.toString()}`;
}

/**
 * Taksi buyurtmasini ochadi (Yandex Go). Yangi oyna DARROV ochiladi (imo-ishora ichida),
 * geolokatsiya kelgach URL yangilanadi. `onLoading` — spinner uchun ixtiyoriy callback.
 */
export function orderTaxi(lat: number, lng: number, onLoading?: (v: boolean) => void): void {
  const w = window.open('about:blank', '_blank', 'noopener,noreferrer');
  const openWith = (start?: GeolocationCoordinates) => {
    const url = buildYandexGoUrl(lat, lng, start);
    if (w) w.location.href = url;
    else window.location.href = url;
  };
  if (!('geolocation' in navigator)) {
    openWith();
    return;
  }
  onLoading?.(true);
  navigator.geolocation.getCurrentPosition(
    (pos) => { onLoading?.(false); openWith(pos.coords); },
    () => { onLoading?.(false); openWith(); },
    { enableHighAccuracy: false, timeout: 3500, maximumAge: 600000 },
  );
}

export function TaxiButton({
  lat, lng, accent, label, hint,
}: {
  lat: number; lng: number; accent: string; label: string; hint?: string;
}) {
  const [loading, setLoading] = useState(false);

  const order = useCallback(() => orderTaxi(lat, lng, setLoading), [lat, lng]);

  return (
    <div>
      <button
        type="button"
        onClick={order}
        aria-busy={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]"
        style={{ backgroundColor: accent }}
      >
        {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Car className="h-[18px] w-[18px]" />}
        {label}
      </button>
      {hint && <p className="mt-1 text-center text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
