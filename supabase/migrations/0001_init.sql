-- bikeryder initial schema
-- Tables: profiles, rides, ride_points
--
-- Notes:
--  * PostGIS is enabled for future spatial queries (nearest rides, segment
--    matching). The mobile client itself reads plain lat/lng + an encoded
--    polyline, so the app does not depend on PostGIS being present.
--  * All timestamps are timestamptz (UTC).

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles : one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  username        text unique,
  display_name    text,
  avatar_url      text,
  unit_preference text not null default 'metric'
                    check (unit_preference in ('metric', 'imperial')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint username_format check (
    username is null
    or (char_length(username) between 3 and 30 and username ~ '^[a-zA-Z0-9_]+$')
  )
);

comment on table public.profiles is 'Public-facing profile, one per authenticated user.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rides : one recorded activity
-- ---------------------------------------------------------------------------
create table if not exists public.rides (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  title            text,
  notes            text,
  sport            text not null default 'cycling',
  visibility       text not null default 'private'
                     check (visibility in ('private', 'public')),
  started_at       timestamptz not null,
  ended_at         timestamptz,
  distance_m       double precision not null default 0,
  moving_time_s    integer not null default 0,
  elapsed_time_s   integer not null default 0,
  avg_speed_mps    double precision not null default 0,
  max_speed_mps    double precision not null default 0,
  elevation_gain_m double precision not null default 0,
  -- Encoded polyline (precision 5) for quick thumbnail rendering.
  polyline         text,
  -- Optional PostGIS route geometry for spatial queries (populated server-side).
  route            geometry(LineString, 4326),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint rides_time_order check (ended_at is null or ended_at >= started_at)
);

comment on table public.rides is 'A single recorded ride/activity owned by a user.';

create index if not exists rides_user_started_idx
  on public.rides (user_id, started_at desc);
create index if not exists rides_public_idx
  on public.rides (visibility, started_at desc)
  where visibility = 'public';
create index if not exists rides_route_gix
  on public.rides using gist (route);

create trigger rides_set_updated_at
  before update on public.rides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ride_points : raw GPS track for a ride
-- ---------------------------------------------------------------------------
create table if not exists public.ride_points (
  id          bigint generated always as identity primary key,
  ride_id     uuid not null references public.rides (id) on delete cascade,
  seq         integer not null,
  lat         double precision not null,
  lng         double precision not null,
  elevation_m double precision,
  speed_mps   double precision,
  recorded_at timestamptz not null,
  unique (ride_id, seq)
);

comment on table public.ride_points is 'Ordered GPS samples that make up a ride track.';

create index if not exists ride_points_ride_seq_idx
  on public.ride_points (ride_id, seq);
