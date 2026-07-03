import type { ReachableStop } from '../types';

/**
 * Mock-Daten für den Entwicklungsmodus (TRANSITOUS_MODE=mock):
 * reale Bahnhöfe/Haltestellen im Münchner Umland mit realistischen,
 * aber manuell geschätzten ÖV-Reisezeiten ab München Hbf (Samstagmorgen).
 *
 * Wird verwendet, solange api.transitous.org aus der Entwicklungsumgebung
 * nicht erreichbar ist. Keine Fahrplanauskunft – nur Größenordnungen.
 */
export const MUNICH_ORIGIN = { lat: 48.1402, lon: 11.5601, name: 'München Hbf' };

export const MUNICH_STOPS: ReachableStop[] = [
  { id: 'de:hbf', name: 'München Hbf', lat: 48.1402, lon: 11.5601, travelMinutes: 0 },
  { id: 'de:ost', name: 'München Ost', lat: 48.1272, lon: 11.6063, travelMinutes: 10 },
  { id: 'de:starnberg', name: 'Starnberg', lat: 47.9994, lon: 11.3414, travelMinutes: 22 },
  { id: 'de:tutzing', name: 'Tutzing', lat: 47.9084, lon: 11.2803, travelMinutes: 32 },
  { id: 'de:weilheim', name: 'Weilheim (Oberbay)', lat: 47.8413, lon: 11.1546, travelMinutes: 42 },
  { id: 'de:penzberg', name: 'Penzberg', lat: 47.7503, lon: 11.3777, travelMinutes: 52 },
  { id: 'de:wolfratshausen', name: 'Wolfratshausen', lat: 47.9135, lon: 11.4270, travelMinutes: 35 },
  { id: 'de:holzkirchen', name: 'Holzkirchen', lat: 47.8843, lon: 11.7003, travelMinutes: 33 },
  { id: 'de:miesbach', name: 'Miesbach', lat: 47.7893, lon: 11.8312, travelMinutes: 55 },
  { id: 'de:badtoelz', name: 'Bad Tölz', lat: 47.7603, lon: 11.5591, travelMinutes: 65 },
  { id: 'de:lenggries', name: 'Lenggries', lat: 47.6790, lon: 11.5732, travelMinutes: 78 },
  { id: 'de:gmund', name: 'Gmund am Tegernsee', lat: 47.7521, lon: 11.7373, travelMinutes: 68 },
  { id: 'de:tegernsee', name: 'Tegernsee', lat: 47.7122, lon: 11.7585, travelMinutes: 78 },
  { id: 'de:rottach', name: 'Rottach-Egern Rathaus (Bus)', lat: 47.6893, lon: 11.7713, travelMinutes: 92 },
  { id: 'de:kreuth', name: 'Kreuth Kirche (Bus)', lat: 47.6413, lon: 11.7448, travelMinutes: 105 },
  { id: 'de:schliersee', name: 'Schliersee', lat: 47.7352, lon: 11.8581, travelMinutes: 65 },
  { id: 'de:neuhaus', name: 'Fischhausen-Neuhaus', lat: 47.7034, lon: 11.8765, travelMinutes: 73 },
  { id: 'de:spitzingsee', name: 'Spitzingsee Kirche (Bus)', lat: 47.6641, lon: 11.8852, travelMinutes: 90 },
  { id: 'de:bayrischzell', name: 'Bayrischzell', lat: 47.6752, lon: 11.9550, travelMinutes: 88 },
  { id: 'de:birkenstein', name: 'Birkenstein (Bus)', lat: 47.7003, lon: 11.9760, travelMinutes: 92 },
  { id: 'de:kochel', name: 'Kochel', lat: 47.6572, lon: 11.3651, travelMinutes: 63 },
  { id: 'de:urfeld', name: 'Urfeld am Walchensee (Bus)', lat: 47.6600, lon: 11.3315, travelMinutes: 85 },
  { id: 'de:benediktbeuern', name: 'Benediktbeuern', lat: 47.7085, lon: 11.3953, travelMinutes: 58 },
  { id: 'de:murnau', name: 'Murnau', lat: 47.6802, lon: 11.2020, travelMinutes: 55 },
  { id: 'de:ohlstadt', name: 'Ohlstadt', lat: 47.6325, lon: 11.2404, travelMinutes: 63 },
  { id: 'de:eschenlohe', name: 'Eschenlohe', lat: 47.5993, lon: 11.1857, travelMinutes: 68 },
  { id: 'de:oberau', name: 'Oberau', lat: 47.5602, lon: 11.1351, travelMinutes: 74 },
  { id: 'de:farchant', name: 'Farchant', lat: 47.5312, lon: 11.1105, travelMinutes: 80 },
  { id: 'de:gap', name: 'Garmisch-Partenkirchen', lat: 47.4921, lon: 11.0956, travelMinutes: 85 },
  { id: 'de:mittenwald', name: 'Mittenwald', lat: 47.4423, lon: 11.2601, travelMinutes: 105 },
  { id: 'de:oberammergau', name: 'Oberammergau', lat: 47.5972, lon: 11.0633, travelMinutes: 88 },
  { id: 'de:badkohlgrub', name: 'Bad Kohlgrub', lat: 47.6690, lon: 11.0480, travelMinutes: 72 },
  { id: 'de:ebersberg', name: 'Ebersberg', lat: 48.0782, lon: 11.9712, travelMinutes: 40 },
  { id: 'de:rosenheim', name: 'Rosenheim', lat: 47.8504, lon: 12.1191, travelMinutes: 42 },
  { id: 'de:brannenburg', name: 'Brannenburg', lat: 47.7376, lon: 12.0966, travelMinutes: 63 },
  { id: 'de:oberaudorf', name: 'Oberaudorf', lat: 47.6486, lon: 12.1723, travelMinutes: 72 },
  { id: 'de:kiefersfelden', name: 'Kiefersfelden', lat: 47.6135, lon: 12.1907, travelMinutes: 78 },
  { id: 'at:kufstein', name: 'Kufstein', lat: 47.5833, lon: 12.1656, travelMinutes: 82 },
  { id: 'de:prien', name: 'Prien am Chiemsee', lat: 47.8555, lon: 12.3450, travelMinutes: 55 },
  { id: 'de:aschau', name: 'Aschau im Chiemgau', lat: 47.7639, lon: 12.3231, travelMinutes: 78 },
  { id: 'de:bernau', name: 'Bernau am Chiemsee (Bus)', lat: 47.8121, lon: 12.3752, travelMinutes: 65 },
  { id: 'de:bergen', name: 'Bergen (Oberbay)', lat: 47.8062, lon: 12.5893, travelMinutes: 80 },
  { id: 'de:traunstein', name: 'Traunstein', lat: 47.8692, lon: 12.6441, travelMinutes: 78 },
  { id: 'de:ruhpolding', name: 'Ruhpolding', lat: 47.7626, lon: 12.6467, travelMinutes: 98 },
  { id: 'de:freilassing', name: 'Freilassing', lat: 47.8404, lon: 12.9791, travelMinutes: 102 },
  { id: 'at:salzburg', name: 'Salzburg Hbf', lat: 47.8131, lon: 13.0455, travelMinutes: 112 },
  { id: 'de:berchtesgaden', name: 'Berchtesgaden Hbf', lat: 47.6300, lon: 13.0001, travelMinutes: 150 },
  { id: 'at:jenbach', name: 'Jenbach', lat: 47.3897, lon: 11.7780, travelMinutes: 100 },
  { id: 'at:innsbruck', name: 'Innsbruck Hbf', lat: 47.2632, lon: 11.4010, travelMinutes: 112 },
];
