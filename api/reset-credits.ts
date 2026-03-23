// api/reset-credits.ts — DEV ONLY: Reset credit counters for testing
// Deletes Redis keys for all feature credits for the current user's current month.
// Only works in development or when ALLOW_CREDIT_RESET=true is set.

export const maxDuration = 10;

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import { verifyAuth, handlePreflight } from "./_lib/auth";

const FEATURES = ["visualize", "visualize_video", "fixIt", "policyCheck", "deconstruct", "brief", "script"];

function getYearMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Only allow in dev or with explicit env flag
  const isDev = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === undefined;
  const allowReset = process.env.ALLOW_CREDIT_RESET === "true";
  if (!isDev && !allowReset) {
    return res.status(403).json({ error: "Credit reset only available in development" });
  }

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const redis = Redis.fromEnv();
    const month = getYearMonth();
    const tiers = ["pro", "team", "free"];
    const deleted: string[] = [];

    for (const tier of tiers) {
      for (const feature of FEATURES) {
        const key = `credit:${tier}:${user.id}:${feature}:${month}`;
        const existed = await redis.del(key);
        if (existed) deleted.push(key);
      }
    }

    console.info("[reset-credits] Deleted %d keys for user %s: %s",
      deleted.length, user.id, deleted.join(", "));

    return res.status(200).json({
      message: `Reset ${deleted.length} credit keys for ${month}`,
      deleted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
}
