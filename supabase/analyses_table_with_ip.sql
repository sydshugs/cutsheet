-- analyses table with IP tracking for rate limiting
-- Updated version of analyses_table.sql

-- Create analyses table (if not exists)
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  scores JSONB NOT NULL,
  markdown TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_ip TEXT -- For future server-side rate limiting
);

-- Add IP column to existing table (if upgrading)
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS created_by_ip TEXT;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS analyses_slug_idx ON analyses(slug);

-- Create index on IP + created_at for rate limiting queries
CREATE INDEX IF NOT EXISTS analyses_ip_created_idx ON analyses(created_by_ip, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON analyses;
DROP POLICY IF EXISTS "Allow public insert" ON analyses;

-- Allow anyone to read (for public share links)
CREATE POLICY "Allow public read access"
  ON analyses
  FOR SELECT
  USING (true);

-- Allow anyone to insert (with rate limiting handled by Edge Function or client)
CREATE POLICY "Allow public insert"
  ON analyses
  FOR INSERT
  WITH CHECK (true);

-- Optional: Function to check rate limit (requires Supabase Edge Function)
-- This is a placeholder - implement in Edge Function for production
CREATE OR REPLACE FUNCTION check_ip_rate_limit(client_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  share_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO share_count
  FROM analyses
  WHERE created_by_ip = client_ip
    AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN share_count < 10;
END;
$$ LANGUAGE plpgsql;

-- Note: To use this function in production, create a Supabase Edge Function
-- that captures the client IP and calls this function before inserting.
