// api/delete-account.ts — GDPR account deletion endpoint
//
// Deletion order (respects FK constraints):
//   1. Storage: uploads bucket — ${userId}/* and visualize-temp/${userId}/*
//   2. DB: analyses (user_id FK; also cascades on auth user deletion)
//   3. DB: profiles (id FK; also cascades on auth user deletion)
//   4. Auth: supabase.auth.admin.deleteUser — cascades beta_codes.used_by → null
//
// Uses SUPABASE_SERVICE_ROLE_KEY for admin.deleteUser — never exposed to client.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyAuth, handlePreflight, checkRateLimit } from "./_lib/auth";
import { apiError } from "./_lib/apiError.js";

// ─── Storage cleanup helper ────────────────────────────────────────────────────
// Lists all files under a storage prefix and removes them in one call.
// Best-effort: logs errors but never throws (storage failures don't block deletion).
async function deleteStorageFolder(
  supabaseAdmin: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<void> {
  const { data: files, error: listErr } = await supabaseAdmin.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });

  if (listErr) {
    console.warn(`[delete-account] Could not list ${bucket}/${prefix}:`, listErr.message);
    return;
  }
  if (!files || files.length === 0) return;

  const paths = files.map((f) => `${prefix}/${f.name}`);
  const { error: removeErr } = await supabaseAdmin.storage.from(bucket).remove(paths);
  if (removeErr) {
    console.warn(`[delete-account] Storage remove failed for ${bucket}/${prefix}:`, removeErr.message);
  } else {
    console.info(`[delete-account] Removed ${paths.length} file(s) from ${bucket}/${prefix}`);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Rate limit: 3 attempts per hour to prevent abuse
    const rl = await checkRateLimit("delete-account", user.id, user.tier, { freeLimit: 3, proLimit: 3, windowSeconds: 3600 });
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[delete-account] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return apiError(res, 'INTERNAL_ERROR', 500, "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const uid = user.id;

    // ── 1. Storage: uploads bucket ──────────────────────────────────────────
    // Files live at two prefixes in the 'uploads' bucket:
    //   - ${uid}/*           — files uploaded for analysis (analyzerService, storageService)
    //   - visualize-temp/${uid}/* — Kling/visualize temp frames
    await deleteStorageFolder(supabaseAdmin, "uploads", uid);
    await deleteStorageFolder(supabaseAdmin, "uploads", `visualize-temp/${uid}`);

    // ── 2. DB: analyses (user_id FK + ON DELETE CASCADE) ────────────────────
    const { error: analysesErr } = await supabaseAdmin
      .from("analyses")
      .delete()
      .eq("user_id", uid);
    if (analysesErr) {
      // Non-fatal: auth.deleteUser cascade will clean up anything we missed
      console.warn("[delete-account] analyses delete:", analysesErr.message);
    } else {
      console.info("[delete-account] analyses deleted for user %s", uid);
    }

    // ── 3. DB: profiles (id FK + ON DELETE CASCADE) ─────────────────────────
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", uid);
    if (profileErr) {
      // Non-fatal: auth.deleteUser cascade will clean up anything we missed
      console.warn("[delete-account] profile delete:", profileErr.message);
    } else {
      console.info("[delete-account] profile deleted for user %s", uid);
    }

    // ── 4. Auth user (cascades beta_codes.used_by → null via ON DELETE SET NULL)
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (authErr) {
      console.error("[delete-account] Failed to delete auth user:", authErr.message);
      return apiError(res, 'INTERNAL_ERROR', 500, `auth.admin.deleteUser failed: ${authErr.message}`);
    }

    console.info("[delete-account] Successfully deleted user %s", uid);
    return res.status(200).json({ success: true });
  } catch (err) {
    return apiError(res, 'INTERNAL_ERROR', 500,
      `[delete-account] ${err instanceof Error ? err.message : String(err)}`);
  }
}
