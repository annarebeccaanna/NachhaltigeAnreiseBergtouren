import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  robots: { index: false },
};

// PLATZHALTER in [Klammern] vor dem Launch ersetzen (TODO.md).
// Inhaltlich abgestimmt auf KONZEPT.md § 11.7.
export default function Datenschutz() {
  return (
    <main className="legal">
      <Link href="/">← zurück zur Karte</Link>
      <h1>Datenschutzerklärung</h1>

      <h2>Verantwortliche</h2>
      <p>
        [VOR- UND NACHNAME], [STRASSE HAUSNUMMER], [PLZ ORT] –
        E-Mail: [E-MAIL-ADRESSE]
      </p>

      <h2>Kurzfassung</h2>
      <p>
        Dieser Dienst kommt ohne Konten, ohne Tracking und ohne Werbung aus.
        Es werden keine personenbezogenen Daten dauerhaft gespeichert.
      </p>

      <h2>Verarbeitung im Einzelnen</h2>
      <h3>Server-Logs und Auslieferung (Vercel)</h3>
      <p>
        Der Dienst wird bei Vercel Inc. betrieben. Beim Aufruf verarbeitet
        Vercel technisch notwendig die IP-Adresse und Browserdaten in
        kurzlebigen Server-Logs (Art. 6 Abs. 1 lit. f DSGVO – Betrieb und
        Absicherung des Dienstes).
      </p>
      <h3>Erreichbarkeits-Suche</h3>
      <p>
        Eingegebene Startpunkte und Suchbegriffe werden zur Beantwortung der
        Anfrage verarbeitet und nicht mit deiner IP-Adresse verknüpft
        gespeichert. Anfragen an die Fahrplanauskunft (Transitous) und die
        Ortssuche (Photon/Komoot) stellt unser Server – deine IP-Adresse
        wird an diese Dienste nicht weitergegeben.
      </p>
      <h3>Kartendarstellung (OpenFreeMap)</h3>
      <p>
        Die Karten-Kacheln lädt dein Browser direkt von OpenFreeMap; dabei
        wird deine IP-Adresse an OpenFreeMap übertragen (technisch
        erforderlich für die Kartendarstellung, Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <h3>Missbrauchsschutz (Rate Limiting)</h3>
      <p>
        Zum Schutz vor automatisiertem Missbrauch speichern wir pro
        IP-Adresse einen Anfragezähler mit einer Lebensdauer von unter zwei
        Minuten (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <h3>Sprach-Cookie</h3>
      <p>
        Wenn du die Sprache manuell umstellst, speichert ein rein
        funktionales Cookie (<code>locale</code>) deine Wahl für ein Jahr.
        Es enthält keine personenbezogenen Daten und wird nicht zu
        Analysezwecken verwendet.
      </p>

      <h2>Deine Rechte</h2>
      <p>
        Du hast nach DSGVO Rechte auf Auskunft, Berichtigung, Löschung,
        Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch
        sowie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.
        Da wir keine personenbezogenen Daten dauerhaft speichern, gibt es in
        der Regel allerdings nichts zu beauskunften oder zu löschen.
      </p>
    </main>
  );
}
