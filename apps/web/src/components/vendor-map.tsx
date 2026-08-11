'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Vendor } from '@/lib/api';

/** Toshkent markazi (lng, lat) */
const TASHKENT: [number, number] = [69.2797, 41.3111];

/** Kalitsiz, bepul CARTO Voyager raster tayllar (OSM ma'lumoti). Premium light basemap. */
const CARTO = ['a', 'b', 'c', 'd'].map(
  (s) => `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png`,
);

const BRAND = '#2563EB';
const TEAL = '#14B8A6';
const VIOLET = '#7C3AED';

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

type Props = {
  vendors: Vendor[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
};

function toGeoJSON(vendors: Vendor[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: vendors
      .filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng))
      .map((v) => ({
        type: 'Feature',
        properties: {
          vid: v.id,
          slug: v.slug,
          name: v.name,
          rating: v.rating,
          reviews: v.reviewCount,
          district: v.district ?? '',
          cat: v.category?.name ?? '',
          icon: v.category?.icon ?? '📍',
          photo: v.photos?.[0] ?? '',
        },
        geometry: { type: 'Point', coordinates: [v.lng, v.lat] },
      })),
  };
}

function popupHTML(p: Record<string, unknown>): string {
  const rating = Number(p.rating).toFixed(1);
  const img = p.photo
    ? `<span class="izla-pop-img" style="background-image:url('${esc(p.photo)}')"></span>`
    : '';
  const loc = [esc(p.cat), esc(p.district)].filter(Boolean).join(' · ');
  return `<a class="izla-pop" href="/vendor/${esc(p.slug)}">
    ${img}
    <span class="izla-pop-body">
      <span class="izla-pop-title">${esc(p.name)}</span>
      <span class="izla-pop-meta"><b>★ ${rating}</b> · ${esc(p.reviews)} sharh</span>
      <span class="izla-pop-cat">${esc(p.icon)} ${loc}</span>
      <span class="izla-pop-link">Batafsil →</span>
    </span>
  </a>`;
}

export function VendorMap({ vendors, selectedId, hoveredId, onSelect, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const loadedRef = useRef(false);
  const prevSelRef = useRef<string | null>(null);
  const prevHovRef = useRef<string | null>(null);

  // Callback/vendorlarni ref orqali — effektni qayta ishga tushirmaslik uchun.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const vendorsRef = useRef(vendors);
  vendorsRef.current = vendors;

  // ── Xarita init (bir marta) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        // Kalitsiz, ishonchli glyph manbasi (MapLibre CDN — klaster raqamlari uchun).
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          carto: {
            type: 'raster',
            tiles: CARTO,
            tileSize: 256,
            attribution: '© OpenStreetMap · © CARTO',
          },
        },
        layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
      },
      center: TASHKENT,
      zoom: 10.5,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      map.addSource('vendors', {
        type: 'geojson',
        data: toGeoJSON(vendorsRef.current),
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 14,
        promoteId: 'vid',
      });

      // Klaster doiralari
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'vendors',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], TEAL, 10, BRAND, 25, VIOLET],
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 25, 26],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,.9)',
          'circle-opacity': 0.92,
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'vendors',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Yakka nuqta halo (glow) — hover/selectda kattalashadi
      map.addLayer({
        id: 'point-halo',
        type: 'circle',
        source: 'vendors',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            22,
            ['boolean', ['feature-state', 'hover'], false],
            18,
            0,
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            TEAL,
            BRAND,
          ],
          'circle-opacity': 0.18,
        },
      });

      // Yakka nuqta (pin dot)
      map.addLayer({
        id: 'point',
        type: 'circle',
        source: 'vendors',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            10,
            ['boolean', ['feature-state', 'hover'], false],
            9,
            7,
          ],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            TEAL,
            BRAND,
          ],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      loadedRef.current = true;

      // Boshlang'ich fitBounds
      fitToVendors(map, vendorsRef.current);

      // ── Interaktsiya ──
      map.on('click', 'clusters', (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        const clusterId = f?.properties?.cluster_id;
        const src = map.getSource('vendors') as maplibregl.GeoJSONSource;
        if (clusterId == null || !src) return;
        src.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geom = f.geometry as GeoJSON.Point;
          map.easeTo({ center: geom.coordinates as [number, number], zoom: zoom + 0.2 });
        });
      });

      map.on('click', 'point', (e) => {
        const f = e.features?.[0];
        const vid = f?.properties?.vid as string | undefined;
        if (vid) onSelectRef.current(vid);
      });

      for (const layer of ['clusters', 'point'] as const) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }

      // Bo'sh joyga bosilsa tanlovni tozalash
      map.on('click', (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ['point', 'clusters'] });
        if (hits.length === 0) onSelectRef.current(null);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Vendorlar o'zgarsa manbani yangilash + qayta fit ──────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const src = map.getSource('vendors') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(toGeoJSON(vendors));
    prevSelRef.current = null;
    prevHovRef.current = null;
    fitToVendors(map, vendors);
  }, [vendors]);

  // ── Tanlangan vendor: feature-state + flyTo + popup ───────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    if (prevSelRef.current && prevSelRef.current !== selectedId) {
      map.setFeatureState({ source: 'vendors', id: prevSelRef.current }, { selected: false });
    }
    prevSelRef.current = selectedId;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    if (!selectedId) return;

    map.setFeatureState({ source: 'vendors', id: selectedId }, { selected: true });

    const v = vendorsRef.current.find((x) => x.id === selectedId);
    if (!v || !Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return;

    map.flyTo({ center: [v.lng, v.lat], zoom: Math.max(map.getZoom(), 13.5), speed: 0.8 });
    popupRef.current = new maplibregl.Popup({
      offset: 16,
      closeButton: false,
      className: 'izla-popup',
      maxWidth: '280px',
    })
      .setLngLat([v.lng, v.lat])
      .setHTML(
        popupHTML({
          slug: v.slug,
          name: v.name,
          rating: v.rating,
          reviews: v.reviewCount,
          district: v.district ?? '',
          cat: v.category?.name ?? '',
          icon: v.category?.icon ?? '📍',
          photo: v.photos?.[0] ?? '',
        }),
      )
      .addTo(map);
  }, [selectedId]);

  // ── Hover holati ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (prevHovRef.current && prevHovRef.current !== hoveredId) {
      map.setFeatureState({ source: 'vendors', id: prevHovRef.current }, { hover: false });
    }
    prevHovRef.current = hoveredId;
    if (hoveredId) map.setFeatureState({ source: 'vendors', id: hoveredId }, { hover: true });
  }, [hoveredId]);

  return <div ref={containerRef} className={className} />;
}

function fitToVendors(map: maplibregl.Map, vendors: Vendor[]) {
  const pts = vendors.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng));
  if (pts.length === 0) {
    map.easeTo({ center: TASHKENT, zoom: 10.5 });
    return;
  }
  if (pts.length === 1) {
    map.easeTo({ center: [pts[0].lng, pts[0].lat], zoom: 13.5 });
    return;
  }
  const b = new maplibregl.LngLatBounds();
  for (const v of pts) b.extend([v.lng, v.lat]);
  map.fitBounds(b, { padding: 64, maxZoom: 14, duration: 600 });
}
