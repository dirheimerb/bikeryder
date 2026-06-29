# bikeryder database

Schema lives in [`migrations/`](./migrations) as plain SQL, applied in filename
order.

## Applying to a project

These migrations are intentionally not yet applied to any live project. When you
provision a dedicated Supabase project, apply them with the Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Or paste each file, in order, into the Supabase SQL editor:

1. `0001_init.sql` – extensions, tables, indexes, `updated_at` triggers
2. `0002_rls.sql` – row level security policies
3. `0003_new_user_trigger.sql` – auto-create a profile on sign-up

## Regenerating TypeScript types

After applying, regenerate `src/types/database.ts`:

```bash
supabase gen types typescript --project-id <your-ref> > src/types/database.ts
```
