import polygonClipping, { type Polygon as PcPolygon } from 'polygon-clipping';

/** Zubringer-Geschwindigkeiten (km/h) für Kreis-Buffer im M1-Durchstich.
 *  Ab M2 durch echtes Straßen-Routing ersetzt (Konzept § 3.2). */
export const FEEDER_SPEED_KMH = { walk: 4, bike: 14 } as const;

const EARTH_RADIUS_KM = 6371;

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Kreis um (lat, lon) als GeoJSON-Polygonring (Näherung, ausreichend für kleine Radien). */
export function circlePolygon(lat: number, lon: number, radiusKm: number, steps = 24): PcPolygon {
  const ring: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  const dLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const dLon = dLat / Math.cos(latRad);
  for (let i = 0; i <= steps; i++) {
    const angle = (2 * Math.PI * i) / steps;
    ring.push([lon + dLon * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  return [ring];
}

/** Vereinigung vieler Kreise zu einem MultiPolygon (GeoJSON-Koordinaten).
 *  Gestückelt, weil polygon-clipping bei Tausenden Argumenten auf einmal
 *  deutlich langsamer wird und die Argumentliste begrenzt ist. */
export function unionPolygons(polygons: PcPolygon[]): GeoJSON.MultiPolygon {
  if (polygons.length === 0) {
    return { type: 'MultiPolygon', coordinates: [] };
  }
  const CHUNK = 400;
  let result: ReturnType<typeof polygonClipping.union> = [polygons[0]];
  for (let i = 1; i < polygons.length; i += CHUNK) {
    result = polygonClipping.union(result, ...polygons.slice(i, i + CHUNK));
  }
  return { type: 'MultiPolygon', coordinates: result };
}

/**
 * Dünnt Haltestellen auf ein Raster aus (§ 4.2): Bahnsteige/Mast-Duplikate
 * und dichte Stadtnetze kollabieren auf einen Vertreter pro Zelle (kürzeste
 * Reisezeit gewinnt). Zellgröße relativ zum Zubringer-Radius, damit die
 * Flächenabdeckung optisch praktisch unverändert bleibt.
 */
export function thinStopsToGrid<T extends { lat: number; lon: number; travelMinutes: number }>(
  stops: T[],
  radiusKm: number
): T[] {
  const cellKm = Math.max(radiusKm * 0.5, 0.4);
  const cellLat = cellKm / 111;
  const best = new Map<string, T>();
  for (const stop of stops) {
    const cellLon = cellLat / Math.cos((stop.lat * Math.PI) / 180);
    const key = `${Math.round(stop.lat / cellLat)}:${Math.round(stop.lon / cellLon)}`;
    const current = best.get(key);
    if (!current || stop.travelMinutes < current.travelMinutes) best.set(key, stop);
  }
  return [...best.values()];
}
