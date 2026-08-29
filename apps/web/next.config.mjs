import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// API kelib chiqishi (connect-src uchun). Build vaqtida bake qilinadi.
const API_ORIGIN = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : '';
  } catch {
    return '';
  }
})();

// Basemap tayl kelib chiqishi — CSP va xarita uslubi HECH QACHON ajralib qolmasligi
// uchun bitta manbadan olinadi (vendor-map.tsx dagi MAP_STYLE bilan bir xil default).
// OpenFreeMap: style/vektor tayl/font/sprite hammasi shu origin'da (kalitsiz).
const MAP_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE || 'https://tiles.openfreemap.org/styles/liberty';
const MAP_ORIGIN = (() => {
  try {
    return new URL(MAP_STYLE).origin;
  } catch {
    return 'https://tiles.openfreemap.org';
  }
})();

// 2GIS MapGL — kalit berilgandagina CSP'ga qo'shiladi (SDK skripti + tayl/style/font/api).
// Kalitsiz holatda CSP toza qoladi (faqat MapLibre/OpenFreeMap ishlatiladi).
const USE_2GIS = !!process.env.NEXT_PUBLIC_2GIS_KEY;
const MAP_2GIS = USE_2GIS
  ? ' https://*.2gis.com https://*.maps.2gis.com https://*.api.2gis.com'
  : '';

// Content-Security-Policy — ENFORCING (bosh + /qidiruv xarita sahifalarida
// Report-Only rejimida 0 buzilish tasdiqlangach yoqildi, 2026-08-28).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js gidratsiya inline skriptlaridan foydalanadi + 2GIS SDK loader
  `script-src 'self' 'unsafe-inline' https://eu-assets.i.posthog.com${MAP_2GIS}`,
  "style-src 'self' 'unsafe-inline'",
  // Xarita raster tayllari (ne2_shaded) + sprite PNG + 2GIS tayl/sprite
  `img-src 'self' data: blob: https://images.unsplash.com https://picsum.photos ${MAP_ORIGIN}${MAP_2GIS} https://lh3.googleusercontent.com https://t.me`,
  "font-src 'self' data:",
  // MapLibre/2GIS web-worker'lari blob'dan yuklanadi
  "worker-src 'self' blob:",
  // Xarita: style JSON + vektor tayl (.pbf) + glyph/font (.pbf) + 2GIS style/tayl/api
  `connect-src 'self' ${API_ORIGIN} ${MAP_ORIGIN}${MAP_2GIS} https://eu.i.posthog.com https://eu-assets.i.posthog.com`.trim(),
  "manifest-src 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
  { key: 'Content-Security-Policy', value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  poweredByHeader: false,
  compress: true,
  // Ko'p ishlatiladigan kutubxonalarni per-import tree-shake (bundle kichrayadi)
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.basemaps.cartocdn.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
