'use client';

import { useEffect } from 'react';
import { Link } from 'next-view-transitions';
import { RotateCw, Home, AlertTriangle } from 'lucide-react';

/** Marshrut xato chegarasi — server/klient xatosida chiroyli qayta urinish ekrani. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Konsolga log (Sentry client bo'lsa avtomatik ushlaydi)
    console.error(error);
  }, [error]);

  return (
    <div className="container-wide flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-500">
        <AlertTriangle size={30} />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-navy">Nimadir xato ketdi</h1>
      <p className="mt-2 max-w-md text-muted">
        Sahifani yuklashda kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko‘ring —
        muammo davom etsa, birozdan so‘ng qaytib keling.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <RotateCw size={16} /> Qayta urinish
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-muted transition hover:text-navy"
        >
          <Home size={16} /> Bosh sahifa
        </Link>
      </div>
    </div>
  );
}
