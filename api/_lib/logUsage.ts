// api/_lib/logUsage.ts — Fire-and-forget API usage logging to Supabase
// Never blocks the response. Never throws. Never affects the user.

import { createClient } from "@supabase/supabase-js";

interface UsageParams {
  userId: string;
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  errorCode?: string;
  platform?: string;
  niche?: string;
  format?: string;
}

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export function logApiUsage(params: UsageParams): void {
  // Fire and forget — intentionally not awaited
  const client = getClient();
  if (!client) return;

  client
    .from("api_usage_log")
    .insert({
      user_id: params.userId,
      endpoint: params.endpoint,
      status_code: params.statusCode,
      response_time_ms: params.responseTimeMs,
      error_code: params.errorCode ?? null,
      platform: params.platform ?? null,
      niche: params.niche ?? null,
      format: params.format ?? null,
    })
    .then(({ error }) => {
      if (error) console.warn("[logUsage] insert failed:", error.message);
    })
    .catch(() => {
      // Swallow — logging must never affect the endpoint
    });
}
