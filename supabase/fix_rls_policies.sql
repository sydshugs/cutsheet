-- fix_rls_policies.sql
-- Ensures every user-facing table has Row Level Security enabled
-- and proper auth.uid()-based policies.
--
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE patterns).
-- Run in Supabase SQL Editor: Dashboard > SQL Editor > New query > paste > Run
--
-- Tables covered:
--   profiles        — user profile data (id = auth user id)
--   user_profiles   — brand voice settings (user_id FK)
--   analyses        — saved analysis results (user_id FK) + public share links
--   suggestion_feedback — fix-it vote feedback (user_id FK)
--   beta_codes      — beta access codes (service_role only, no user policies)

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PROFILES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users read own profile'
  ) THEN
    CREATE POLICY "Users read own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users update own profile'
  ) THEN
    CREATE POLICY "Users update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users can insert their own profile (on first login / onboarding)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users insert own profile'
  ) THEN
    CREATE POLICY "Users insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. USER_PROFILES (brand voice settings)
-- ═══════════════════════════════════════════════════════════════════════════

-- Create table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_voice_description text DEFAULT '',
  brand_voice_tags        jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users read own user_profile'
  ) THEN
    CREATE POLICY "Users read own user_profile"
      ON public.user_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users update own user_profile'
  ) THEN
    CREATE POLICY "Users update own user_profile"
      ON public.user_profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users insert own user_profile'
  ) THEN
    CREATE POLICY "Users insert own user_profile"
      ON public.user_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ANALYSES
-- ═══════════════════════════════════════════════════════════════════════════
--
-- The analyses table serves two purposes:
--   a) Authenticated user history (user_id = auth.uid())
--   b) Public share links (anyone can read by slug)
--
-- We need auth.uid() policies for user operations AND an anon SELECT for shares.

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Add user_id column if missing (older schema may not have it)
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Authenticated users can read their own analyses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analyses' AND policyname = 'Users read own analyses'
  ) THEN
    CREATE POLICY "Users read own analyses"
      ON public.analyses FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Authenticated users can insert their own analyses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analyses' AND policyname = 'Users insert own analyses'
  ) THEN
    CREATE POLICY "Users insert own analyses"
      ON public.analyses FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Authenticated users can delete their own analyses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analyses' AND policyname = 'Users delete own analyses'
  ) THEN
    CREATE POLICY "Users delete own analyses"
      ON public.analyses FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Public share: anyone can read any analysis (for share links)
-- This is intentional — share links are public by design.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analyses' AND policyname = 'Public read for share links'
  ) THEN
    CREATE POLICY "Public read for share links"
      ON public.analyses FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;

-- Drop legacy overly-permissive policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.analyses;
DROP POLICY IF EXISTS "Allow public insert" ON public.analyses;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.analyses;
DROP POLICY IF EXISTS "Allow public read" ON public.analyses;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. SUGGESTION_FEEDBACK
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.suggestion_feedback (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id text,
  section     text NOT NULL,
  vote        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.suggestion_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'suggestion_feedback' AND policyname = 'Users read own feedback'
  ) THEN
    CREATE POLICY "Users read own feedback"
      ON public.suggestion_feedback FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'suggestion_feedback' AND policyname = 'Users insert own feedback'
  ) THEN
    CREATE POLICY "Users insert own feedback"
      ON public.suggestion_feedback FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. BETA_CODES — service_role only
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.beta_codes ENABLE ROW LEVEL SECURITY;

-- No user-facing policies. Service role key bypasses RLS.
-- This means no one can query beta_codes via the anon or authenticated client.

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. STORAGE: uploads bucket — users can only access their own folder
-- ═══════════════════════════════════════════════════════════════════════════
-- Note: Storage policies are managed via the Supabase Dashboard under
-- Storage > Policies. The SQL below is the equivalent if running manually.

-- Users can upload to their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users upload to own folder'
  ) THEN
    CREATE POLICY "Users upload to own folder"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Users can read their own uploads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users read own uploads'
  ) THEN
    CREATE POLICY "Users read own uploads"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Users can delete their own uploads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own uploads'
  ) THEN
    CREATE POLICY "Users delete own uploads"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. HELPER FUNCTIONS for verify-rls.ts script
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rls_check_tables()
RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT tablename, rowsecurity
    FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.rls_check_policies()
RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname
  ) t;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Done. Run: npm run verify:rls to confirm all checks pass.
-- ═══════════════════════════════════════════════════════════════════════════
