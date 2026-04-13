// betaService.ts — Client for /api/redeem-beta-code and /api/validate-beta-code

import { supabase } from "../lib/supabase";

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

/** Redeem a beta access code for the current authenticated user. */
export async function redeemBetaCode(code: string): Promise<{ success: boolean }> {
  const token = await getAuthToken();
  const res = await fetch("/api/redeem-beta-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });

  const data = await res.json() as { success?: boolean; error?: string; message?: string };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Something went wrong. Please try again.");
  }

  return { success: true };
}

/** Validate a beta code (no auth required — pre-signup check). */
export async function validateBetaCode(code: string): Promise<{ valid: boolean }> {
  const res = await fetch("/api/validate-beta-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await res.json() as { valid?: boolean; error?: string };

  if (!res.ok || !data.valid) {
    throw new Error("Invalid or already used code. Try another.");
  }

  return { valid: true };
}
