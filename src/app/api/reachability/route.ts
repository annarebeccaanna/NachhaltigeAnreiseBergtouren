import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getReachableStops, defaultDeparture } from '@/lib/transitous';
import { circlePolygon, unionPolygons, haversineKm, thinStopsToGrid, FEEDER_SPEED_KMH } from '@/lib/geo';
import type { ReachableStop, Tour } from '@/lib/types';
import toursData from '@/data/tours.json';

/**
 * GET /api/reachability – liefert Isochrone + erreichbare Touren in einer
 * Antwort. Im M1-Durchstich kombiniert, weil beide dieselbe teure
 * Haltestellen-Berechnung teilen; die Trennung in /api/isochrone und
 * /api/tours (Konzept § 4) kommt mit der Supabase-Anbindung in M2.
 */

// Eingabegrenzen gemäß Sicherheitskonzept § 11.4: Alpen-Bounding-Box,
// gedeckelte Budgets. Ungültiges wird abgelehnt, bevor Upstream-Calls passieren.
const paramsSchema = z.object({
  lat: z.coerce.number().min(43.0).max(49.0),
  lon: z.coerce.number().min(4.5).max(17.0),
  maxTransitMinutes: z.coerce.number().int().min(15).max(360),
  mode: z.enum(['walk', 'bike']),
  feederMinutes: z.coerce.number().int().min(5).max(90),
  depart: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), 'depart muss ISO 8601 sein')
    .optional(),
});

// Einfaches In-Memory-Rate-Limit pro IP (Platzhalter; wird in M2 durch
// @upstash/ratelimit ersetzt, § 11.3 – In-Memory ist auf Vercel nicht
// instanzübergreifend und dient hier nur der lokalen Entwicklung).
const RATE_LIMIT = { windowMs: 60_000, max: 10 };
const rateBuckets = new Map<string, { windowStart: number; count: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > RATE_LIMIT.windowMs) {
    rateBuckets.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT.max;
}

// Antwort-Cache: identische Parameter = identische Fläche (§ 11.3 Cache-first)
const CACHE_TTL_MS = 60 * 60 * 1000;
const responseCache = new Map<string, { expires: number; body: unknown }>();

const tours = (toursData as { touren: Tour[] }).touren;

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen, bitte kurz warten.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const parsed = paramsSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Parameter', details: parsed.error.issues },
      { status: 400 }
    );
  }
  const params = parsed.data;

  const cacheKey = JSON.stringify(params);
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.body, {
      headers: { 'X-Cache': 'hit' },
    });
  }

  let stops: ReachableStop[];
  let dataMode: 'live' | 'mock';
  try {
    ({ stops, dataMode } = await getReachableStops(params));
  } catch (err) {
    console.error('Transitous-Anfrage fehlgeschlagen:', err);
    return NextResponse.json(
      { error: 'Fahrplandienst nicht erreichbar, bitte später erneut versuchen.' },
      { status: 502 }
    );
  }

  const radiusKm = (FEEDER_SPEED_KMH[params.mode] * params.feederMinutes) / 60;

  // Fläche & Anzeige: ausgedünnte Haltestellen (§ 4.2); die Live-API liefert
  // zehntausende Einträge inkl. Bahnsteig-Duplikaten.
  const displayStops = thinStopsToGrid(stops, radiusKm);
  const circleSteps = displayStops.length > 800 ? 16 : 24;
  const isochrone = unionPolygons(
    displayStops.map((s) => circlePolygon(s.lat, s.lon, radiusKm, circleSteps))
  );

  // Tour-Zuordnung: exakt über die *vollständige* Haltestellenliste (§ 4.2 –
  // die Pin-Auswahl rechnet genau, nur die Fläche ist genähert).
  const reachableTours = tours
    .map((tour) => {
      let nearest: { stop: ReachableStop; distanceKm: number } | null = null;
      for (const stop of stops) {
        const d = haversineKm(tour.start_punkt.lat, tour.start_punkt.lon, stop.lat, stop.lon);
        if (!nearest || d < nearest.distanceKm) nearest = { stop, distanceKm: d };
      }
      return { tour, nearest };
    })
    .filter((t) => t.nearest !== null && t.nearest.distanceKm <= radiusKm);

  const body = {
    meta: {
      dataMode,
      depart: params.depart ?? defaultDeparture().toISOString(),
      mode: params.mode,
      feederRadiusKm: Math.round(radiusKm * 10) / 10,
      stopCount: displayStops.length,
      tourCount: reachableTours.length,
    },
    isochrone: {
      type: 'Feature' as const,
      properties: {},
      geometry: isochrone,
    },
    stops: {
      type: 'FeatureCollection' as const,
      features: displayStops.map((s) => ({
        type: 'Feature' as const,
        properties: { name: s.name, travelMinutes: s.travelMinutes },
        geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
      })),
    },
    tours: {
      type: 'FeatureCollection' as const,
      features: reachableTours.map(({ tour, nearest }) => ({
        type: 'Feature' as const,
        // Nur flache Werte: MapLibre serialisiert verschachtelte Objekte
        // in Feature-Properties zu Strings.
        properties: {
          id: tour.id,
          name: tour.name,
          quelle: tour.quelle,
          ist_rundtour: tour.ist_rundtour,
          distanz_km: tour.distanz_km,
          aufstieg_hm: tour.aufstieg_hm,
          abstieg_hm: tour.abstieg_hm,
          dauer_min: tour.dauer_min,
          schwierigkeit: tour.schwierigkeit,
          beschreibung: tour.beschreibung,
          end_lat: tour.end_punkt.lat,
          end_lon: tour.end_punkt.lon,
          naechste_haltestelle: nearest!.stop.name,
          haltestellen_distanz_km: Math.round(nearest!.distanceKm * 10) / 10,
          oev_minuten: nearest!.stop.travelMinutes,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [tour.start_punkt.lon, tour.start_punkt.lat],
        },
      })),
    },
  };

  if (responseCache.size > 200) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
  responseCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, body });
  return NextResponse.json(body, { headers: { 'X-Cache': 'miss' } });
}
