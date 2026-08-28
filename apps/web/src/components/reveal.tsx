import type { CSSProperties, ReactNode } from 'react';

/**
 * Scroll-reveal — SOF CSS (JS'siz, framer-motion YO'Q). Element ko'rinishga
 * kirganda yumshoq ko'tarilib paydo bo'ladi (`animation-timeline: view()`,
 * latest tech). Qo'llab-quvvatlanmasa (Safari <26/Firefox) kontent shunchaki
 * ko'rinadi — progressive enhancement, HECH QACHON yashirin qolmaydi.
 * `prefers-reduced-motion` globals.css'da hurmat qilinadi.
 *
 * Shared komponent (server ham, client ham import qila oladi). `delay` prop
 * API-mosligi uchun saqlanadi — kichik bosqichli (stagger) siljish beradi.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shift = Math.min(12, Math.round(delay / 40));
  return (
    <div
      className={`reveal ${className}`}
      style={shift ? ({ '--reveal-shift': `${shift}%` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
