/* Izla.uz — Service Worker (PWA: offline + kesh).
 * Qo'lda yozilgan, build-bog'liqliksiz. Versiyani oshirsangiz eski kesh tozalanadi.
 * Strategiya:
 *  - Navigatsiya (sahifa): network-first → kesh → /offline
 *  - /_next/static/* (o'zgarmas): cache-first
 *  - Rasmlar: stale-while-revalidate
 *  - Cross-origin (API, xarita tayllari): SW aralashmaydi (to'g'ridan tarmoq)
 */
const VERSION = 'izla-v1';
const STATIC_CACHE = `izla-static-${VERSION}`;
const PAGE_CACHE = `izla-pages-${VERSION}`;
const IMG_CACHE = `izla-img-${VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  // Faqat o'z domenimiz — API/xarita tayllari tarmoqqa to'g'ridan boradi
  if (url.origin !== self.location.origin) return;

  // Sahifalar: network-first, offline'da keshdan yoki /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const net = await fetch(request);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(request, net.clone());
          return net;
        } catch {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Next o'zgarmas assetlari: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const net = await fetch(request);
        cache.put(request, net.clone());
        return net;
      }),
    );
    return;
  }

  // Rasmlar: stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        const fetchP = fetch(request)
          .then((net) => {
            cache.put(request, net.clone());
            return net;
          })
          .catch(() => hit);
        return hit || fetchP;
      }),
    );
  }
});
