'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FeederMode } from '@/lib/types';
import type { ReachabilityResponse } from '@/lib/apiTypes';
import Sidebar from './Sidebar';
import MapView from './MapView';

/** M1: fester Startpunkt München Hbf (Konzept § 8, Meilenstein 1). */
const START = { lat: 48.1402, lon: 11.5601 };

export interface Settings {
  maxTransitMinutes: number;
  mode: FeederMode;
  feederMinutes: number;
}

const INITIAL_SETTINGS: Settings = {
  maxTransitMinutes: 120,
  mode: 'walk',
  feederMinutes: 30,
};

async function fetchReachability(s: Settings): Promise<ReachabilityResponse> {
  const query = new URLSearchParams({
    lat: String(START.lat),
    lon: String(START.lon),
    maxTransitMinutes: String(s.maxTransitMinutes),
    mode: s.mode,
    feederMinutes: String(s.feederMinutes),
  });
  const res = await fetch(`/api/reachability?${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ReachabilityResponse;
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [data, setData] = useState<ReachabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (s: Settings) => {
    setLoading(true);
    setError(false);
    try {
      setData(await fetchReachability(s));
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial einmal laden; danach nur noch explizit über den Button
  // (bewusste Anfragen, § 11.3).
  useEffect(() => {
    let cancelled = false;
    fetchReachability(INITIAL_SETTINGS)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <Sidebar
        settings={settings}
        onChange={setSettings}
        onApply={() => void load(settings)}
        meta={data?.meta ?? null}
        loading={loading}
        error={error}
      />
      <MapView data={data} />
    </div>
  );
}
