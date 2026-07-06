'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { GeocodeResult } from '@/lib/apiTypes';
import type { StartPoint } from './App';

interface Props {
  start: StartPoint;
  onSelect: (start: StartPoint) => void;
}

/** Ortssuche für die freie Startpunktwahl (Photon via /api/geocode). */
export default function StartSearch({ start, onSelect }: Props) {
  const t = useTranslations('sidebar');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const lang = ['de', 'en', 'fr', 'it'].includes(locale) ? locale : 'en';
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&lang=${lang}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { results: GeocodeResult[] };
        setResults(body.results);
        setFailed(false);
      } catch (err) {
        console.error(err);
        setResults(null);
        setFailed(true);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, locale]);

  // Unterhalb von 2 Zeichen wird nichts angezeigt (statt State im Effekt
  // zu leeren – vermeidet kaskadierende Renders, react-hooks-Regel).
  const active = query.trim().length >= 2;
  const shownResults = active ? results : null;

  function select(r: GeocodeResult) {
    const shortDetail = r.detail.split(',')[0]?.trim();
    onSelect({
      lat: r.lat,
      lon: r.lon,
      label: shortDetail && shortDetail !== r.name ? `${r.name}, ${shortDetail}` : r.name,
    });
    setQuery('');
    setResults(null);
  }

  return (
    <section className="control search">
      <label htmlFor="start-search">{t('start')}</label>
      <p className="current-start">📍 {start.label}</p>
      <input
        id="start-search"
        type="search"
        placeholder={t('searchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {active && failed && <p className="hint">{t('searchError')}</p>}
      {shownResults && shownResults.length === 0 && (
        <p className="hint">{t('searchNoResults')}</p>
      )}
      {shownResults && shownResults.length > 0 && (
        <ul className="search-results">
          {shownResults.map((r) => (
            <li key={`${r.name}-${r.lat}-${r.lon}`}>
              <button type="button" onClick={() => select(r)}>
                <strong>{r.name}</strong>
                {r.detail && <span> {r.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
