'use client';

import { useTranslations } from 'next-intl';
import type { ReachabilityResponse } from '@/lib/apiTypes';
import type { Settings } from './App';
import LanguageSwitcher from './LanguageSwitcher';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onApply: () => void;
  meta: ReachabilityResponse['meta'] | null;
  loading: boolean;
  error: boolean;
}

export default function Sidebar({ settings, onChange, onApply, meta, loading, error }: Props) {
  const t = useTranslations();

  return (
    <aside className="sidebar">
      <header>
        <h1>{t('app.title')}</h1>
        <p className="subtitle">{t('app.subtitle')}</p>
      </header>

      <section className="control">
        <label htmlFor="start">{t('sidebar.start')}</label>
        <select id="start" disabled>
          <option>{t('sidebar.startCity')}</option>
        </select>
        <p className="hint">{t('sidebar.startHint')}</p>
      </section>

      <section className="control">
        <label htmlFor="transit">
          {t('sidebar.transitBudget')}:{' '}
          <strong>{t('sidebar.minutes', { value: settings.maxTransitMinutes })}</strong>
        </label>
        <input
          id="transit"
          type="range"
          min={30}
          max={240}
          step={15}
          value={settings.maxTransitMinutes}
          onChange={(e) => onChange({ ...settings, maxTransitMinutes: Number(e.target.value) })}
        />
        <p className="hint">{t('sidebar.departNote')}</p>
      </section>

      <section className="control">
        <span className="grouplabel">{t('sidebar.feederMode')}</span>
        <div className="modes" role="radiogroup" aria-label={t('sidebar.feederMode')}>
          {(['walk', 'bike'] as const).map((m) => (
            <label key={m} className={settings.mode === m ? 'mode active' : 'mode'}>
              <input
                type="radio"
                name="mode"
                value={m}
                checked={settings.mode === m}
                onChange={() => onChange({ ...settings, mode: m })}
              />
              {m === 'walk' ? '🚶 ' : '🚴 '}
              {t(`sidebar.${m}`)}
            </label>
          ))}
        </div>
      </section>

      <section className="control">
        <label htmlFor="feeder">
          {t('sidebar.feederBudget')}:{' '}
          <strong>{t('sidebar.minutes', { value: settings.feederMinutes })}</strong>
        </label>
        <input
          id="feeder"
          type="range"
          min={5}
          max={90}
          step={5}
          value={settings.feederMinutes}
          onChange={(e) => onChange({ ...settings, feederMinutes: Number(e.target.value) })}
        />
      </section>

      <button className="apply" onClick={onApply} disabled={loading}>
        {loading ? t('sidebar.loading') : t('sidebar.apply')}
      </button>

      {error && <p className="error">{t('sidebar.error')}</p>}

      {meta && !error && (
        <section className="results">
          <p>{t('sidebar.results', { tours: meta.tourCount, stops: meta.stopCount })}</p>
          {meta.dataMode === 'mock' && <p className="mock">{t('sidebar.mockNote')}</p>}
          {meta.tourSource === 'beispieldaten' && (
            <p className="mock">{t('sidebar.sampleToursNote')}</p>
          )}
        </section>
      )}

      <section className="legend">
        <h2>{t('sidebar.legend')}</h2>
        <p><span className="swatch area" /> {t('sidebar.legendArea')}</p>
        <p><span className="swatch stop" /> {t('sidebar.legendStop')}</p>
        <p><span className="swatch tour" /> {t('sidebar.legendTour')}</p>
      </section>

      <footer>
        <LanguageSwitcher />
      </footer>
    </aside>
  );
}
