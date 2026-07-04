/** Antwortform von GET /api/reachability (vom Frontend konsumiert). */
export interface ReachabilityResponse {
  meta: {
    dataMode: 'live' | 'mock';
    depart: string;
    mode: 'walk' | 'bike';
    feederRadiusKm: number;
    stopCount: number;
    tourCount: number;
    tourSource: 'supabase' | 'beispieldaten';
  };
  isochrone: GeoJSON.Feature<GeoJSON.MultiPolygon>;
  stops: GeoJSON.FeatureCollection<GeoJSON.Point>;
  tours: GeoJSON.FeatureCollection<GeoJSON.Point>;
}
