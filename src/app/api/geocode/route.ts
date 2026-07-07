import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimited, clientIp } from '@/lib/rateLimit';
import type { GeocodeResult } from '@/lib/apiTypes';

/**
 * GET /api/geocode – Ortssuche für die Startpunktwahl (Konzept § 3.4).
 * Serverseitiger Proxy auf Photon (OSM-basiert, frei): hält die
 * Client-CSP eng, erlaubt Rate Limiting/Caching und gibt die User-IP
 * nicht an den Drittdienst weiter (§ 11.7).
 */

const PHOTON_URL = process.env.PHOTON_URL ?? 'https://photon.komoot.io';
// Alpenraum-BBox (§ 11.4): minLon,minLat,maxLon,maxLat
const ALPS_BBOX = '4.5,43.0,17.0,49.0';

const paramsSchema = z.object({
  q: z.string().trim().min(2).max(80),
  lang: z.enum(['de', 'en', 'fr', 'it']).default('de'),
});

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_value?: string;
  };
}

const cache = new Map<string, { expires: number; body: GeocodeResult[] }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  if (await rateLimited('geocode', clientIp(request.headers), 30)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen, bitte kurz warten.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const parsed = paramsSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 });
  }
  const { q, lang } = parsed.data;

  const cacheKey = `${lang}:${q.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ results: cached.body }, { headers: { 'X-Cache': 'hit' } });
  }

  const query = new URLSearchParams({
    q,
    lang,
    limit: '6',
    bbox: ALPS_BBOX,
  });
  let features: PhotonFeature[];
  try {
    const res = await fetch(`${PHOTON_URL}/api?${query}`, {
      headers: {
        'User-Agent':
          'NachhaltigeAnreiseBergtouren/0.1 (github.com/annarebeccaanna/NachhaltigeAnreiseBergtouren)',
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`Photon antwortete ${res.status}`);
    features = ((await res.json()) as { features?: PhotonFeature[] }).features ?? [];
  } catch (err) {
    console.error('Geocoding fehlgeschlagen:', err);
    return NextResponse.json(
      { error: 'Ortssuche derzeit nicht verfügbar.' },
      { status: 502 }
    );
  }

  const results: GeocodeResult[] = [];
  for (const f of features) {
    const [lon, lat] = f.geometry?.coordinates ?? [];
    if (typeof lat !== 'number' || typeof lon !== 'number' || !f.properties?.name) continue;
    const detail = [f.properties.city, f.properties.state, f.properties.country]
      .filter((s) => s && s !== f.properties.name)
      .join(', ');
    if (!results.some((r) => r.name === f.properties.name && r.detail === detail)) {
      results.push({ name: f.properties.name, detail, lat, lon });
    }
  }

  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, body: results });
  return NextResponse.json({ results }, { headers: { 'X-Cache': 'miss' } });
}
