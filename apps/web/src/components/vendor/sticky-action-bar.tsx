'use client';

import { useState } from 'react';
import { CalendarCheck, Car, Loader2 } from 'lucide-react';
import { orderTaxi } from '@/components/vendor/taxi-button';

/**
 * Mobil pastki harakat paneli (A2) — sahifaning istalgan joyida ko'rinadi.
 * Faqat mobil/planshetda (lg dan pastda). Desktop'da yon sticky panel yetarli.
 *
 * Ikki kuchli amal: Bron + Taksi. Qo'ng'iroq hero va joylashuv panelida bor —
 * bu yerda takrorlanmaydi. O'ng tomonda AI yordamchi FAB (fixed right, ~72px)
 * uchun bo'shliq qoldirilgan (pr-20), aks holda tugmalar uning ostida qoladi.
 */
export function StickyActionBar({
  lat, lng, phone, accent, hasBooking, bookLabel, taxiLabel,
}: {
  lat: number; lng: number; phone?: string; accent: string; hasBooking: boolean;
  bookLabel: string; taxiLabel: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-16 z-50 border-t border-line bg-surface/95 py-2.5 pl-3 pr-20 backdrop-blur md:bottom-0 lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-2">
        <a
          href={hasBooking ? '#booking' : (phone ? `tel:${phone}` : '#booking')}
          className="flex flex-[1.3] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
          style={{ backgroundColor: accent }}
        >
          <CalendarCheck className="h-[18px] w-[18px]" />
          {bookLabel}
        </a>
        <button
          type="button"
          onClick={() => orderTaxi(lat, lng, setLoading)}
          aria-busy={loading}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-navy active:scale-[0.98]"
        >
          {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" style={{ color: accent }} /> : <Car className="h-[18px] w-[18px]" style={{ color: accent }} />}
          {taxiLabel}
        </button>
      </div>
    </div>
  );
}
