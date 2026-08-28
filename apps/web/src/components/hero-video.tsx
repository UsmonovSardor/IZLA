'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hero video — TEZLIK uchun kechiktirilgan yuklash.
 *
 * Poster (izla-poster.webp, ~36KB) darrov chiziladi = LCP tez. Og'ir 2.6MB
 * video FAQAT sahifa interaktiv bo'lgach (requestIdleCallback) yuklanadi va
 * `canplay` bo'lganda poster ustiga silliq fade bilan chiqadi. Shu bois `load`
 * hodisasi endi videoni kutmaydi (kritik yo'ldan chiqadi, 21s → ~2s).
 *
 * `prefers-reduced-motion` / Save-Data / 2G'da → video umuman yuklanmaydi,
 * poster qoladi (a11y + past-tarmoq hurmati).
 *
 * `absolute inset-0` — ota banner ichida to'liq to'ldiradi.
 */
export function HeroVideo() {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection;
    if (mq.matches || conn?.saveData === true || /2g/.test(conn?.effectiveType || '')) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const id = w.requestIdleCallback
      ? w.requestIdleCallback(() => setShow(true), { timeout: 2500 })
      : window.setTimeout(() => setShow(true), 1200);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!show || !ref.current) return;
    const v = ref.current;
    const onReady = () => setReady(true);
    if (v.readyState >= 3) onReady();
    else v.addEventListener('canplay', onReady, { once: true });
    v.play().catch(() => {});
    return () => v.removeEventListener('canplay', onReady);
  }, [show]);

  return (
    <>
      <img
        src="/izla-poster.webp"
        alt=""
        aria-hidden
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          backgroundImage: 'url(/izla-poster-blur.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {show && (
        <video
          ref={ref}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
          src="/izla.mp4"
          poster="/izla-poster.webp"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
      )}
    </>
  );
}
