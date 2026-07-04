# Nachhaltige Anreise zu Bergtouren

Interaktive Karte, die zeigt, welche Bergtouren im Alpenraum von einem
Startpunkt aus **mit Bahn & Bus plus Fuß-/Rad-Zubringer** erreichbar sind.
Erreichbare Gebiete werden als Fläche eingefärbt, Tourstartpunkte als Pins
angezeigt; Klick auf einen Pin öffnet die Tourdetails.

- 📋 **Konzeption:** [KONZEPT.md](./KONZEPT.md) (Architektur, Datenquellen,
  Sicherheitskonzept, Roadmap)
- ✅ **Offene Zugänge/Aufgaben:** [TODO.md](./TODO.md)
- 🏔️ **Stand:** Meilenstein 1 (Durchstich) – fester Startpunkt München,
  Beispieltouren, Mock-Fahrplandaten in Umgebungen ohne Netzzugang

## Entwicklung

```bash
npm install
npm run dev            # http://localhost:3000 – nutzt die Transitous-API (live)
TRANSITOUS_MODE=mock npm run dev   # ohne Netzzugang: Beispiel-Fahrplandaten
```

**Hinweis Claude-Code-Cloud-Sandbox:** Ausgehender Verkehr läuft dort über
einen Proxy, den Nodes `fetch` nur mit Opt-in nutzt – Server dann mit
`NODE_USE_ENV_PROXY=1 npm run dev` starten (auf Vercel/lokal nicht nötig).

| Env-Variable | Werte | Zweck |
|---|---|---|
| `TRANSITOUS_MODE` | `live` (Default) / `mock` | Fahrplandaten: echte Transitous-API oder Fixture München |
| `TRANSITOUS_BASE_URL` | URL | abweichende MOTIS-Instanz (Default `https://api.transitous.org`) |
| `SUPABASE_URL` | URL | Supabase-Projekt; ohne diese Variable nutzt die App die eingebauten Beispieltouren |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | serverseitiger Zugriff (RLS-Bypass); niemals mit `NEXT_PUBLIC_`-Präfix! |

## Datenbank & Tour-Import (M2)

- **Schema:** `supabase/migrations/0001_touren.sql` einmalig im Supabase-
  SQL-Editor ausführen (legt PostGIS, Tabellen, RLS deny-all und die
  RPC-Funktion an).
- **Import:** GitHub Action „Tour-Import (OSM)" läuft wöchentlich
  (montags) und lädt OSM-Wanderrouten (ODbL) via Overpass nach Supabase;
  manuell über den Actions-Tab startbar (auch als Dry-Run). Lokal:
  `node scripts/import-osm-tours.mjs --dry-run`
- **Fallback:** Ist keine Datenbank konfiguriert oder noch leer, zeigt die
  App automatisch die kuratierten Beispieltouren und weist darauf hin.

**Regel aus dem Sicherheitskonzept (§ 11.2):** Kein Geheimnis bekommt jemals
das Präfix `NEXT_PUBLIC_` – solche Variablen landen im Browser-Bundle.

## Architektur (M1)

```
Browser ── MapLibre-Karte + Sidebar (Next.js, next-intl DE/EN)
   │
   └─ GET /api/reachability  (zod-Validierung, Rate-Limit, Cache)
          │
          ├─ Transitous/MOTIS one-to-all → erreichbare Haltestellen
          ├─ Kreis-Buffer + Union → Isochronen-Fläche (M1-Näherung)
          └─ Tourfilter über Haltestellen-Distanz → Pins
```

Beispieltouren: `src/data/tours.json` (21 manuell kuratierte Touren,
wird in M2 durch den OSM-Importer ersetzt).

## Lizenz

[AGPL-3.0](./LICENSE) – Nachnutzung und Weiterentwicklung ausdrücklich
erwünscht; wer den Dienst (auch verändert) betreibt, muss den Quellcode
offenlegen.

## Screenshot-Hilfsskript

```bash
npm start &
node scripts/screenshot.mjs http://localhost:3000/ app.png
```
