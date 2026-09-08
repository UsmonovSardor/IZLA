'use client';

import { useEffect, useRef } from 'react';
import { load } from '@2gis/mapgl';
import { Clusterer } from '@2gis/mapgl-clusterer';
import type { InputMarker, ClustererPointerEvent } from '@2gis/mapgl-clusterer';
import type { Vendor } from '@/lib/api';
import {
  TASHKENT,
  BRAND,
  TEAL,
  esc,
  withGeo,
  popupCardHTML,
  type VendorMapProps,
} from './vendor-map-shared';

/**
 * 2GIS MapGL provayder — Toshkent uchun eng aniq basemap (binolar, kirish eshiklari,
 * biznes POI). NEXT_PUBLIC_2GIS_KEY bo'lgandagina ishlatiladi (dispatcher tanlaydi).
 * Marker/klaster/popup MapLibre versiyasi bilan bir xil brend ko'rinishda (HTML markerlar).
 */
const KEY = process.env.NEXT_PUBLIC_2GIS_KEY ?? '';

type MapGLModule = Awaited<ReturnType<typeof load>>;
type MapGLMap = InstanceType<MapGLModule['Map']>;
type MapGLHtmlMarker = InstanceType<MapGLModule['HtmlMarker']>;

/** Yakka vendor pin HTML'i (klaster ichida ochilганda ko'rinadi). */
function pinHTML(): string {
  return `<div class="izla-2g-pin"><span class="izla-2g-dot"></span></div>`;
}

/** Klaster doira HTML'i — TZ brend ranglari, soni bo'yicha kattalashadi. */
function clusterHTML(count: number): string {
  const size = count < 10 ? 38 : count < 25 ? 44 : 52;
  const bg = count < 10 ? TEAL : count < 25 ? BRAND : '#7C3AED';
  return `<div class="izla-2g-cluster" style="width:${size}px;height:${size}px;background:${bg}">${esc(
    count,
  )}</div>`;
}

function vendorToMarker(v: Vendor): InputMarker {
  return {
    type: 'html',
    coordinates: [v.lng, v.lat],
    html: pinHTML(),
    anchor: [17, 17],
    userData: { vid: v.id },
  };
}

export function TwoGisVendorMap({
  vendors,
  selectedId,
  hoveredId,
  onSelect,
  labels,
  className,
}: VendorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapGLMap | null>(null);
  const mapglRef = useRef<MapGLModule | null>(null);
  const clustererRef = useRef<Clusterer | null>(null);
  const selMarkerRef = useRef<MapGLHtmlMarker | null>(null);
  const hovMarkerRef = useRef<MapGLHtmlMarker | null>(null);
  const loadedRef = useRef(false);

  // Callback/data ref orqali — init effektini qayta ishga tushirmaslik uchun.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const vendorsRef = useRef(vendors);
  vendorsRef.current = vendors;
  const labelsRef = useRef(labels);
  labelsRef.current = labels;

  // ── Xarita init (bir marta) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !KEY) return;
    let cancelled = false;

    load().then((mapgl) => {
      if (cancelled || !containerRef.current) return;

      const map = new mapgl.Map(containerRef.current, {
        key: KEY,
        center: TASHKENT,
        zoom: 11,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: 'topRight',
        trafficControl: false,
        copyright: 'bottomRight',
      });
      mapRef.current = map;
      mapglRef.current = mapgl;

      const clusterer = new Clusterer(map, { radius: 60 });
      clustererRef.current = clusterer;
      clusterer.load(withGeo(vendorsRef.current).map(vendorToMarker));

      clusterer.on('click', (e: ClustererPointerEvent) => {
        const t = e.target;
        if (t.type === 'cluster') {
          const zoom = clusterer.getClusterExpansionZoom(t.id);
          map.setCenter(e.lngLat, { duration: 400 });
          map.setZoom(Math.min(zoom + 0.2, 18), { duration: 400 });
        } else {
          const vid = (t.data as { userData?: { vid?: string } }).userData?.vid;
          if (vid) onSelectRef.current(vid);
        }
      });

      loadedRef.current = true;
      fitToVendors(map, vendorsRef.current);
    });

    return () => {
      cancelled = true;
      selMarkerRef.current?.destroy();
      hovMarkerRef.current?.destroy();
      clustererRef.current?.destroy();
      mapRef.current?.destroy();
      selMarkerRef.current = null;
      hovMarkerRef.current = null;
      clustererRef.current = null;
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Vendorlar o'zgarsa klastererni qayta yuklash + fit ────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const clusterer = clustererRef.current;
    if (!map || !clusterer || !loadedRef.current) return;
    clusterer.load(withGeo(vendors).map(vendorToMarker));
    selMarkerRef.current?.destroy();
    selMarkerRef.current = null;
    hovMarkerRef.current?.destroy();
    hovMarkerRef.current = null;
    fitToVendors(map, vendors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors]);

  // ── Tanlangan vendor: highlight pin + popup karta + markazlash ────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    selMarkerRef.current?.destroy();
    selMarkerRef.current = null;
    if (!selectedId) return;

    const v = vendorsRef.current.find((x) => x.id === selectedId);
    if (!v || !Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return;

    map.setCenter([v.lng, v.lat], { duration: 500 });
    if (map.getZoom() < 13.5) map.setZoom(13.5, { duration: 500 });

    const HtmlMarker = mapglRef.current?.HtmlMarker;
    if (!HtmlMarker) return;
    selMarkerRef.current = new HtmlMarker(map, {
      coordinates: [v.lng, v.lat],
      html: `<div class="izla-2g-pop">${popupCardHTML(v, labelsRef.current)}</div>`,
      anchor: [0, 0],
      zIndex: 100,
      interactive: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ── Hover: ro'yxatdan yengil halqa markeri ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    hovMarkerRef.current?.destroy();
    hovMarkerRef.current = null;
    if (!hoveredId || hoveredId === selectedId) return;

    const v = vendorsRef.current.find((x) => x.id === hoveredId);
    if (!v || !Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return;

    const HtmlMarker = mapglRef.current?.HtmlMarker;
    if (!HtmlMarker) return;
    hovMarkerRef.current = new HtmlMarker(map, {
      coordinates: [v.lng, v.lat],
      html: `<div class="izla-2g-hoverring"></div>`,
      anchor: [17, 17],
      zIndex: 50,
      interactive: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredId, selectedId]);

  return <div ref={containerRef} className={className} />;
}

function fitToVendors(map: MapGLMap, vendors: Vendor[]) {
  const pts = withGeo(vendors);
  if (pts.length === 0) {
    map.setCenter(TASHKENT, { duration: 300 });
    map.setZoom(10.5, { duration: 300 });
    return;
  }
  if (pts.length === 1) {
    map.setCenter([pts[0].lng, pts[0].lat], { duration: 400 });
    map.setZoom(13.5, { duration: 400 });
    return;
  }
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  for (const v of pts) {
    minLng = Math.min(minLng, v.lng);
    minLat = Math.min(minLat, v.lat);
    maxLng = Math.max(maxLng, v.lng);
    maxLat = Math.max(maxLat, v.lat);
  }
  map.fitBounds(
    { southWest: [minLng, minLat], northEast: [maxLng, maxLat] },
    { padding: { top: 64, right: 64, bottom: 64, left: 64 }, maxZoom: 15 },
  );
}
