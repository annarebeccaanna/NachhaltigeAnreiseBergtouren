-- Migration 0001: Touren-Schema (KONZEPT.md § 3.3, Sicherheitskonzept § 11)
-- Ausführen: Supabase Dashboard → SQL Editor → Inhalt einfügen → Run.

create extension if not exists postgis;

-- Bergtouren (befüllt ausschließlich durch die Import-Jobs)
create table if not exists public.touren (
  id text primary key,
  name text not null,
  quelle text not null,
  lizenz text not null,
  start_punkt geography(point, 4326) not null,
  end_punkt geography(point, 4326) not null,
  ist_rundtour boolean not null,
  -- Vereinfachter Linienverlauf als GeoJSON (nur Darstellung; räumliche
  -- Abfragen laufen über start_punkt)
  geometrie jsonb,
  distanz_km numeric(6, 1) not null,
  aufstieg_hm integer,
  abstieg_hm integer,
  dauer_min integer not null,
  schwierigkeit text check (schwierigkeit in ('leicht', 'mittel', 'schwer')),
  beschreibung text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  importiert_am timestamptz not null default now()
);

create index if not exists touren_start_punkt_gist
  on public.touren using gist (start_punkt);

-- Protokoll der Import-Läufe (Beobachtbarkeit des wöchentlichen Crons)
create table if not exists public.import_laeufe (
  id bigint generated always as identity primary key,
  quelle text not null,
  gestartet_am timestamptz not null default now(),
  beendet_am timestamptz,
  touren_anzahl integer,
  status text not null default 'laeuft'
    check (status in ('laeuft', 'ok', 'fehler')),
  fehler text
);

-- Row Level Security: aktiviert, bewusst OHNE Policies (Deny-all, § 11.2).
-- Zugriff erfolgt ausschließlich über sb_secret-Keys, die RLS umgehen.
alter table public.touren enable row level security;
alter table public.import_laeufe enable row level security;

-- Räumliche Abfrage: alle Touren, deren Startpunkt höchstens radius_m Meter
-- von einer der übergebenen Haltestellen (MultiPoint als WKT) entfernt ist.
-- Nutzt den GIST-Index; liefert flache Spalten statt Geography-Binärformat.
create or replace function public.touren_im_umkreis(
  haltestellen_wkt text,
  radius_m double precision
)
returns table (
  id text,
  name text,
  quelle text,
  lizenz text,
  start_lat double precision,
  start_lon double precision,
  end_lat double precision,
  end_lon double precision,
  ist_rundtour boolean,
  distanz_km numeric,
  aufstieg_hm integer,
  abstieg_hm integer,
  dauer_min integer,
  schwierigkeit text,
  beschreibung text
)
language sql
stable
as $$
  select
    t.id, t.name, t.quelle, t.lizenz,
    st_y(t.start_punkt::geometry), st_x(t.start_punkt::geometry),
    st_y(t.end_punkt::geometry), st_x(t.end_punkt::geometry),
    t.ist_rundtour, t.distanz_km, t.aufstieg_hm, t.abstieg_hm,
    t.dauer_min, t.schwierigkeit, t.beschreibung
  from public.touren t
  where st_dwithin(t.start_punkt, st_geogfromtext(haltestellen_wkt), radius_m);
$$;

-- Funktion nicht für Publishable-Key-Rollen aufrufbar (nur Secret Keys)
revoke execute on function public.touren_im_umkreis(text, double precision)
  from public, anon, authenticated;
