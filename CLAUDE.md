# bikeryder — notes for Claude

Mobile GPS ride tracker. Expo (React Native) + Supabase. See `README.md`.

## Conventions

- **TypeScript strict.** Run `npm run typecheck` and `npm run lint` before
  committing — the repo is kept green.
- **Imports** use the `@/` alias for `src/` (e.g. `import { supabase } from
  '@/lib/supabase'`).
- **Supabase Database type** (`src/types/database.ts`) is hand-authored and must
  stay a `type` alias (not `interface`) with `Row`/`Insert`/`Update`/
  `Relationships` per table — otherwise supabase-js degrades writes to `never`.
- **React Compiler is on** (eslint-config-expo). Avoid `setState` directly in an
  effect body; keep `useMemo`/`useCallback` deps matching what the body reads.

## Architecture notes

- One GPS source at a time (`src/features/tracking/useRecorder.ts`): background
  TaskManager updates when permitted, else a foreground `watchPositionAsync`
  fallback — never both, to avoid double-counting distance.
- Live ride math is accumulated incrementally in the Zustand store
  (`src/features/tracking/store.ts`); pause/resume is handled with
  `accumulatedMs` + `segmentStartMs`.
- Rides persist as a summary row + an encoded polyline + raw `ride_points`
  (batched insert with rollback on failure).

## Backend

Schema is SQL-migrations-only in `supabase/migrations`, not applied to any live
project yet (the existing `koparex` Supabase project is an unrelated production
app and must not be touched). Provision a dedicated project before wiring keys.
