-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor) to create the analyses table.

-- Table for public shareable scorecard links
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  file_name text not null default '',
  scores jsonb,
  markdown text not null default '',
  created_at timestamptz not null default now()
);

-- Index for fast lookup by slug
create index if not exists analyses_slug_idx on public.analyses (slug);

-- RLS: allow anyone to insert (create share) and to read by slug (view share)
alter table public.analyses enable row level security;

-- Anyone can insert a new analysis (share)
create policy "Allow anonymous insert"
  on public.analyses for insert
  to anon
  with check (true);

-- Anyone can read any analysis (public share links)
create policy "Allow public read"
  on public.analyses for select
  to anon
  using (true);
