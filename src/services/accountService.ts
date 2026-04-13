// accountService.ts — Client for /api/delete-account

import { supabase } from "../lib/supabase";

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated. Please sign in again.");
  return session.access_token;
}

/** Permanently delete the current user's account and all associated data. */
export async function deleteAccount(): Promise<void> {
  const token = await getAuthToken();
  const resp = await fetch("/api/delete-account", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string; error?: string }).message ??
      (data as { error?: string }).error ??
      "Failed to delete account"
    );
  }
}
