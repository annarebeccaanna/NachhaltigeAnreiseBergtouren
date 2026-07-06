/**
 * Rate Limiting pro IP (Sicherheitskonzept § 11.3).
 *
 * Nutzt Upstash Redis (REST), sobald die Env-Variablen der
 * Vercel-Marketplace-Integration gesetzt sind – damit gilt das Limit
 * instanzübergreifend. Ohne Upstash (lokale Entwicklung, Konto noch nicht
 * angelegt) greift ein In-Memory-Fallback pro Instanz.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const WINDOW_SECONDS = 60;

const memoryBuckets = new Map<string, { windowStart: number; count: number }>();

/** true = Limit überschritten, Anfrage ablehnen (HTTP 429). */
export async function rateLimited(
  scope: string,
  ip: string,
  maxPerMinute: number
): Promise<boolean> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      return await upstashLimited(scope, ip, maxPerMinute);
    } catch (err) {
      // Upstash-Störung darf den Dienst nicht lahmlegen → Fallback
      console.error('Upstash-Rate-Limit fehlgeschlagen, nutze In-Memory:', err);
    }
  }
  return memoryLimited(scope, ip, maxPerMinute);
}

/** Fixed Window über Redis INCR/EXPIRE – simpel, instanzübergreifend. */
async function upstashLimited(scope: string, ip: string, max: number): Promise<boolean> {
  const window = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const key = `rl:${scope}:${ip}:${window}`;
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(WINDOW_SECONDS + 30), 'NX'],
    ]),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Upstash antwortete ${res.status}`);
  const [incr] = (await res.json()) as [{ result: number }, unknown];
  return incr.result > max;
}

function memoryLimited(scope: string, ip: string, max: number): boolean {
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_SECONDS * 1000) {
    if (memoryBuckets.size > 5000) memoryBuckets.clear();
    memoryBuckets.set(key, { windowStart: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}
