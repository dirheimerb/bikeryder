-- Row Level Security for bikeryder.
-- A user can fully manage their own rows; public rides/profiles are readable
-- by any authenticated user.

alter table public.profiles   enable row level security;
alter table public.rides      enable row level security;
alter table public.ride_points enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- rides : owner has full access; public rides are readable by anyone signed in
-- ---------------------------------------------------------------------------
create policy "Owners can read their rides"
  on public.rides for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Anyone can read public rides"
  on public.rides for select
  to authenticated
  using (visibility = 'public');

create policy "Owners can insert their rides"
  on public.rides for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owners can update their rides"
  on public.rides for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners can delete their rides"
  on public.rides for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ride_points : access mirrors the parent ride
-- ---------------------------------------------------------------------------
create policy "Read points of accessible rides"
  on public.ride_points for select
  to authenticated
  using (
    exists (
      select 1 from public.rides r
      where r.id = ride_points.ride_id
        and (r.user_id = auth.uid() or r.visibility = 'public')
    )
  );

create policy "Insert points into own rides"
  on public.ride_points for insert
  to authenticated
  with check (
    exists (
      select 1 from public.rides r
      where r.id = ride_points.ride_id
        and r.user_id = auth.uid()
    )
  );

create policy "Delete points of own rides"
  on public.ride_points for delete
  to authenticated
  using (
    exists (
      select 1 from public.rides r
      where r.id = ride_points.ride_id
        and r.user_id = auth.uid()
    )
  );
