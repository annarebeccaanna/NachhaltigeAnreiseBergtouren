# Die Erreichbarkeitskarte: „Welche Bergtour erreiche ich mit Bahn & Bus?"

**Ein Vorschlag für alpenvereinaktiv / die Alpenvereine DAV · ÖAV · AVS**
Stand: Juli 2026 · Es existiert ein funktionierender Prototyp (Live-Demo unten)

---

## Die Idee in einem Satz

Eine interaktive Karte, die die Suchrichtung umdreht: Nicht mehr *„Hier ist
eine Tour – wie komme ich da hin?"*, sondern **„Hier wohne ich – welche
Touren erreiche ich von zu Hause mit Bahn, Bus und Rad?"**

## Das Problem, das wir lösen

Wer öffentlich zum Berg will, plant heute rückwärts – und scheitert oft
daran:

1. Man findet eine schöne Tour (auf alpenvereinaktiv, im Führer, per
   Empfehlung).
2. Man prüft die Anreise: Umsteigeverbindungen, letzter Bus ins Tal,
   Wochenendtakt … häufig das Aus.
3. Zurück zu Schritt 1 – oder eben doch das Auto.

Diese Schleife durchläuft jede und jeder ÖV-Anreisende für **jede einzelne
Tour aufs Neue**. Das Ergebnis ist bekannt: Die An- und Abreise ist der mit
Abstand größte Hebel der Klimabilanz des Bergsports – die Alpenvereine
selbst rufen seit Jahren zur öffentlichen Anreise auf und kuratieren
Öffi-Touren. Was fehlt, ist das **Werkzeug, das die Suche vom Wohnort aus
denkt**: erst die Erreichbarkeit, dann die Tour – nicht umgekehrt.

## Die Lösung: eine Erreichbarkeitskarte

Die Nutzerin gibt drei Dinge an:

- **Startpunkt** (Wohnort, beliebige Adresse im Alpenraum),
- **maximale ÖV-Anreisezeit** (z. B. 2 Stunden ab Samstag 7:00),
- **Zubringer zum Ausgangspunkt**: zu Fuß oder mit dem Rad, plus Zeitbudget
  (z. B. 30 Minuten).

Die Karte färbt daraufhin **alle Gebiete ein, die tatsächlich erreichbar
sind** – berechnet auf echten Fahrplandaten, nicht auf Luftlinie – und
setzt Pins auf jeden Tourenstartpunkt innerhalb dieser Fläche. Ein Klick
auf den Pin zeigt die Tour: Gehzeit, Höhenmeter, Schwierigkeit, nächste
Haltestelle samt Fußweg-Distanz und ÖV-Anreisezeit.

Der Aha-Moment ist die Karte selbst: Das Erreichbarkeitsnetz folgt sichtbar
den Bahnkorridoren ins Gebirge. Man *sieht* zum ersten Mal, wie viel Berg
ohne Auto möglich ist – und entdeckt dabei Täler und Touren, die man nie
gesucht hätte. Aus der frustrierenden Rückwärts-Prüfung wird **exploratives
Stöbern mit Erfolgsgarantie**: Jeder angezeigte Pin ist erreichbar.

## Warum das für alpenvereinaktiv eine starke Funktion ist

**1. Es operationalisiert die Klimastrategie der Vereine.** „Reist
öffentlich an" ist ein Appell. Eine Karte, die für jeden Wohnort konkret
zeigt, *was* öffentlich geht, macht aus dem Appell ein Produkt. Der Effekt
ist unmittelbar messbar (Anteil gefilterter Öffi-Touren-Aufrufe,
Klicks auf Verbindungen).

**2. Es macht den vorhandenen Tourenschatz mehr wert.** alpenvereinaktiv
hat, was keine freie Datenquelle bietet: redaktionell geprüfte Touren mit
verlässlichen Gehzeiten, Schwierigkeitsbewertungen, aktuellen Bedingungen
und der Autorität der Vereine dahinter. Genau diese Qualität braucht eine
Erreichbarkeitskarte, damit aus „Pin auf der Karte" eine vertrauenswürdige
Empfehlung wird. Umgekehrt bekommt jede Bestandstour einen neuen
Auffindbarkeits-Kanal: Sie erscheint automatisch bei allen Menschen, für
die sie öffentlich erreichbar ist.

**3. Es ist ein Alleinstellungsmerkmal.** Kommerzielle Plattformen (Komoot,
AllTrails & Co.) haben nichts Vergleichbares; das Community-Projekt Zuugle
zeigt die Nachfrage, ist aber listenbasiert statt kartenbasiert-explorativ.
Die Kombination „geprüfte Vereins-Touren × echte Fahrplan-Erreichbarkeit ×
Karte" gäbe es nur bei den Alpenvereinen – ein Innovationssignal genau auf
der Linie des Vereinsauftrags.

