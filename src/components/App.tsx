'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FeederMode } from '@/lib/types';
import type { ReachabilityResponse } from '@/lib/apiTypes';
import Sidebar from './Sidebar';
import MapView from './MapView';

export interface StartPoint {
  lat: number;
  lon: number;
  label: string;
}

export interface Settings {
  maxTransitMinutes: number;
  mode: FeederMode;
  feederMinutes: number;
}

const DEFAULT_START: StartPoint = { lat: 48.1402, lon: 11.5601, label: 'München Hbf' };

const INITIAL_SETTINGS: Settings = {
  maxTransitMinutes: 120,
  mode: 'walk',
  feederMinutes: 30,
};

async function fetchReachability(
  s: Settings,
  start: StartPoint
): Promise<ReachabilityResponse> {
  const query = new URLSearchParams({
    lat: String(start.lat),
    lon: String(start.lon),
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
  const [start, setStart] = useState<StartPoint>(DEFAULT_START);
  const [data, setData] = useState<ReachabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (s: Settings, st: StartPoint) => {
    setLoading(true);
    setError(false);
    try {
      setData(await fetchReachability(s, st));
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial einmal laden; danach explizit über Button bzw. Startpunktwahl
  // (bewusste Anfragen, § 11.3).
  useEffect(() => {
    let cancelled = false;
    fetchReachability(INITIAL_SETTINGS, DEFAULT_START)
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

  function handleStartChange(next: StartPoint) {
    setStart(next);
    void load(settings, next);
  }

  return (
    <div className="app">
      <Sidebar
        settings={settings}
        onChange={setSettings}
        onApply={() => void load(settings, start)}
        start={start}
        onStartChange={handleStartChange}
        meta={data?.meta ?? null}
        loading={loading}
        error={error}
      />
      <MapView data={data} start={start} />
    </div>
  );
}
