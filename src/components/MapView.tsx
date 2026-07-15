'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { Map as MlMap, GeoJSONSource, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslations } from 'next-intl';
import type { ReachabilityResponse } from '@/lib/apiTypes';
import { transitConnectionUrl } from '@/lib/links';
import type { StartPoint } from './App';

/** OpenFreeMap: freie Vektor-Basemap ohne API-Key (Konzept § 7 / § 11.2). */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/** Minimal-Style als Fallback, falls die Basemap nicht erreichbar ist –
 *  die Erreichbarkeits-Layer funktionieren dann trotzdem. */
const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  name: 'fallback',
  sources: {},
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#e6ebe6' } }],
};

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

const COLORS = { area: '#2f855a', stop: '#4a5568', tour: '#dd6b20' };

interface Props {
  data: ReachabilityResponse | null;
  start: StartPoint;
}

export default function MapView({ data, start }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const startInitializedRef = useRef(false);
  const overlaysReadyRef = useRef(false);
  const dataRef = useRef<Props['data']>(null);
  const t = useTranslations('popup');
  const tRef = useRef(t);
  const startRef = useRef(start);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [11.7, 47.8],
      zoom: 7.5,
      attributionControl: {
        compact: true,
        // ODbL-Attribution der Tourdaten (Launch-Checkliste / § 3.3)
        customAttribution:
          'Tourdaten © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende (ODbL) · Fahrpläne via <a href="https://transitous.org">Transitous</a>',
      },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    let usingFallback = false;
    map.on('error', (e) => {
      // Basemap nicht ladbar (z. B. offline) → auf neutralen Hintergrund wechseln
      if (!overlaysReadyRef.current && !usingFallback) {
        usingFallback = true;
        console.warn('Basemap nicht erreichbar, nutze Fallback-Hintergrund.', e.error);
        map.setStyle(FALLBACK_STYLE);
      }
    });

    map.on('load', () => {
      addOverlays(map);
      overlaysReadyRef.current = true;
      if (dataRef.current) applyData(map, dataRef.current);
    });

    map.on('click', 'tours-layer', (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const [tourLon, tourLat] = (feature.geometry as GeoJSON.Point).coordinates;
      new maplibregl.Popup({ offset: 10, maxWidth: '320px' })
        .setLngLat(e.lngLat)
        .setDOMContent(
          buildPopup(feature.properties, tRef.current, {
            start: startRef.current,
            tourLat,
            tourLon,
          })
        )
        .addTo(map);
    });
    map.on('mouseenter', 'tours-layer', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'tours-layer', () => (map.getCanvas().style.cursor = ''));

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      startInitializedRef.current = false;
      overlaysReadyRef.current = false;
    };
  }, []);

  useEffect(() => {
    dataRef.current = data;
    const map = mapRef.current;
    if (map && overlaysReadyRef.current && data) applyData(map, data);
  }, [data]);

  // Startpunkt-Marker pflegen; bei Wechsel dorthin fliegen (nicht beim
  // ersten Rendern – die Karte startet bereits passend zentriert).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: '#1d4ed8' })
        .setLngLat([start.lon, start.lat])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([start.lon, start.lat]);
    }
    if (startInitializedRef.current) {
      map.flyTo({ center: [start.lon, start.lat], zoom: Math.max(map.getZoom(), 8) });
    }
    startInitializedRef.current = true;
  }, [start]);

  return <div ref={containerRef} className="map" />;
}

