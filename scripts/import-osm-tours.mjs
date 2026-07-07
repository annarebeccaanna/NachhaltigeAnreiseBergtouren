/**
 * OSM-Tourimporter (KONZEPT.md § 3.3): lädt Wanderrouten-Relationen
 * (route=hiking) via Overpass, leitet Startpunkt/Endpunkt/Rundtour/Distanz
 * ab, vereinfacht die Geometrie und schreibt per Upsert nach Supabase.
 *
 * Läuft als GitHub Action (wöchentlich + manuell) mit den Secrets
 * SUPABASE_URL und SUPABASE_SECRET_KEY.
 *
 * Aufruf:
 *   node scripts/import-osm-tours.mjs [--dry-run] [--limit=400] [--bbox=s,w,n,e]
 *   node scripts/import-osm-tours.mjs --regions [--limit=1500]   # ganzer Alpenraum
 *
 * --regions importiert alle Kacheln aus scripts/import-regions.json
 * nacheinander (mit Pause, Overpass-Fairness). --dry-run schreibt nur
 * .import-preview.json (kein DB-Zugriff nötig) – so ist der Overpass-/
 * Transformationsteil ohne Secrets testbar.
 */

const OVERPASS_URL = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

// Startgebiet M2: Bayerische Alpen + Tirol; wird schrittweise auf den
// Alpenkonventions-Perimeter erweitert (Kostenkontrolle Overpass/DB).
const DEFAULT_BBOX = '47.2,10.6,47.95,12.9';
const DEFAULT_LIMIT = 400;

const MIN_KM = 3;
const MAX_KM = 60;
const LOOP_TOLERANCE_KM = 0.3;
const WALK_SPEED_KMH = 4;
const SIMPLIFY_TOLERANCE_DEG = 0.00025; // ~25 m
const MAX_GEOMETRY_POINTS = 500;
const MAX_TEXT = 500; // Fremdtexte längenbegrenzen (§ 11.4)

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.split('=');
    return [k, v ?? 'true'];
  })
);
const dryRun = args.has('--dry-run');
const useRegions = args.has('--regions');
const limit = Number(args.get('--limit') ?? (useRegions ? 1500 : DEFAULT_LIMIT));
const bbox = args.get('--bbox') ?? DEFAULT_BBOX;

/** Pause zwischen Regions-Abfragen (Overpass-Fairness). */
const REGION_PAUSE_MS = 8000;

main().catch((err) => {
  console.error('Import fehlgeschlagen:', err);
  process.exitCode = 1;
});

async function main() {
  if (!dryRun && (!SUPABASE_URL || !SUPABASE_SECRET_KEY)) {
    throw new Error('SUPABASE_URL/SUPABASE_SECRET_KEY fehlen (oder --dry-run nutzen).');
  }

  const regions = useRegions
    ? (await import('./import-regions.json', { with: { type: 'json' } })).default.regionen
    : [{ name: 'custom', bbox }];

  // Über OSM-Relations-ID dedupliziert – Regions-Kacheln überlappen bewusst.
  const toursById = new Map();
  const skipped = { keineGeometrie: 0, zuKurzOderLang: 0 };

  for (const [i, region] of regions.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, REGION_PAUSE_MS));
    console.log(
      `[${i + 1}/${regions.length}] Overpass: route=hiking, ` +
        `${region.name} (${region.bbox}), limit=${limit}`
    );
    const relations = await fetchOverpass(region.bbox);
    let added = 0;
    for (const rel of relations) {
      if (toursById.has(`osm-${rel.id}`)) continue;
      const tour = transformRelation(rel);
      if (tour === 'no-geometry') skipped.keineGeometrie += 1;
      else if (tour === 'bad-length') skipped.zuKurzOderLang += 1;
      else {
        toursById.set(tour.id, tour);
        added += 1;
      }
    }
    console.log(`  → ${relations.length} Relationen, ${added} neue Touren`);
  }

  const tours = [...toursById.values()];
  console.log(
    `Transformiert gesamt: ${tours.length} Touren ` +
      `(übersprungen: ${skipped.keineGeometrie} ohne Geometrie, ` +
      `${skipped.zuKurzOderLang} außerhalb ${MIN_KM}–${MAX_KM} km)`
  );

  if (dryRun) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync('.import-preview.json', JSON.stringify(tours.slice(0, 50), null, 2));
    console.log(
      `Dry-Run: ${tours.length} Touren transformiert, ` +
        'Vorschau (50) in .import-preview.json geschrieben.'
    );
    printSample(tours);
    return;
  }

  const laufId = await startImportLauf(
    useRegions ? `osm-overpass (${regions.length} Regionen, Alpenraum)` : `osm-overpass bbox=${bbox}`
  );
  try {
    await upsertTours(tours);
    await finishImportLauf(laufId, { status: 'ok', touren_anzahl: tours.length });
    console.log(`Import abgeschlossen: ${tours.length} Touren upserted.`);
  } catch (err) {
    await finishImportLauf(laufId, {
      status: 'fehler',
      fehler: String(err).slice(0, MAX_TEXT),
    }).catch(() => {});
    throw err;
  }
}

