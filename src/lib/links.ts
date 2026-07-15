/**
 * Deeplink zu einer ÖV-Verbindungssuche (Tür-zu-Tourstart).
 * Google Maps Transit ist derzeit der einzige Planer mit stabilem,
 * koordinatenbasiertem Link-Format für alle Alpenländer. Ab M3 zeigt die
 * App Verbindungen direkt an (Transitous), dann wird der Link ergänzt/ersetzt.
 */
export function transitConnectionUrl(opts: {
  fromLat?: number;
  fromLon?: number;
  toLat: number;
  toLon: number;
}): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${opts.toLat},${opts.toLon}`,
    travelmode: 'transit',
  });
  if (typeof opts.fromLat === 'number' && typeof opts.fromLon === 'number') {
    params.set('origin', `${opts.fromLat},${opts.fromLon}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
