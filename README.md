# bikeryder

A mobile GPS ride tracker for cyclists — record rides, see live stats and your
route on a map, then review your history. Built with Expo (React Native) and
Supabase.

## Stack

| Concern        | Choice                                                |
| -------------- | ----------------------------------------------------- |
| App framework  | Expo SDK 56, React Native 0.85, expo-router           |
| Language       | TypeScript (strict)                                   |
| Location       | expo-location (foreground + background) + TaskManager |
| Maps           | react-native-maps (Apple Maps / Google Maps)          |
| Backend        | Supabase (Postgres + PostGIS, Auth, RLS)              |
| Server state   | TanStack Query                                        |
| Live ride state| Zustand                                               |

## Project layout

```
app/                      expo-router routes
  (auth)/                 sign-in / sign-up
  (tabs)/                 Record · Activities · Profile
  ride/[id].tsx           ride detail
  ride/save.tsx           review & save after a recording
src/
  components/             shared UI (Button, Field, StatTile, RouteMap…)
  features/
    tracking/             GPS recorder hook, background task, Zustand store
    rides/                ride API + React Query hooks
    profile/              profile API + hooks
  lib/                    supabase client, env, units, geo (haversine, polyline)
  providers/              AuthProvider
  theme/                  design tokens
supabase/migrations/      SQL schema, RLS, triggers
```

## Getting started

```bash
npm install
cp .env.example .env   # fill in Supabase URL + anon key
npm run start          # then press i / a, or scan with a dev build
```

> Background location (recording while the screen is locked) requires a
> **development build**, not Expo Go. Build one with EAS:
> `npx eas build --profile development --platform ios|android`.

## Backend

The database schema lives in [`supabase/`](./supabase) as SQL migrations and is
**not yet applied to a live project**. See
[`supabase/README.md`](./supabase/README.md) to provision and apply it, then put
the project URL + anon key in `.env`.

## Scripts

- `npm run start` — Expo dev server
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Roadmap

- [x] M0 — Scaffold, data layer, schema
- [x] M1 — Auth (email/password, session persistence, auto-profile)
- [x] M2 — Ride tracking (GPS, live stats, map, background)
- [x] M3 — Save & history (persist rides, list, detail)
- [x] M4 — Profile (lifetime stats, units, sign out)
- [ ] Following / activity feed
- [ ] Segments & leaderboards
- [ ] Ride photos
- [ ] Offline map tiles
- [ ] Apple Health / Google Fit sync
