# TODO: Zugänge & offene Punkte

Diese Liste sammelt alles, was **du selbst anlegen oder entscheiden musst** –
mit der jeweils nötigen Lizenzstufe und den Kosten (Stand: Juli 2026).
Die technische Umsetzung übernimmt jeweils die Entwicklung, sobald der Zugang da ist.

## Jetzt (für Meilenstein 1)

### 1. Netzwerk-Freigaben in der Claude-Code-Umgebung · kostenlos
In den Einstellungen der Claude-Code-Cloud-Umgebung (Netzwerk-Policy) freigeben:
- `api.transitous.org` – echte Fahrplandaten statt Mock-Modus
- `overpass-api.de` – OSM-Tourimport (ab M2)
- `tiles.openfreemap.org` – Basemap-Kacheln für Browser-Tests in der Sandbox

Ohne Freigabe läuft die App im gekennzeichneten Demo-Modus weiter.

### 2. Vercel-Konto · Stufe: **Hobby (0 €)**
[vercel.com](https://vercel.com) → Sign-up mit GitHub → Repository importieren.
- Hobby reicht fürs MVP: 100 GB Transfer, 1 Mio. Function-Aufrufe/Monat,
  max. 60 s Funktionsdauer ([Limits](https://vercel.com/docs/plans/hobby)).
- **Achtung:** Hobby ist nur für **nicht-kommerzielle** Nutzung erlaubt
  ([Fair Use](https://vercel.com/docs/limits/fair-use-guidelines)). Sobald das
  Projekt Geld verdienen soll: **Pro, 20 US$/Monat/Person**
  ([Preise](https://vercel.com/pricing)).
- Keine Env-Variable nötig; `TRANSITOUS_MODE` nur in Umgebungen ohne
  Netzzugang auf `mock` setzen.

### 3. GitHub-Repo-Härtung (§ 11.5) · kostenlos bei öffentlichem Repo
Settings → Code security: **Secret Scanning + Push Protection** aktivieren;
Branches → **Branch Protection** für `main`; Dependabot aktivieren.
- Bei **öffentlichem** Repo: alles kostenlos.
- Bei **privatem** Repo: Branch-Protection-Rules erst ab **GitHub Pro
  (4 US$/Monat)**; erweitertes Secret Scanning erst mit Advanced Security
  (Team/Enterprise). → Empfehlung: Repo auf public stellen (Open Source passt
  zum Projektcharakter) oder GitHub Pro.

## Für Meilenstein 2 (Datenbank, Importer, echtes Rate Limiting)

### 4. Supabase-Projekt · Stufe: **Free (0 €)**
[supabase.com](https://supabase.com/pricing) → Projekt anlegen (Region EU,
z. B. Frankfurt) → im SQL-Editor die Extension `postgis` aktivieren
(auf allen Plänen verfügbar).
- Free-Limits: 500 MB Datenbank, max. 2 aktive Projekte, 5 GB Egress,
  **keine Backups**.
- **Achtung:** Free-Projekte **pausieren nach 7 Tagen ohne Zugriff** – der
  wöchentliche Import-Cron in GitHub Actions verhindert das nebenbei.
- Upgrade-Pfad: **Pro 25 US$/Monat** (8 GB, Backups, kein Auto-Pause) –
  voraussichtlich erst nötig, wenn die vorberechneten Zubringer-Isochronen
  die 500 MB sprengen (KONZEPT § 4.4).

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
- [ ] Live-Verifikation Transitous `one-to-all` (blockiert durch Punkt 1;
      Response-Format beim ersten Live-Test gegenprüfen)
- [ ] M2: Supabase-Schema + OSM-Importer (blockiert durch Punkte 1 & 4)
- [ ] M2: Upstash-Rate-Limit statt In-Memory-Platzhalter (blockiert durch 5)
- [ ] M2: FR/IT/SL-Übersetzungen, Geocoding-Suche, echte Zubringer-Isochronen
