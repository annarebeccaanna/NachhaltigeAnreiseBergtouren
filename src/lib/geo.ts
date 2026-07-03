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

/** Vereinigung vieler Kreise zu einem MultiPolygon (GeoJSON-Koordinaten). */
export function unionPolygons(polygons: PcPolygon[]): GeoJSON.MultiPolygon {
  if (polygons.length === 0) {
    return { type: 'MultiPolygon', coordinates: [] };
  }
  const [first, ...rest] = polygons;
  const result = polygonClipping.union(first, ...rest);
  return { type: 'MultiPolygon', coordinates: result };
}
