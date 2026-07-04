# TODO: Zugänge & offene Punkte

Diese Liste sammelt alles, was **du selbst anlegen oder entscheiden musst** –
mit der jeweils nötigen Lizenzstufe und den Kosten (Stand: Juli 2026).
Die technische Umsetzung übernimmt jeweils die Entwicklung, sobald der Zugang da ist.

## Jetzt (für Meilenstein 1)

### 1. ~~Netzwerk-Freigaben in der Claude-Code-Umgebung~~ ✅ erledigt (2026-07-03)
`api.transitous.org`, `overpass-api.de` und `tiles.openfreemap.org` sind
freigegeben; der Live-Modus gegen die echte Transitous-API ist verifiziert.

### 2. ~~Vercel-Konto (Hobby, 0 €)~~ ✅ erledigt (2026-07-03)
Konto verbunden, Repo importiert. Verbleibende Hinweise:
- **Production Branch** in Vercel → Settings → Git muss `main` sein.
- Hobby-Limits: 100 GB Transfer, 1 Mio. Function-Aufrufe/Monat, 60 s
  Funktionsdauer ([Limits](https://vercel.com/docs/plans/hobby)); nur
  **nicht-kommerzielle** Nutzung – bei Kommerzialisierung Pro
  (20 US$/Monat, [Preise](https://vercel.com/pricing)).
- Keine Env-Variablen nötig (`TRANSITOUS_MODE=mock` nur für Umgebungen
  ohne Netzzugang).

### 3. GitHub-Repo-Härtung (§ 11.5) · teilweise offen
- [x] Repo auf **public** gestellt (2026-07-03) → alle Schutzfunktionen
      kostenlos
- [x] `main`-Branch angelegt, PR-Workflow etabliert (2026-07-03)
- [ ] Default-Branch auf `main` umstellen (Settings → General)
- [ ] Branch Protection für `main`: „Require a pull request before merging"
      (Settings → Branches)
- [ ] Secret Scanning + Push Protection aktivieren (Settings → Code security)
- [ ] Dependabot aktivieren

### 3a. ~~Open-Source-Lizenz wählen~~ ✅ erledigt (2026-07-03)
Entscheidung: **AGPL-3.0** – verhindert geschlossene kommerzielle Ableger
des Webdienstes. `LICENSE`-Datei liegt im Repo, `package.json` deklariert
`AGPL-3.0-only`.

## Für Meilenstein 2 (Datenbank, Importer, echtes Rate Limiting)

### 4. Supabase-Projekt · Stufe: **Free (0 €) – reicht bis mindestens M3**
- [x] Projekt angelegt (2026-07-03): `https://bhuhbqcphmnwixiztags.supabase.co`
- [x] **Zwei Secret Keys** erstellt (`vercel`, `github-actions`) – neues
      Schlüsselsystem `sb_secret_…`, pro Verbraucher ein eigener Key
      (2026-07-03)
- [x] **GitHub:** Actions-Secrets `SUPABASE_URL` + `SUPABASE_SECRET_KEY`
      hinterlegt (2026-07-03)
- [x] **Vercel:** Env-Variablen `SUPABASE_URL` + `SUPABASE_SECRET_KEY`
      hinterlegt, Production + Preview (2026-07-03)
- [x] **Schema-Migration ausgeführt** und erster Import gelaufen
      (2026-07-04): 331 OSM-Touren (Bayerische Alpen + Tirol) in der
      Datenbank; wöchentlicher Cron aktiv. → Punkt 4 komplett erledigt.

Hinweise:
- **Speicherbedarf-Schätzung (2026-07-03):** Touren-Metadaten ~50 MB +
  vereinfachte Geometrien ~100–150 MB + Indizes = **~150–250 MB von
  500 MB** im Vollausbau aller Alpenländer; M2 startet deutlich kleiner.
  Fahrpläne bleiben bei Transitous, Flächen im Redis-Cache → Free genügt.
- Free-Limits: 500 MB Datenbank, max. 2 aktive Projekte, 5 GB Egress,
  **keine Backups** – unkritisch, da die DB ein reiner Ableitungs-Cache
  ist (Quelle der Wahrheit: OSM + Importer, jederzeit neu aufbaubar).
- **Achtung:** Free-Projekte **pausieren nach 7 Tagen ohne Zugriff** – der
  wöchentliche Import-Cron in GitHub Actions verhindert das nebenbei.
- Upgrade-Pfad: **Pro 25 US$/Monat** (8 GB, Backups, kein Auto-Pause) –
  erst relevant, falls vorberechnete Zubringer-Isochronen gespeichert
  werden (Optimierung ab M4, KONZEPT § 4.4).

### 5. Upstash Redis · Stufe: **Free (0 €)**
Am einfachsten über die Vercel-Marketplace-Integration anlegen (verbindet
Env-Variablen automatisch).
- Free-Limits: 500 000 Kommandos/Monat, 256 MB, 10 GB Bandbreite
  ([Preise](https://upstash.com/pricing/redis)) – für Rate Limiting + Cache
  im MVP mehr als genug.
- Danach Pay-as-you-go: 0,20 US$ pro 100 000 Kommandos.

### 6. Outdooractive-API-Projekt · Stufe: **Test-Keys (0 €), Produktion nur per Vertrag**
- Entwicklung: offene Test-Keys aus der Doku
  ([developers.outdooractive.com](https://developers.outdooractive.com/)) –
  nur für temporäre Testzwecke, kein Livegang, kein dauerhaftes Spiegeln.
- Produktion: Partnervertrag über den Vertrieb
  ([corporate.outdooractive.com](https://corporate.outdooractive.com/de/outdooractive-api/)),
  Preis individuell. Guter Zeitpunkt für die Anfrage: sobald der Prototyp mit
  Test-Daten läuft (Demo beilegen, Nachhaltigkeits-Argument nutzen).

## Später (Meilenstein 3/4 und Livegang)

### 7. Transitous-Kontakt · kostenlos
Vor dem öffentlichen Launch beim Community-Projekt
([transitous.org](https://transitous.org)) melden und die erwartete Last
abstimmen (Fair Use). Kein Account nötig.

### 8. Eigener Routing-Host · ~50–100 €/Monat, erst bei Bedarf
Nur falls Transitous-Limits nicht mehr reichen: Container-Host
(z. B. Hetzner Cloud oder Fly.io) für eine eigene MOTIS-Instanz
(RAM-hungrig; Dimensionierung bei Bedarf). **Keine MVP-Voraussetzung.**

### 9. Optional: MapTiler-Konto (Gelände-Darstellung) · Free-Tier mit Key
Nur falls 3D-Relief gewünscht: Free-Konto, **Key im Dashboard auf die eigene
Domain beschränken** (Client-Keys sind konzeptbedingt öffentlich, § 11.2).

### 10. Rechtliches · kostenlos, aber Pflicht
Impressum und Datenschutzerklärung als statische Seiten (§ 11.7); Inhalte
(Verantwortlicher, Kontakt) musst du liefern.

### 11. Domain · ~10–20 €/Jahr, optional
Eigene Domain (z. B. bei INWX, Namecheap) und in Vercel verbinden;
`*.vercel.app`-Subdomain funktioniert auch ohne.

---

## Erledigt / in Arbeit (Entwicklungsseite)

- [x] Technische Konzeption inkl. Sicherheitskonzept (`KONZEPT.md`)
- [x] M1-Durchstich: Karte, Sidebar, Erreichbarkeits-API, i18n DE/EN
- [x] Live-Verifikation Transitous `one-to-all` (Format korrigiert:
      Ortsdaten unter `place`, `duration` in Minuten; Haltestellen-
      Ausdünnung für 16k+-Antworten ergänzt)
- [x] M2: Supabase-Schema (Migration), Backend-Anbindung mit Fixture-
      Fallback, OSM-Importer + wöchentliche GitHub Action (2026-07-03);
      PR #1 gemergt, erster Import erfolgreich: 331 Touren (2026-07-04)
- [ ] M2: Upstash-Rate-Limit statt In-Memory-Platzhalter (blockiert durch 5)
- [ ] M2: FR/IT/SL-Übersetzungen, Geocoding-Suche, echte Zubringer-Isochronen
- [ ] M2: Import-Gebiet schrittweise auf alle Alpenländer erweitern
      (Start: Bayerische Alpen + Tirol)
