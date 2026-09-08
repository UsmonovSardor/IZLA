'use client';

import dynamic from 'next/dynamic';
import type { VendorMapProps } from './vendor-map-shared';

/**
 * Xarita provayder dispatcher.
 * - NEXT_PUBLIC_2GIS_KEY bor  → 2GIS MapGL (Toshkent uchun eng aniq: binolar, POI).
 * - kalit yo'q               → MapLibre + OpenFreeMap (kalitsiz, bepul fallback).
 *
 * Ikkala implementatsiya ham alohida lazy chunk (ssr:false) — faqat tanlangani
 * klientga yuklanadi, xarita SDK'lari serverda umuman ishga tushmaydi.
 * Kalit qo'shilib qayta deploy qilinganda avtomatik 2GIS'ga o'tadi.
 */
const USE_2GIS = !!process.env.NEXT_PUBLIC_2GIS_KEY;

const Impl = USE_2GIS
  ? dynamic(() => import('./vendor-map-2gis').then((m) => m.TwoGisVendorMap), { ssr: false })
  : dynamic(() => import('./vendor-map-maplibre').then((m) => m.MapLibreVendorMap), { ssr: false });

export function VendorMap(props: VendorMapProps) {
  return <Impl {...props} />;
}
