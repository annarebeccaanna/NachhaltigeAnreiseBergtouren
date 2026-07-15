import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getTourById } from '@/lib/toursRepo';
import { transitConnectionUrl } from '@/lib/links';
import TourMap from '@/components/TourMap';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ von?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getTourById((await params).id);
  return { title: detail ? detail.tour.name : 'Tour' };
}

/** Startkoordinaten des Users aus ?von=lat,lon (von der Karte übergeben). */
function parseVon(von?: string): { lat: number; lon: number } | undefined {
  const [lat, lon] = (von ?? '').split(',').map(Number);
  if (Number.isFinite(lat) && Number.isFinite(lon) && lat > 43 && lat < 49 && lon > 4.5 && lon < 17) {
    return { lat, lon };
  }
  return undefined;
}

export default async function TourDetailPage({ params, searchParams }: Props) {
  const detail = await getTourById((await params).id);
  if (!detail) notFound();
  const { tour, geometrie, osmRelation, source } = detail;

  const t = await getTranslations('tour');
  const tp = await getTranslations('popup');
  const von = parseVon((await searchParams).von);

  const connectionUrl = transitConnectionUrl({
    fromLat: von?.lat,
    fromLon: von?.lon,
    toLat: tour.start_punkt.lat,
    toLon: tour.start_punkt.lon,
  });

  const hours = Math.floor(tour.dauer_min / 60);
  const minutes = tour.dauer_min % 60;

  return (
    <main className="legal tour-detail">
      <Link href="/">← {t('back')}</Link>
      <h1>{tour.name}</h1>
      <p className="tour-type">
        {tour.ist_rundtour ? `⟳ ${tp('roundTrip')}` : `→ ${tp('aToB')}`}
      </p>

      <TourMap geometrie={geometrie} start={tour.start_punkt} end={tour.end_punkt} />

      <table className="tour-stats">
        <tbody>
          <tr>
            <th>{tp('duration')}</th>
            <td>{tp('hours', { hours, minutes })}</td>
          </tr>
          <tr>
            <th>{tp('distance')}</th>
            <td>{tour.distanz_km} km</td>
          </tr>
          {tour.aufstieg_hm > 0 && (
            <tr>
              <th>{tp('ascent')}</th>
              <td>{tour.aufstieg_hm} hm</td>
            </tr>
          )}
          {tour.abstieg_hm > 0 && (
            <tr>
              <th>{tp('descent')}</th>
              <td>{tour.abstieg_hm} hm</td>
            </tr>
          )}
          <tr>
            <th>{tp('difficulty')}</th>
            <td>{tp(`difficulty_${tour.schwierigkeit}`)}</td>
          </tr>
        </tbody>
      </table>

      {tour.beschreibung && <p className="tour-desc">{tour.beschreibung}</p>}

      <p>
        <a className="connection-button" href={connectionUrl} target="_blank" rel="noopener noreferrer">
          🚆 {t('connection')}
        </a>
      </p>
      {!von && <p className="hint">{t('connectionHint')}</p>}

      <h2>{t('source')}</h2>
      <p>
        {tour.quelle} · {tour.lizenz}
        {osmRelation && (
          <>
            {' · '}
            <a
              href={`https://www.openstreetmap.org/relation/${osmRelation}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('osmLink')}
            </a>
          </>
        )}
      </p>
      {source === 'beispieldaten' && <p className="hint">{t('sampleNote')}</p>}
      <p className="hint">{t('disclaimer')}</p>
    </main>
  );
}
