/** Eine mit dem ÖV erreichte Haltestelle inkl. Reisezeit ab Startpunkt. */
export interface ReachableStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Reisezeit ab Startpunkt in Minuten */
  travelMinutes: number;
}

/** Tour-Schema gemäß KONZEPT.md § 3.3 */
export interface Tour {
  id: string;
  name: string;
  quelle: string;
  lizenz: string;
  start_punkt: { lat: number; lon: number };
  end_punkt: { lat: number; lon: number };
  ist_rundtour: boolean;
  distanz_km: number;
  aufstieg_hm: number;
  abstieg_hm: number;
  dauer_min: number;
  schwierigkeit: 'leicht' | 'mittel' | 'schwer';
  beschreibung: string;
}

export type FeederMode = 'walk' | 'bike';

export interface ReachabilityParams {
  lat: number;
  lon: number;
  maxTransitMinutes: number;
  mode: FeederMode;
  feederMinutes: number;
  /** Abfahrtszeit, ISO 8601. Ohne Angabe: nächster Samstag 07:00 (§ 2.1). */
  depart?: string;
}
