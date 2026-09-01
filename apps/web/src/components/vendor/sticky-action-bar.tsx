'use client';

import { useState } from 'react';
import { CalendarCheck, Car, Phone, Loader2 } from 'lucide-react';
import { orderTaxi } from '@/components/vendor/taxi-button';

/**
 * Mobil pastki harakat paneli (A2) — sahifaning istalgan joyida ko'rinadi.
 * Faqat mobil/planshetda (lg dan pastda). Desktop'da yon sticky panel yetarli.
 */
export function StickyActionBar({
  lat, lng, phone, accent, hasBooking, bookLabel, taxiLabel, callLabel,
}: {
  lat: number; lng: number; phone?: string; accent: string; hasBooking: boolean;
  bookLabel: string; taxiLabel: string; callLabel: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-16 z-50 border-t border-line bg-surface/95 px-3 py-2.5 backdrop-blur md:bottom-0 lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <a
          href={hasBooking ? '#booking' : (phone ? `tel:${phone}` : '#booking')}
          className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
          style={{ backgroundColor: accent }}
        >
          <CalendarCheck className="h-[18px] w-[18px]" />
          {bookLabel}
        </a>
        <button
          type="button"
          onClick={() => orderTaxi(lat, lng, setLoading)}
          aria-busy={loading}
          aria-label={taxiLabel}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-navy active:scale-[0.98]"
        >
          {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" style={{ color: accent }} /> : <Car className="h-[18px] w-[18px]" style={{ color: accent }} />}
          {taxiLabel}
        </button>
        {phone && (
          <a
            href={`tel:${phone}`}
            aria-label={callLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-navy active:scale-[0.98]"
          >
            <Phone className="h-[18px] w-[18px]" style={{ color: accent }} />
          </a>
        )}
      </div>
    </div>
  );
}
