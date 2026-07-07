import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Impressum',
  robots: { index: false },
};

// PLATZHALTER in [Klammern] müssen vor dem öffentlichen Launch mit den
// echten Angaben der Betreiberin ersetzt werden (Launch-Checkliste in
// TODO.md). Rechtsseiten bewusst nur auf Deutsch (Betreiberin in DE).
export default function Impressum() {
  return (
    <main className="legal">
      <Link href="/">← zurück zur Karte</Link>
      <h1>Impressum</h1>

      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        [VOR- UND NACHNAME]
        <br />
        [STRASSE HAUSNUMMER]
        <br />
        [PLZ ORT]
        <br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>E-Mail: [E-MAIL-ADRESSE]</p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Dieses Angebot ist ein nicht-kommerzielles Projekt zur Förderung
        nachhaltiger Anreise zu Bergtouren. Die dargestellten Erreichbarkeiten,
        Fahrpläne und Tourdaten sind automatisch berechnete bzw. aus offenen
        Quellen übernommene Näherungswerte ohne Gewähr. Sie ersetzen weder
        eine Fahrplanauskunft noch eine eigenverantwortliche Tourenplanung –
        bitte prüfe Verbindungen, Wegverhältnisse und alpine Gefahren stets
        selbst.
      </p>

      <h2>Datenquellen und Lizenzen</h2>
      <p>
        Tourdaten © OpenStreetMap-Mitwirkende, lizenziert unter{' '}
        <a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>.
        Fahrplanauskünfte über die Community-Instanz{' '}
        <a href="https://transitous.org">Transitous</a> (MOTIS).
        Kartendarstellung: <a href="https://openfreemap.org">OpenFreeMap</a>.
        Der Quellcode dieses Dienstes ist unter der AGPL-3.0 auf{' '}
        <a href="https://github.com/annarebeccaanna/NachhaltigeAnreiseBergtouren">
          GitHub
        </a>{' '}
        verfügbar.
      </p>
    </main>
  );
}