**4. Die Ausbaustufe löst das größte Angst-Thema der Öffi-Anreise: die
Rückfahrt.** Geplant (Datenmodell bereits vorhanden): Nutzer geben eine
Startzeit an, das System rechnet Anreise + Zubringer + Gehzeit und prüft,
ob am **Endpunkt** der Tour – bei Überschreitungen ist das nicht der
Startpunkt! – noch eine Rückverbindung existiert. Als Ampel am Pin, mit
Anzeige der letzten Rückfahrt („Letzte Verbindung: 19:42 ab Lenggries").
Das nimmt der öffentlichen Anreise ihr Restrisiko-Image und ist unseres
Wissens **nirgends** als Kartenfunktion verfügbar.

**5. Danach: Filter und Feinschliff.** Schwierigkeit, Gehzeit, Höhenmeter,
Rundtour/Überschreitung, „Rückreise gesichert" – alles Felder, die
alpenvereinaktiv-Touren bereits mitbringen.

## Es gibt bereits einen funktionierenden Prototyp

Kein Konzeptpapier ins Blaue – die Kernmechanik läuft produktiv:

- **Live-Demo:** https://nachhaltige-anreise-bergtouren.vercel.app
- **Echte Fahrplandaten** für alle Alpenländer über die offene
  Routing-Infrastruktur Transitous/MOTIS (One-to-many-Berechnung: tausende
  erreichte Haltestellen in 2–3 Sekunden, gecacht unter 100 ms)
- **Freie Startpunktwahl** im gesamten Alpenraum, Fuß-/Rad-Zubringer
  einstellbar, mehrsprachig angelegt (DE/EN, FR/IT/SL vorbereitet)
- Aktuell mit **OSM-Wanderrouten** als Demonstrationsdaten (~330 Touren
  Bayerische Alpen/Tirol, wöchentlich automatisch aktualisiert) – die
  Architektur ist von Anfang an **quellenneutral** gebaut: Touren docken
  über eine Import-Schnittstelle an, die Anwendung selbst ist
  datenquellen-agnostisch
- **Open Source (AGPL-3.0):**
  https://github.com/annarebeccaanna/NachhaltigeAnreiseBergtouren –
  inklusive vollständiger technischer Konzeption (KONZEPT.md) mit
  Sicherheits- und Datenschutzkonzept (keine Konten, kein Tracking,
  Nutzer-IPs bleiben beim eigenen Server)

Der Prototyp beweist die kritischen Punkte: Die Fahrplandaten-Frage ist
gelöst, die Performance reicht, die UX funktioniert. **Was dem Projekt
fehlt, sind erstklassige Tourdaten. Was alpenvereinaktiv gewinnen kann,
ist die Erreichbarkeits-Funktion. Das ist die Passung.**

## Wie eine Zusammenarbeit aussehen könnte (drei Stufen, aufsteigend)

1. **Pilot mit Tourdaten:** alpenvereinaktiv stellt für eine Pilotregion
   (z. B. Münchner Hausberge oder Innsbruck) Touren über die
   Outdooractive-API bereit; wir binden sie in die bestehende Karte ein
   und werten gemeinsam aus, wie sich Nutzung und Öffi-Klicks entwickeln.
   Aufwand auf Vereinsseite: minimal (API-Zugang + Rückmeldung).
2. **Gemeinsames Feature/Microsite:** Die Erreichbarkeitskarte als
   eigenständige, gebrandete Anwendung („Mit Bahn & Bus zum Berg") mit
   alpenvereinaktiv-Touren – betrieben als Open-Source-Projekt, auf Wunsch
   unter Vereins-Domain.
3. **Integration in alpenvereinaktiv:** Erreichbarkeit als Suchmodus bzw.
   Kartenlayer in der Plattform selbst. Die Rechenlogik (Fahrplan-Routing,
   Flächenberechnung, Rückreise-Check) ist als eigenständiger Dienst
   gekapselt und kann hinter jede Oberfläche gesetzt werden.

Das Projekt ist nicht-kommerziell und offen lizenziert – es gibt keine
Verwertungsinteressen, die einer Zusammenarbeit im Weg stünden. Die AGPL
stellt zugleich sicher, dass Weiterentwicklungen der Allgemeinheit erhalten
bleiben.

## Die Zielvision

Eine Bergsteigerin in München öffnet Freitagabend die Karte, stellt
„2 ½ Stunden, Abfahrt Samstag 6:30, Rad-Zubringer 20 Minuten" ein und sieht
vierzig erreichbare Touren mit grüner Rückreise-Ampel – darunter drei, von
denen sie noch nie gehört hat. Sie klickt eine an, sieht „Anreise 1:47 via
Lenggries, letzte Rückfahrt 19:42", speichert die Verbindung und lässt das
Auto stehen. **Nicht aus Verzicht – sondern weil der öffentliche Weg zum
Berg zum ersten Mal der bequemere war.**

Multipliziert über die Reichweite von alpenvereinaktiv und die Mitglieder
dreier Alpenvereine ist das kein Feature. Es ist Verkehrsverlagerung als
Produkt.

---

## Anhang: Technik in 60 Sekunden

| Baustein | Lösung |
|---|---|
| Fahrplandaten & Routing | Transitous (offene MOTIS-Instanz, GTFS aller Alpenländer); bei Skalierung eigene Instanz vorgesehen |
| Erreichbarkeits-Berechnung | One-to-many auf Haltestellenebene + Fuß/Rad-Zubringer-Puffer; Fläche als Union, Pin-Auswahl exakt über Haltestellen-Distanz |
| Tourdaten | quellenneutrale Import-Schnittstelle (aktuell OSM/ODbL; Outdooractive-API-Anbindung im Konzept vorgesehen) |
| Stack | Next.js/React + MapLibre (Vercel), PostgreSQL/PostGIS (Supabase), Import-Jobs via GitHub Actions – vollständig Open Source |
| Datenschutz | keine Konten, kein Tracking; Fahrplan- und Geocoding-Anfragen laufen über den eigenen Server, Nutzer-IPs gehen nicht an Dritte |
| Ausbaustufe „Rückreise-Check" | Startzeit + Gehzeit + Endpunkt-Routing; Datenmodell (Endpunkt ≠ Startpunkt, Rundtour-Flag, Dauer) bereits implementiert |

Vollständige technische Konzeption inkl. Sicherheitskonzept:
[KONZEPT.md](./KONZEPT.md) im selben Repository.
