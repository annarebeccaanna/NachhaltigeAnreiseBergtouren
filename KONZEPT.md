# Technische Konzeption: Nachhaltige Anreise zu Bergtouren

**Arbeitstitel:** ÖV-Erreichbarkeitskarte für Bergtouren im Alpenraum
**Stand:** 2026-07-02 · Entwurf v1.1 (Stack konkretisiert: Vercel + Supabase + GitHub)

---

## 1. Projektidee (Zusammenfassung)

Eine interaktive Karte zeigt, welche Bergtouren von einem frei wählbaren Startpunkt
(Stadt oder Adresse) aus **mit öffentlichem Nahverkehr + Fuß/Rad-Zubringer** erreichbar
sind:

1. Der User wählt einen **Startpunkt** und ein **ÖV-Zeitbudget** (z. B. „max. 2 h Anreise").
2. Zusätzlich wählt er einen **Zubringermodus** (zu Fuß oder Rad) und ein **Zubringer-Budget**
   (z. B. „max. 30 min vom Bahnhof/Haltestelle zum Tourstart").
3. Die Karte färbt alle erreichbaren Gebiete ein (**Isochrone**) und zeigt **Pins** an den
   Startpunkten von Bergtouren, die innerhalb dieser Fläche liegen.
4. Klick auf einen Pin öffnet die Tourdetails.

**Ausbaustufe 2:** Eingabe einer Startzeit → das System prüft anhand von Hinfahrt,
Zubringerzeit und Tourdauer, ob am Tour-**Endpunkt** (≠ Startpunkt bei Streckentouren)
noch eine Rückverbindung existiert.

**Ausbaustufe 3:** Filter (Schwierigkeit, Dauer, Höhenmeter, …).

**Geltungsbereich:** alle Alpenländer (Perimeter der Alpenkonvention): Österreich,
Schweiz, Deutschland (Alpenraum Bayern), Frankreich, Italien, Slowenien, Liechtenstein,
Monaco.

### Prior Art (wichtig!)

Es gibt ein sehr ähnliches Open-Source-Projekt: **[Zuugle](https://www.zuugle.at)**
(Verein „Bahn zum Berg", Quellcode auf GitHub). Zuugle sucht öffentlich erreichbare
Touren für AT/DE/CH/IT/SI/FR, allerdings **listenbasiert** und ohne Isochronen-Karte.
Das hier konzipierte Projekt unterscheidet sich durch den **kartenzentrierten,
explorativen Ansatz** (Fläche statt Liste). Zuugle lohnt sich trotzdem als Referenz
für Datenquellen und ggf. als Kooperationspartner.

---

## 2. Fachliche Analyse

### 2.1 Das Kernproblem: multimodale Erreichbarkeit

Eine „ÖV-Isochrone" über den gesamten Alpenraum ist keine einzelne Fläche, sondern
entsteht in zwei Schritten:

1. **ÖV-Phase:** Vom Startpunkt aus wird berechnet, welche **Haltestellen** innerhalb
   des Zeitbudgets erreichbar sind (One-to-Many-Routing auf Fahrplandaten).
   Ergebnis: Menge von Haltestellen, je mit frühester Ankunftszeit.
2. **Zubringer-Phase:** Um jede erreichte Haltestelle wird eine **Fuß- oder
   Rad-Isochrone** mit dem Zubringer-Budget gelegt (Routing auf dem Wegenetz, nicht
   Luftlinie – im Gebirge entscheidend!).
3. **Vereinigung** aller Teilflächen = eingefärbte Erreichbarkeitsfläche.
4. **Verschneidung** der Fläche mit den Tour-Startpunkten (Punkt-in-Polygon) = Pins.

> **Wichtiger fachlicher Hinweis:** ÖV-Isochronen sind **zeitabhängig**. „2 h ab
> München" sieht Montag 7:00 anders aus als Sonntag 20:00. Schon im MVP braucht es
> daher eine (ggf. voreingestellte) Abfahrtszeit, z. B. „Samstag 7:00". Das ist kein
> Zusatzfeature, sondern eine Voraussetzung für korrekte Ergebnisse – und ein sanfter
> Einstieg in Ausbaustufe 2.

### 2.2 Zwei Interpretationen des Zeitbudgets (Entscheidung nötig)

- **Variante A – getrennte Budgets:** „max. 2 h ÖV **und danach** max. 30 min Rad."
  Einfach zu verstehen, einfach zu berechnen (Isochrone mit fixem Radius-Budget um
  jede erreichte Haltestelle). **→ Empfehlung für MVP.**
- **Variante B – Gesamtbudget:** „max. 2,5 h Tür-zu-Tourstart, egal wie aufgeteilt."
  Präziser, aber teurer zu berechnen (Restzeit pro Haltestelle individuell).

Die Beschreibung („wie weit mit dem Nahverkehr **sowie** wie weit zu Fuß/Rad") klingt
nach Variante A – so wird sie hier konzipiert.

---

## 3. Datenquellen

### 3.1 ÖV-Fahrplandaten (GTFS)

Reale Verbindungsdaten liegen pro Land als GTFS-Feeds vor:

| Land | Quelle | Qualität |
|---|---|---|
| AT | ÖBB + Verbünde via data.oebb.at / mobilitätsverbünde | gut |
| CH | opentransportdata.swiss (landesweiter Feed) | sehr gut |
| DE | DELFI / gtfs.de (landesweiter Feed) | gut |
| FR | transport.data.gouv.fr (viele Einzelfeeds) | gut, fragmentiert |
| IT | regionale Feeds, lückenhaft | **Risiko** |
| SI | nationaler Feed (beta.brezavta / IJPP) | ok |
| LI | in CH-Feed bzw. LIEmobil | ok |

**Zentrale Erkenntnis:** Man muss diese Feeds nicht selbst einsammeln.
**[Transitous](https://transitous.org)** (Community-Projekt, Routing-Engine
**MOTIS**) aggregiert bereits weltweit GTFS-Feeds – inkl. aller Alpenländer – und
bietet eine freie API mit **One-to-Many-** und Routing-Endpunkten.

**Empfehlung (gestuft):**
1. **MVP:** Transitous-API nutzen (kein eigener Datenbetrieb, sofort alle Länder).
   Fair-Use-Limits beachten; für ein öffentliches Produkt Kontakt mit dem Projekt
   aufnehmen.
2. **Produktivbetrieb:** eigene **MOTIS**-Instanz hosten (Open Source, identische
   API), gefüttert mit denselben Feeds. Damit entfällt die Abhängigkeit und man
   kontrolliert Rate-Limits selbst. Alternative: OpenTripPlanner 2 (ebenfalls
   erprobt, aber ein Graph über alle Alpenländer ist RAM-intensiv, ~32–64 GB).

Kommerzielle Alternativen (TravelTime API, HERE) existieren, kosten aber laufend Geld
und bieten für diesen Anwendungsfall keinen fachlichen Vorteil.

### 3.2 Fuß-/Rad-Isochronen um Haltestellen

- **Valhalla** oder **OpenRouteService** (beide Open Source, OSM-basiert) liefern
  Isochronen für Fuß/Rad. ORS hat eine gehostete freie API (limitiert),
  Valhalla ist leicht selbst zu betreiben.
- Wichtig im Gebirge: Fuß-Isochronen sollten Steigung berücksichtigen (Valhalla
  kann Höhendaten einbeziehen), sonst wirken Täler „durchlässig", die es nicht sind.
- **MVP-Vereinfachung:** MOTIS/Transitous kann Fuß/Rad als First/Last-Mile im
  One-to-Many-Routing bereits mitrechnen – dann liefert ein einziger API-Aufruf
  fast das ganze Ergebnis. Das ist der effizienteste Weg und **die empfohlene
  Architektur**: eigene Isochronen-Berechnung nur dort ergänzen, wo die API nicht
  reicht.

### 3.3 Tourdaten – der kritischste Punkt des Projekts

„Plattformen haben GPS-Daten" stimmt, aber die **Nutzungsrechte** sind das Problem:

| Quelle | GPS/GPX | Rechtlich nutzbar? |
|---|---|---|
| Komoot | ja | **nein** – keine öffentliche API, ToS verbieten Scraping |
| Outdooractive | ja | nur über kommerzielle Partner-API (Lizenzkosten) |
| Bergfex, AllTrails | ja | keine offene API |
| **OpenStreetMap** | ja (Relationen `route=hiking`) | **ja**, ODbL |
| **Zuugle / Bahn zum Berg** | kuratierte Touren | Open Source, Kooperation möglich |
| Eigene Redaktion / GPX-Upload | ja | ja |

**Empfehlung:** MVP mit **OSM-Wanderrouten** (Abzug via Overpass/Planet-Extract,
Aufbereitung in PostGIS: Startpunkt, Endpunkt, Länge, Höhenmeter aus DEM,
Rundtour-Erkennung Start≈Ende). Parallel Gespräch mit Outdooractive (haben ein
Förderprogramm für nachhaltige Projekte) und/oder Zuugle. Zusätzlich von Anfang an
ein **Import-Format** definieren, damit später beliebige Quellen (GPX + Metadaten)
eingespielt werden können – das entkoppelt das Produkt von einer einzelnen Plattform.

Aus jeder Tour werden extrahiert und persistiert:

```
tour {
  id, name, quelle, lizenz,
  start_punkt (Point), end_punkt (Point),
  ist_rundtour (bool, Start≈Ende mit Toleranz ~200 m),
  geometrie (LineString, vereinfacht),
  distanz_km, aufstieg_hm, abstieg_hm,
  dauer_min (geschätzt, z. B. DIN 33466 / SAC-Formel),
  schwierigkeit (falls Quelle sie liefert),
  metadata jsonb
}
```

### 3.4 Geocoding (Stadt-/Adresssuche)

**Photon** (Komoot, OSM-basiert, frei) oder Nominatim. Für das Suchfeld links reicht
Photon mit Alpenraum-Bounding-Box.

---

## 4. Systemarchitektur

```
┌────────────────────────────────────────────────────────────┐
│  Frontend: Next.js (React) auf Vercel                      │
│  MapLibre GL JS + Sidebar                                  │
│  – Suchfeld (Photon), Slider ÖV-Budget, Modus Fuß/Rad,     │
│    Slider Zubringer-Budget, (Stufe 2: Startzeit)           │
│  – Layer: Isochronen-Polygon (GeoJSON), Tour-Pins          │
│    (geclustert), Popup mit Tourdetails                     │
└──────────────┬─────────────────────────────────────────────┘
               │ REST/JSON
┌──────────────▼─────────────────────────────────────────────┐
│  Backend: Next.js Route Handlers (Vercel Functions, TS)    │
│  GET /api/isochrone   → Erreichbarkeitsfläche als GeoJSON  │
│  GET /api/tours       → Touren innerhalb Fläche/BBox       │
│  GET /api/tours/{id}  → Tourdetails                        │
│  (Stufe 2) /api/tours/{id}/itinerary → Hin- & Rückreise    │
│  – schwere Geometrie (Union) läuft nicht in der Function,  │
│    sondern als SQL/RPC in Supabase-Postgres (§ 4.4)        │
│  + Caching: Vercel Data Cache / Upstash Redis              │
└───────┬──────────────────────────┬─────────────────────────┘
        │                          │
┌───────▼────────────┐   ┌─────────▼──────────────┐
│ Routing (extern)   │   │ Supabase               │
│ Transitous/MOTIS   │   │ (PostgreSQL + PostGIS) │
│ (One-to-Many, ÖV + │   │ Touren, vorberechnete  │
│ First/Last-Mile);  │   │ Zubringer-Isochronen,  │
│ optional Valhalla  │   │ GIST-Indizes, RPC für  │
└────────────────────┘   │ ST_Union/ST_Intersects │
        ▲                └─────────▲──────────────┘
        │                          │
┌───────┴──────────────────────────┴─────────────────────────┐
│  GitHub: Repo, CI/CD (Vercel-Integration, Preview-Deploys) │
│  GitHub Actions als Batch-Jobs (Cron): OSM-Tourimport,     │
│  Zubringer-Isochronen-Vorberechnung → schreiben in Supabase│
└────────────────────────────────────────────────────────────┘
```

### 4.1 Ablauf einer Anfrage (MVP)

1. Frontend → `GET /isochrone?lat&lon&max_ov_min=120&mode=bike&max_feeder_min=30&depart=sa-07:00`
2. Backend fragt MOTIS One-to-Many: alle Haltestellen, Ankunft ≤ Budget.
3. Um die erreichten Haltestellen: Zubringer-Isochronen (per MOTIS-Street-Routing
   oder Valhalla; Batch, parallelisiert; nur Haltestellen, die nicht bereits im
   Polygon einer „besseren" Nachbarhaltestelle liegen → massive Einsparung).
4. Union + Vereinfachung (`ST_Union`, `ST_SimplifyPreserveTopology`) → GeoJSON.
5. `GET /tours?isochrone_id=…` → PostGIS `ST_Intersects(start_punkt, flaeche)` → Pins.
6. Ergebnis wird gecacht (gleiche Stadt + gleiche Slider = gleiche Fläche).

### 4.2 Performance-Betrachtung (Selbst-Check)

- **Problemgröße:** Der Alpenraum hat >100 000 Haltestellen; ein 4-h-Budget ab
  München erreicht Tausende. Tausende Einzel-Isochronen zu unionieren ist zu teuer
  für Echtzeit.
- **Gegenmaßnahmen (in dieser Reihenfolge):**
  1. Nur Haltestellen betrachten, die als **Tour-Zubringer relevant** sind
     (Haltestellen ohne Tour im Umkreis des maximalen Zubringer-Budgets können
     ausgelassen werden – vorab in PostGIS berechenbar). Das reduziert typisch
     um >80 %.
  2. Zubringer-Isochronen **pro Haltestelle+Modus+Budget vorab berechnen und
     cachen** (sie hängen nicht vom User-Start ab!). Zur Laufzeit bleibt nur:
     erreichte Haltestellen bestimmen + vorgefertigte Polygone unionieren.
  3. Grobe Visualisierung (Karte einfärben) darf vereinfacht sein; die
     **Pin-Auswahl** rechnet exakt (Tour liegt drin/nicht drin über
     Haltestellen-Distanz, nicht über das vereinfachte Polygon).
- Damit ist eine Antwortzeit von wenigen Sekunden realistisch; mit Cache <500 ms.

### 4.3 Genauigkeit vs. Aufwand (Selbst-Check)

Die Färbung der Karte ist ein **Explorations-Werkzeug**, kein Fahrplan. Es ist
sinnvoll, die Fläche bewusst als „ungefähr erreichbar (Abfahrt Sa ~7:00)" zu
kommunizieren und die **exakte Verbindung erst beim Klick auf eine Tour** zu
berechnen (ein einzelner Routing-Call, billig und präzise). Das trennt sauber:
Fläche = schnell & ungefähr, Tourdetail = exakt.

### 4.4 Passung des Stacks Vercel + Supabase + GitHub (Selbst-Check)

**Was gut passt:**

- **Supabase = gemanagtes PostgreSQL mit PostGIS-Extension.** Das ist exakt die in
  diesem Konzept vorgesehene Geodatenbank – inklusive `ST_Union`,
  `ST_Intersects`, GIST-Indizes. Die rechenintensive Flächen-Vereinigung (§ 4.2)
  wird als Postgres-Funktion (Supabase RPC) implementiert; die Vercel Function
  orchestriert nur noch (Routing-API aufrufen, RPC aufrufen, GeoJSON
  durchreichen) und bleibt damit weit unter den Serverless-Zeitlimits.
- **Vercel** deckt Frontend + API in einem Repo/Deploy ab; Preview-Deploys pro
  Pull Request beschleunigen die Iteration spürbar.
- **GitHub Actions ersetzt den Batch-Server:** OSM-Tourimport und die
  Isochronen-Vorberechnung (§ 4.2) sind periodische, lang laufende Jobs – als
  Scheduled Workflows laufen sie kostenlos und schreiben direkt nach Supabase.
  Damit braucht das MVP **keinen einzigen selbst betriebenen Server**.

**Worauf zu achten ist:**

- **Serverless-Zeitlimits:** Nichts Langlaufendes in den Request-Pfad legen.
  Alles > ein paar Sekunden gehört in GitHub Actions (Batch) oder in die
  Datenbank (RPC). Das erzwingt die ohnehin geplante Vorberechnung – der
  Constraint wirkt hier als gesunde Architektur-Leitplanke.
- **Supabase Free Tier (500 MB):** Touren (vereinfachte Geometrien) passen
  locker; die vorberechneten Zubringer-Isochronen für viele Tausend Haltestellen
  können das Limit sprengen. Gegenmittel: nur tour-relevante Haltestellen
  (§ 4.2, Punkt 1), Geometrien vereinfachen, ggf. Supabase Pro (~25 US$/Monat).
- **Grenze des Stacks:** Eine spätere **eigene MOTIS-/Valhalla-Instanz** (§ 3.1,
  Stufe „Produktivbetrieb") ist ein dauerhaft laufender, RAM-hungriger Prozess –
  das kann weder Vercel noch Supabase. Dafür braucht es dann einen
  Container-Host (z. B. Hetzner/Fly.io). Fürs MVP irrelevant, da Transitous als
  externe API genutzt wird; es bleibt als einziger späterer Infrastruktur-Baustein
  außerhalb des Stacks.
- **Sprachwechsel Backend:** Mit Vercel wird TypeScript durchgängig
  (statt Python/FastAPI). Fachlich unkritisch, weil die Geo-Schwerarbeit in
  PostGIS stattfindet und nicht in Application-Code; Turf.js reicht für leichte
  Client-/Server-Geometrie.

---

## 5. Ausbaustufe 2: Rückreise-Check

**Eingaben:** Startzeit der Anreise (oder gewünschte Rückkehr-Deadline).

**Ablauf pro Tour (on-demand beim Klick, nicht für alle Pins gleichzeitig):**

1. Hinreise: Routing Start → Tour-Startpunkt ab Startzeit → Ankunft `t_an`.
2. Tourende: `t_ende = t_an + zubringer_hin + tour_dauer + puffer` (Puffer
   konfigurierbar, z. B. 15 %; Tourdauer aus Daten oder DIN-33466-Schätzung).
3. Rückreise-Ausgangspunkt:
   - **Rundtour:** = Tour-Startpunkt.
   - **Streckentour:** = Tour-**Endpunkt** (separates Feld im Datenmodell, s. o.).
4. Routing Tour-Endpunkt → User-Start ab `t_ende` → existiert eine Verbindung, die
   am selben Tag (bzw. vor einer Deadline) ankommt? Zusätzlich anzeigen:
   **letzte mögliche Rückverbindung** („Letzte Rückfahrt: 19:42 ab Haltestelle X").
5. UI: Ampel am Pin/Popup (grün = Rückreise gesichert, gelb = knapp, rot = keine
   Rückverbindung) – optional als Filter „nur machbare Touren" auf die ganze
   Pin-Menge anwendbar (dann als Batch-Berechnung mit Cache über Nacht für
   Standard-Startzeiten).

Alle nötigen Primitive (zeitgebundenes Routing A→B) liefert dieselbe
MOTIS/Transitous-API – Stufe 2 braucht **keine neue Infrastruktur**, nur das
Datenmodell (Endpunkt, Rundtour-Flag, Tourdauer), das deshalb von Anfang an so
angelegt wird.

## 6. Ausbaustufe 3: Filter

Reine Frontend-/Query-Erweiterung auf vorhandenen Feldern: Schwierigkeit, Dauer,
Distanz, Höhenmeter, Rundtour ja/nein, „Rückreise gesichert". Keine
Architekturänderung nötig – Voraussetzung ist nur, dass die Felder beim Tour-Import
befüllt werden (deshalb stehen sie schon im MVP-Datenmodell).

---

## 7. Technologie-Stack (Empfehlung)

| Baustein | Wahl | Begründung |
|---|---|---|
| Karte | MapLibre GL JS | Open Source, Vektor-Tiles, performant |
| Basemap | OpenFreeMap oder Versatiles; Gelände: MapTiler Terrain (frei limitiert) | kostenfrei startbar |
| Frontend | **Next.js (React)** auf Vercel | nahtloses Vercel-Deployment, Preview-Deploys pro PR |
| Backend | Next.js Route Handlers (TypeScript, Vercel Functions) | ein Repo, ein Deploy; Geo-Schwerarbeit liegt in PostGIS (§ 4.4) |
| DB | **Supabase** (PostgreSQL + PostGIS-Extension) | gemanagtes Postgres mit vollem PostGIS; RPC für ST_Union; Auth/RLS später gratis dabei |
| Cache | Vercel Data Cache + Upstash Redis (Vercel-Marketplace) | serverless-kompatibel, kein eigener Redis-Betrieb |
| Batch/Import | **GitHub Actions** (Scheduled Workflows) | OSM-Import & Isochronen-Vorberechnung ohne eigenen Server |
| ÖV-Routing | Transitous-API → später eigene MOTIS-Instanz | s. § 3.1; MOTIS braucht dann separaten Container-Host (§ 4.4) |
| Fuß/Rad | MOTIS Street-Routing, ggf. Valhalla | s. § 3.2 |
| Geocoding | Photon | frei, OSM |
| Deployment | Vercel + Supabase (Free Tier fürs MVP), CI/CD via GitHub | Null-Ops-Start; einzige spätere Ausnahme: Routing-Host |

## 8. MVP-Roadmap

1. **M1 – Durchstich (1 Stadt):** Hardcodierter Start (z. B. München), Transitous
   One-to-Many, simple Kreis-Buffer statt echter Zubringer-Isochronen, 50 manuell
   importierte OSM-Touren, Karte mit Fläche + Pins.
2. **M2 – echtes MVP:** Geocoding-Suche, Slider (ÖV-Budget, Fuß/Rad, Zubringer-
   Budget), echte Zubringer-Isochronen mit Vorberechnung/Caching, OSM-Tourimport
   für den ganzen Alpenraum, Tour-Popup, Abfahrtszeit-Voreinstellung.
3. **M3 – Ausbaustufe 2:** Startzeit-Eingabe, Rückreise-Check on-demand pro Tour,
   Ampel-Anzeige, „letzte Rückfahrt".
4. **M4 – Ausbaustufe 3 + Betrieb:** Filter, eigene MOTIS-Instanz (separater
   Container-Host, § 4.4), Monitoring, ggf. Partner-Tourdaten.

## 9. Risiken

| Risiko | Schwere | Gegenmaßnahme |
|---|---|---|
| Tourdaten-Lizenzen (Komoot & Co. nicht nutzbar) | hoch | OSM als Basis, Import-Schnittstelle, Partnerschaften |
| GTFS-Lücken in Italien | mittel | transparent anzeigen („Datenlage lückenhaft"), Fokusregionen zuerst |
| Transitous-Rate-Limits | mittel | Cache aggressiv, früh eigene MOTIS-Instanz planen |
| Performance der Flächenberechnung | mittel | Vorberechnung der Zubringer-Isochronen (§ 4.2) |
| Tourdauer-Schätzung ungenau (Stufe 2) | niedrig | Puffer + konservative Formel, als Schätzung kennzeichnen |

## 10. Offene Fragen (bitte entscheiden)

1. **Tourdaten:** Start mit OSM-Wanderrouten (frei, sofort) – ok? Oder gibt es
   bereits einen Kontakt/eine Lizenz zu einer Plattform (Outdooractive o. ä.)?
2. **Budget-Semantik:** getrennte Budgets für ÖV und Zubringer (Variante A,
   empfohlen) oder ein Gesamtbudget (Variante B)?
3. ~~**Betrieb:** Hosting-Budget?~~ **✅ Entschieden (2026-07-02):** Vercel +
   Supabase + GitHub (Free Tier fürs MVP, § 4.4). Kosten entstehen erst später:
   ggf. Supabase Pro (~25 US$/Monat) und – erst beim Wechsel weg von der
   Transitous-API – ein eigener Routing-Host (~50–100 €/Monat).
4. **Sprachen:** Nur Deutsch, oder mehrsprachig (bei „alle Alpenländer" liegt
   DE/EN/FR/IT/SL nahe)? Beeinflusst v. a. das Frontend, früh entscheidbar, spät
   teuer nachzurüsten.
5. ~~**Frontend-Framework:** Svelte oder React?~~ **✅ Entschieden (2026-07-02):**
   Next.js/React – folgt aus der Vercel-Präferenz.
