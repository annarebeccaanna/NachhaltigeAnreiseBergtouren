'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  name: 'fallback',
  sources: {},
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#e6ebe6' } }],
};

interface Props {
  geometrie: GeoJSON.LineString | null;
  start: { lat: number; lon: number };
  end: { lat: number; lon: number };
}

/** Kleine Karte für die Tour-Detailseite: Verlauf + Start-/Endpunkt. */
export default function TourMap({ geometrie, start, end }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([start.lon, start.lat]);
    bounds.extend([end.lon, end.lat]);
    for (const [lon, lat] of geometrie?.coordinates ?? []) bounds.extend([lon, lat]);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 40, maxZoom: 13 },
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    let usingFallback = false;
    map.on('error', () => {
      if (!usingFallback) {
        usingFallback = true;
        map.setStyle(FALLBACK_STYLE);
      }
    });

    map.on('load', () => {
      if (geometrie) {
        map.addSource('tour', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: geometrie },
        });
        map.addLayer({
          id: 'tour-line',
          type: 'line',
          source: 'tour',
          paint: { 'line-color': '#dd6b20', 'line-width': 3, 'line-opacity': 0.85 },
        });
      }
    });

    new maplibregl.Marker({ color: '#2f855a' }).setLngLat([start.lon, start.lat]).addTo(map);
    if (end.lat !== start.lat || end.lon !== start.lon) {
      new maplibregl.Marker({ color: '#c53030' }).setLngLat([end.lon, end.lat]).addTo(map);
    }

    return () => map.remove();
  }, [geometrie, start.lat, start.lon, end.lat, end.lon]);

  return <div ref={containerRef} className="tour-map" />;
}
