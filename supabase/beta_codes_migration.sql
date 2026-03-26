-- supabase/beta_codes_migration.sql
-- Run in Supabase SQL Editor (Project → SQL Editor → New query → paste → Run)

-- ── 1. beta_codes table ────────────────────────────────────────────────────
create table if not exists public.beta_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  used        boolean not null default false,
  used_by     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── 2. RLS on beta_codes ────────────────────────────────────────────────────
-- Service role bypasses RLS automatically — no user-facing policies.
-- Users cannot read or write beta_codes directly.
alter table public.beta_codes enable row level security;

-- ── 3. beta_access column on profiles ──────────────────────────────────────
alter table public.profiles
  add column if not exists beta_access boolean not null default false;

-- ── 4. Seed 10 beta codes ───────────────────────────────────────────────────
insert into public.beta_codes (code) values
  ('CUTSHEET-A1B2'),
  ('CUTSHEET-C3D4'),
  ('CUTSHEET-E5F6'),
  ('CUTSHEET-G7H8'),
  ('CUTSHEET-J9K1'),
  ('CUTSHEET-L2M3'),
  ('CUTSHEET-N4P5'),
  ('CUTSHEET-Q6R7'),
  ('CUTSHEET-S8T9'),
  ('CUTSHEET-U1V2')
on conflict (code) do nothing;

-- ── 5. Verify — output should show 10 rows, used = false ───────────────────
select code, used, created_at from public.beta_codes order by created_at;
