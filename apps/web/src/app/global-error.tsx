'use client';

import { useEffect } from 'react';

/**
 * Global xato chegarasi — ROOT layout'ning o'zida yuz bergan xatoni tutadi
 * (oddiy error.tsx buni qamramaydi). O'z <html>/<body> bilan render qiladi,
 * i18n provideri mavjud emas → zaxira (uz) matn. Sentry ulanganda shu yerda
 * captureException chaqiriladi.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#F6F8FC',
          color: '#0B1F33',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div
            style={{
              width: 64, height: 64, margin: '0 auto', display: 'grid', placeItems: 'center',
              borderRadius: 18, background: '#fef3c7', color: '#d97706', fontSize: 30, fontWeight: 700,
            }}
            aria-hidden
          >
            !
          </div>
          <h1 style={{ marginTop: 24, fontSize: 24, fontWeight: 700 }}>Nimadir xato ketdi</h1>
          <p style={{ marginTop: 8, color: '#64748B', lineHeight: 1.5 }}>
            Kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta yuklab ko‘ring.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24, border: 'none', cursor: 'pointer', borderRadius: 12,
              background: '#2563EB', color: '#fff', padding: '0.75rem 1.5rem', fontSize: 14, fontWeight: 600,
            }}
          >
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