function addOverlays(map: MlMap) {
  map.addSource('isochrone', { type: 'geojson', data: EMPTY_FC });
  map.addSource('stops', { type: 'geojson', data: EMPTY_FC });
  map.addSource('tours', { type: 'geojson', data: EMPTY_FC });

  map.addLayer({
    id: 'isochrone-fill',
    type: 'fill',
    source: 'isochrone',
    paint: { 'fill-color': COLORS.area, 'fill-opacity': 0.22 },
  });
  map.addLayer({
    id: 'isochrone-line',
    type: 'line',
    source: 'isochrone',
    paint: { 'line-color': COLORS.area, 'line-width': 1.2, 'line-opacity': 0.7 },
  });
  map.addLayer({
    id: 'stops-layer',
    type: 'circle',
    source: 'stops',
    paint: {
      'circle-radius': 3,
      'circle-color': COLORS.stop,
      'circle-opacity': 0.7,
    },
  });
  map.addLayer({
    id: 'tours-layer',
    type: 'circle',
    source: 'tours',
    paint: {
      'circle-radius': 7,
      'circle-color': COLORS.tour,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });
}

function applyData(map: MlMap, data: ReachabilityResponse) {
  (map.getSource('isochrone') as GeoJSONSource).setData(data.isochrone);
  (map.getSource('stops') as GeoJSONSource).setData(data.stops);
  (map.getSource('tours') as GeoJSONSource).setData(data.tours);
}

type PopupT = ReturnType<typeof useTranslations<'popup'>>;

interface PopupContext {
  start: StartPoint;
  tourLat: number;
  tourLon: number;
}

/** Popup rein über DOM-API und textContent – Tourdaten gelten als untrusted,
 *  es wird nie HTML aus Daten interpretiert (Konzept § 11.4). */
function buildPopup(
  props: Record<string, unknown>,
  t: PopupT,
  ctx: PopupContext
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'tour-popup';

  const detailHref =
    `/touren/${encodeURIComponent(String(props.id ?? ''))}` +
    `?von=${ctx.start.lat.toFixed(5)},${ctx.start.lon.toFixed(5)}`;

  // Titel = Link zur Tourseite (auffälligster Einstieg, besonders mobil)
  const title = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = detailHref;
  titleLink.target = '_blank';
  titleLink.rel = 'noopener';
  titleLink.textContent = String(props.name ?? '');
  title.appendChild(titleLink);
  root.appendChild(title);

  const type = document.createElement('p');
  type.className = 'tour-type';
  type.textContent = props.ist_rundtour ? `⟳ ${t('roundTrip')}` : `→ ${t('aToB')}`;
  root.appendChild(type);

  const dauer = Number(props.dauer_min ?? 0);
  const rows: [string, string][] = [
    [t('duration'), t('hours', { hours: Math.floor(dauer / 60), minutes: dauer % 60 })],
    [t('distance'), `${props.distanz_km} km`],
    [t('ascent'), `${props.aufstieg_hm} hm`],
    [t('descent'), `${props.abstieg_hm} hm`],
    [t('difficulty'), t(`difficulty_${props.schwierigkeit}` as 'difficulty_mittel')],
    [t('nearestStop'), `${props.naechste_haltestelle} (${props.haltestellen_distanz_km} km)`],
    [t('transitTime'), `${props.oev_minuten} min`],
  ];

  const table = document.createElement('table');
  for (const [label, value] of rows) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = label;
    const td = document.createElement('td');
    td.textContent = value;
    tr.append(th, td);
    table.appendChild(tr);
  }
  root.appendChild(table);

  const desc = document.createElement('p');
  desc.className = 'tour-desc';
  desc.textContent = String(props.beschreibung ?? '');
  root.appendChild(desc);

  // Links: Detailseite (mit User-Start als ?von= für den Verbindungs-Link
  // dort) und direkte ÖV-Verbindungssuche. IDs stammen aus eigenen
  // Importern (^[a-z0-9-]+$), encodeURIComponent sichert zusätzlich ab.
  const links = document.createElement('p');
  links.className = 'tour-links';

  const detailLink = document.createElement('a');
  detailLink.href = detailHref;
  detailLink.target = '_blank';
  detailLink.rel = 'noopener';
  detailLink.textContent = `${t('detailsLink')} ↗`;
  links.appendChild(detailLink);

  const connectionLink = document.createElement('a');
  connectionLink.href = transitConnectionUrl({
    fromLat: ctx.start.lat,
    fromLon: ctx.start.lon,
    toLat: ctx.tourLat,
    toLon: ctx.tourLon,
  });
  connectionLink.target = '_blank';
  connectionLink.rel = 'noopener noreferrer';
  connectionLink.textContent = `🚆 ${t('connectionLink')} ↗`;
  links.appendChild(connectionLink);

  root.appendChild(links);

  return root;
}
