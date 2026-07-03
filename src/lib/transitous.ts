import type { ReachableStop, ReachabilityParams } from './types';
import { MUNICH_STOPS } from './fixtures/munichStops';

const TRANSITOUS_BASE = process.env.TRANSITOUS_BASE_URL ?? 'https://api.transitous.org';

/**
 * Liefert alle Haltestellen, die vom Startpunkt innerhalb des ÖV-Budgets
 * erreichbar sind (Konzept § 2.1, Schritt 1).
 *
 * Modi (env TRANSITOUS_MODE):
 *  - "live" (Default): MOTIS one-to-all der Transitous-API.
 *  - "mock": statische Fixture (Münchner Umland) für Umgebungen ohne
 *    Netzzugang zu api.transitous.org.
 */
export async function getReachableStops(
  params: Pick<ReachabilityParams, 'lat' | 'lon' | 'maxTransitMinutes' | 'depart'>
): Promise<{ stops: ReachableStop[]; dataMode: 'live' | 'mock' }> {
  if ((process.env.TRANSITOUS_MODE ?? 'live') === 'mock') {
    return {
      stops: MUNICH_STOPS.filter((s) => s.travelMinutes <= params.maxTransitMinutes),
      dataMode: 'mock',
    };
  }
  return { stops: await fetchOneToAll(params), dataMode: 'live' };
}

/** Nächster Samstag 07:00 lokale Zeit als Default-Abfahrt (§ 2.1). */
export function defaultDeparture(now = new Date()): Date {
  const d = new Date(now);
  const daysUntilSaturday = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  d.setHours(7, 0, 0, 0);
  return d;
}

/** Antwortformat von MOTIS /api/v1/one-to-all (verifiziert 2026-07-02 gegen
 *  api.transitous.org): Ortsdaten unter `place`, `duration` in **Minuten**. */
interface OneToAllEntry {
  place: {
    stopId?: string;
    parentId?: string;
    name?: string;
    lat: number;
    lon: number;
  };
  duration: number;
}

async function fetchOneToAll(
  params: Pick<ReachabilityParams, 'lat' | 'lon' | 'maxTransitMinutes' | 'depart'>
): Promise<ReachableStop[]> {
  const depart = params.depart ? new Date(params.depart) : defaultDeparture();
  const query = new URLSearchParams({
    one: `${params.lat},${params.lon}`,
    time: depart.toISOString(),
    maxTravelTime: String(params.maxTransitMinutes),
    arriveBy: 'false',
  });
  const res = await fetch(`${TRANSITOUS_BASE}/api/v1/one-to-all?${query}`, {
    headers: { Accept: 'application/json' },
    // Fahrplanlage ändert sich langsam; identische Anfragen 1 h cachen (§ 11.3)
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Transitous one-to-all antwortete ${res.status}`);
  }
  const body = (await res.json()) as { all?: OneToAllEntry[] };
  return (body.all ?? [])
    .filter(
      (e) =>
        e.place &&
        typeof e.place.lat === 'number' &&
        typeof e.place.lon === 'number' &&
        typeof e.duration === 'number' &&
        e.duration <= params.maxTransitMinutes
    )
    .map((e, i) => ({
      id: e.place.stopId ?? `stop-${i}`,
      name: e.place.name ?? 'Haltestelle',
      lat: e.place.lat,
      lon: e.place.lon,
      travelMinutes: e.duration,
    }));
}