async function fetchOverpass(bboxParam) {
  const query = `[out:json][timeout:180];
relation["route"="hiking"]["name"](${bboxParam});
out geom ${limit};`;

  // Die öffentliche Overpass-Instanz ist regelmäßig ausgelastet (429/504);
  // mit Backoff erneut versuchen statt den Lauf sofort abzubrechen.
  const delaysSec = [0, 30, 90, 180];
  let lastError;
  for (const delay of delaysSec) {
    if (delay > 0) {
      console.log(`Overpass ausgelastet, neuer Versuch in ${delay}s …`);
      await new Promise((r) => setTimeout(r, delay * 1000));
    }
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Overpass-Nutzungsrichtlinie verlangt einen identifizierenden
          // User-Agent; ohne ihn blockt das Apache-Frontend mit 406.
          'User-Agent':
            'NachhaltigeAnreiseBergtouren/0.1 (github.com/annarebeccaanna/NachhaltigeAnreiseBergtouren)',
        },
        body: 'data=' + encodeURIComponent(query),
      });
      if (res.ok) {
        const body = await res.json();
        return (body.elements ?? []).filter((e) => e.type === 'relation');
      }
      lastError = new Error(`Overpass antwortete ${res.status}`);
      if (![429, 502, 504, 406].includes(res.status)) throw lastError;
    } catch (err) {
      // Verbindungsfehler/Timeouts sind ebenfalls Überlast-Symptome → retry
      if (err === lastError) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

function transformRelation(rel) {
  const coords = [];
  for (const member of rel.members ?? []) {
    if (member.type === 'way' && Array.isArray(member.geometry)) {
      for (const p of member.geometry) coords.push([p.lon, p.lat]);
    }
  }
  if (coords.length < 2) return 'no-geometry';

  let distanzKm = 0;
  for (let i = 1; i < coords.length; i++) {
    distanzKm += haversineKm(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
  }
  if (distanzKm < MIN_KM || distanzKm > MAX_KM) return 'bad-length';

  const start = coords[0];
  const end = coords[coords.length - 1];
  const istRundtour = haversineKm(start[1], start[0], end[1], end[0]) < LOOP_TOLERANCE_KM;
  const tags = rel.tags ?? {};

  return {
    id: `osm-${rel.id}`,
    name: clip(tags.name, 200),
    quelle: 'OpenStreetMap (Overpass)',
    lizenz: 'ODbL – © OpenStreetMap-Mitwirkende',
    start_punkt: `POINT(${start[0]} ${start[1]})`,
    end_punkt: `POINT(${end[0]} ${end[1]})`,
    ist_rundtour: istRundtour,
    geometrie: {
      type: 'LineString',
      coordinates: simplify(coords, SIMPLIFY_TOLERANCE_DEG).slice(0, MAX_GEOMETRY_POINTS),
    },
    distanz_km: Math.round(distanzKm * 10) / 10,
    aufstieg_hm: null, // OSM liefert keine Höhen; DEM-Anreicherung folgt (M3)
    abstieg_hm: null,
    dauer_min: Math.max(30, Math.round((distanzKm / WALK_SPEED_KMH) * 60)),
    schwierigkeit: mapSacScale(tags.sac_scale),
    beschreibung: clip(tags.description ?? tags['description:de'] ?? '', MAX_TEXT),
    metadata: {
      osm_relation: rel.id,
      sac_scale: tags.sac_scale ?? null,
      osmc_symbol: tags['osmc:symbol'] ?? null,
      dauer_geschaetzt: true,
      // Relationen-Mitglieder sind nicht immer sortiert; Distanz/Start/Ende
      // sind dann Näherungen. Wird bei der DEM-Anreicherung (M3) bereinigt.
      geometrie_ungeprueft: true,
    },
  };
}

function mapSacScale(sac) {
  if (!sac) return null;
  if (sac === 'hiking') return 'leicht';
  if (sac === 'mountain_hiking') return 'mittel';
  return 'schwer'; // demanding_mountain_hiking und alles Alpine
}

function clip(text, max) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function haversineKm(aLat, aLon, bLat, bLon) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Douglas-Peucker-Vereinfachung auf Grad-Basis (ausreichend für Darstellung). */
function simplify(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointToSegment(points[i], [sx, sy], [ex, ey]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]];
  const left = simplify(points.slice(0, index + 1), tolerance);
  const right = simplify(points.slice(index), tolerance);
  return left.slice(0, -1).concat(right);
}

function pointToSegment([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// --- Supabase-REST (sb_secret im apikey-Header, § 11.2) ---

async function supabaseFetch(path, options) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SECRET_KEY,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${path} antwortete ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res;
}

async function startImportLauf(quelle) {
  const res = await supabaseFetch('/rest/v1/import_laeufe', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ quelle }),
  });
  const [row] = await res.json();
  return row.id;
}

async function finishImportLauf(id, fields) {
  await supabaseFetch(`/rest/v1/import_laeufe?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...fields, beendet_am: new Date().toISOString() }),
  });
}

async function upsertTours(tours) {
  const CHUNK = 200;
  for (let i = 0; i < tours.length; i += CHUNK) {
    await supabaseFetch('/rest/v1/touren?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(tours.slice(i, i + CHUNK)),
    });
    console.log(`Upsert: ${Math.min(i + CHUNK, tours.length)}/${tours.length}`);
  }
}

function printSample(tours) {
  for (const t of tours.slice(0, 5)) {
    console.log(
      `  · ${t.name} — ${t.distanz_km} km, ${t.ist_rundtour ? 'Rundtour' : 'Strecke'}, ` +
        `Schwierigkeit: ${t.schwierigkeit ?? 'unbekannt'}`
    );
  }
}
