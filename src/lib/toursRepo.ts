import type { ReachableStop, Tour } from './types';
import { haversineKm, thinStopsToGrid } from './geo';
import { supabaseConfigured, supabaseRpc, supabaseCount, supabaseSelect } from './supabaseRest';
import toursData from '@/data/tours.json';

export interface MatchedTour {
  tour: Tour;
  nearest: { stop: ReachableStop; distanceKm: number };
}

export type TourSource = 'supabase' | 'beispieldaten';

const fixtureTours = (toursData as { touren: Tour[] }).touren;

/**
 * Findet alle Touren, deren Startpunkt höchstens radiusKm von einer
 * erreichten Haltestelle entfernt liegt (§ 4.2: exakte Pin-Auswahl).
 *
 * Quelle ist Supabase, sobald SUPABASE_URL/SUPABASE_SECRET_KEY gesetzt sind
 * und die Tabelle Touren enthält; sonst (lokale Entwicklung, DB noch leer,
 * DB-Störung) die eingebauten Beispieldaten – so degradiert die App
 * kontrolliert statt leer oder kaputt zu sein.
 */
export async function findReachableTours(
  stops: ReachableStop[],
  radiusKm: number
): Promise<{ matches: MatchedTour[]; source: TourSource }> {
  if (supabaseConfigured()) {
    try {
      const matches = await findViaSupabase(stops, radiusKm);
      if (matches.length > 0 || (await supabaseCount('touren')) > 0) {
        return { matches, source: 'supabase' };
      }
      // DB erreichbar, aber noch leer (Import lief noch nicht) → Fixture
    } catch (err) {
      console.error('Supabase-Tourabfrage fehlgeschlagen, nutze Beispieldaten:', err);
    }
  }
  return { matches: matchInMemory(fixtureTours, stops, radiusKm), source: 'beispieldaten' };
}

async function findViaSupabase(
  stops: ReachableStop[],
  radiusKm: number
): Promise<MatchedTour[]> {
  // Feines Raster (~200 m) hält das WKT kompakt, ohne die Trefferauswahl
  // messbar zu verfälschen; die exakte nächste Haltestelle wird anschließend
  // in Node über die vollständige Liste bestimmt.
  const queryStops = thinStopsToGrid(stops, 0.4);
  const wkt =
    'MULTIPOINT(' + queryStops.map((s) => `(${s.lon} ${s.lat})`).join(',') + ')';

  interface Row {
    id: string;
    name: string;
    quelle: string;
    lizenz: string;
    start_lat: number;
    start_lon: number;
    end_lat: number;
    end_lon: number;
    ist_rundtour: boolean;
    distanz_km: number;
    aufstieg_hm: number | null;
    abstieg_hm: number | null;
    dauer_min: number;
    schwierigkeit: Tour['schwierigkeit'] | null;
    beschreibung: string;
  }

  const rows = await supabaseRpc<Row[]>('touren_im_umkreis', {
    haltestellen_wkt: wkt,
    radius_m: Math.round(radiusKm * 1000),
  });

  const tours: Tour[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    quelle: r.quelle,
    lizenz: r.lizenz,
    start_punkt: { lat: r.start_lat, lon: r.start_lon },
    end_punkt: { lat: r.end_lat, lon: r.end_lon },
    ist_rundtour: r.ist_rundtour,
    distanz_km: Number(r.distanz_km),
    aufstieg_hm: r.aufstieg_hm ?? 0,
    abstieg_hm: r.abstieg_hm ?? 0,
    dauer_min: r.dauer_min,
    schwierigkeit: r.schwierigkeit ?? 'mittel',
    beschreibung: r.beschreibung,
  }));

  return matchInMemory(tours, stops, radiusKm);
}

export interface TourDetail {
  tour: Tour;
  geometrie: GeoJSON.LineString | null;
  osmRelation: number | null;
  source: TourSource;
}

/**
 * Einzelne Tour für die Detailseite. Start-/Endpunkt werden aus der
 * gespeicherten Linien-Geometrie abgeleitet (erster/letzter Punkt – die
 * Vereinfachung beim Import erhält die Endpunkte), damit keine
 * Geography-Spalten über REST gelesen werden müssen.
 */
export async function getTourById(id: string): Promise<TourDetail | null> {
  if (supabaseConfigured() && /^[a-z0-9-]{1,60}$/.test(id)) {
    interface Row {
      id: string;
      name: string;
      quelle: string;
      lizenz: string;
      ist_rundtour: boolean;
      distanz_km: number;
      aufstieg_hm: number | null;
      abstieg_hm: number | null;
      dauer_min: number;
      schwierigkeit: Tour['schwierigkeit'] | null;
      beschreibung: string;
      geometrie: GeoJSON.LineString | null;
      metadata: { osm_relation?: number } | null;
    }
    try {
      const rows = await supabaseSelect<Row[]>(
        `touren?id=eq.${encodeURIComponent(id)}&limit=1&select=` +
          'id,name,quelle,lizenz,ist_rundtour,distanz_km,aufstieg_hm,' +
          'abstieg_hm,dauer_min,schwierigkeit,beschreibung,geometrie,metadata'
      );
      const r = rows[0];
      const coords = r?.geometrie?.coordinates ?? [];
      if (r && coords.length >= 2) {
        const [startLon, startLat] = coords[0];
        const [endLon, endLat] = coords[coords.length - 1];
        return {
          tour: {
            id: r.id,
            name: r.name,
            quelle: r.quelle,
            lizenz: r.lizenz,
            start_punkt: { lat: startLat, lon: startLon },
            end_punkt: { lat: endLat, lon: endLon },
            ist_rundtour: r.ist_rundtour,
            distanz_km: Number(r.distanz_km),
            aufstieg_hm: r.aufstieg_hm ?? 0,
            abstieg_hm: r.abstieg_hm ?? 0,
            dauer_min: r.dauer_min,
            schwierigkeit: r.schwierigkeit ?? 'mittel',
            beschreibung: r.beschreibung,
          },
          geometrie: r.geometrie,
          osmRelation: r.metadata?.osm_relation ?? null,
          source: 'supabase',
        };
      }
    } catch (err) {
      console.error('Supabase-Detailabfrage fehlgeschlagen, prüfe Beispieldaten:', err);
    }
  }
  const fixture = fixtureTours.find((t) => t.id === id);
  return fixture
    ? { tour: fixture, geometrie: null, osmRelation: null, source: 'beispieldaten' }
    : null;
}

function matchInMemory(
  tours: Tour[],
  stops: ReachableStop[],
  radiusKm: number
): MatchedTour[] {
  return tours
    .map((tour) => {
      let nearest: MatchedTour['nearest'] | null = null;
      for (const stop of stops) {
        const d = haversineKm(tour.start_punkt.lat, tour.start_punkt.lon, stop.lat, stop.lon);
        if (!nearest || d < nearest.distanceKm) nearest = { stop, distanceKm: d };
      }
      return nearest ? { tour, nearest } : null;
    })
    .filter((m): m is MatchedTour => m !== null && m.nearest.distanceKm <= radiusKm);
}
