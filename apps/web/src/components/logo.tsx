'use client';
import { useId } from 'react';

// Izla brend belgisi — joylashuv pin'i ichida o'yilgan «i» (Izla = qidirmoq/topmoq).
// Toza vektor, brend gradienti #2563EB → #14B8A6. mask = «i» knockout (haqiqiy shaffof).
const PIN =
  'M50 16 C35.6 16 24 27.6 24 42 C24 60 45 80 48.6 83.4 C49.4 84.2 50.6 84.2 51.4 83.4 C55 80 76 60 76 42 C76 27.6 64.4 16 50 16 Z';

export function LogoMark({
  size = 32,
  variant = 'mark',
  className,
}: {
  size?: number;
  variant?: 'mark' | 'tile';
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const gid = `izg${uid}`;
  const mid = `izm${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className} role="img" aria-label="Izla logo">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <mask id={mid}>
          <path d={PIN} fill="#fff" />
          <circle cx="50" cy="33" r="6" fill="#000" />
          <rect x="44" y="44" width="12" height="24" rx="6" fill="#000" />
        </mask>
      </defs>
      {variant === 'tile' ? (
        <>
          <rect x="4" y="4" width="92" height="92" rx="22" fill={`url(#${gid})`} />
          <path d={PIN} fill="#fff" mask={`url(#${mid})`} />
        </>
      ) : (
        <path d={PIN} fill={`url(#${gid})`} mask={`url(#${mid})`} />
      )}
    </svg>
  );
}

/** To'liq logo: belgi + «izla.uz» so'z belgisi (Sora). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark size={34} />
      <span className="font-display text-xl font-bold text-navy leading-none">
        izla<span className="text-teal">.uz</span>
      </span>
    </span>
  );
}
