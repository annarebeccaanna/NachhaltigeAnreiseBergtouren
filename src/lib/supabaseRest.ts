/**
 * Minimaler Supabase-REST-Client (PostgREST) für serverseitige Zugriffe.
 * Nutzt das neue Schlüsselsystem: sb_secret-Keys werden im `apikey`-Header
 * gesendet (nicht als Bearer-Token) und umgehen RLS.
 * Bewusst ohne supabase-js: zwei Endpunkte brauchen keinen SDK.
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

export function supabaseConfigured(): boolean {
  return Boolean(url && key);
}

export async function supabaseRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key! },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Supabase RPC ${fn} antwortete ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/** Lesende Abfrage über PostgREST (Pfad inkl. Query-String, ohne /rest/v1/). */
export async function supabaseSelect<T>(pathWithQuery: string): Promise<T> {
  const res = await fetch(`${url}/rest/v1/${pathWithQuery}`, {
    headers: { apikey: key! },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`Supabase select antwortete ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Anzahl Zeilen einer Tabelle (HEAD mit count=exact, ohne Datentransfer). */
export async function supabaseCount(table: string): Promise<number> {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    method: 'HEAD',
    headers: { apikey: key!, Prefer: 'count=exact' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Supabase count ${table} antwortete ${res.status}`);
  }
  const range = res.headers.get('content-range'); // z. B. "0-0/1234"
  return Number(range?.split('/')[1] ?? 0);
}
