-- API usage logging table for observability
-- Tracks endpoint calls, response times, and errors for monitoring

CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  error_code TEXT,
  platform TEXT,
  niche TEXT,
  format TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by user and time
CREATE INDEX idx_api_usage_user_time ON api_usage_log (user_id, created_at DESC);

-- Index for error monitoring (partial — only rows with errors)
CREATE INDEX idx_api_usage_errors ON api_usage_log (status_code, created_at DESC) WHERE status_code >= 400;

-- RLS: users can read own logs, service role writes all
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own logs" ON api_usage_log FOR SELECT USING (auth.uid() = user_id);
