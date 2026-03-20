// src/lib/policyCheckService.ts — Client for /api/policy-check

import { supabase } from "./supabase";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface PolicyCategory {
  id: string;
  name: string;
  platform: "meta" | "tiktok";
  status: "clear" | "review" | "rejection";
  finding: string;
  fix: string;
  riskLevel: "low" | "medium" | "high";
}

export interface PolicyCheckResult {
  verdict: "good" | "fix" | "high_risk";
  verdictLabel: "Good to launch" | "Fix before launching" | "High rejection risk";
  metaCategories: PolicyCategory[];
  tiktokCategories: PolicyCategory[];
  topFixes: string[];
  reviewerNotes: string;
  platform: "meta" | "tiktok" | "both";
}

export interface PolicyCheckParams {
  mediaUrl?: string;
  mediaDataUrl?: string;
  adCopy?: string;
  platform: "meta" | "tiktok" | "both";
  adType: "video" | "static" | "display";
  niche: string;
  existingAnalysis?: object;
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export async function runPolicyCheck(params: PolicyCheckParams): Promise<PolicyCheckResult> {
  const token = await getAuthToken();

  const response = await fetch("/api/policy-check", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const secs = (data as { resetAt?: string }).resetAt
      ? Math.ceil((new Date((data as { resetAt: string }).resetAt).getTime() - Date.now()) / 1000)
      : 86400;
    const hours = Math.ceil(secs / 3600);
    throw new Error(`RATE_LIMITED:${hours}h`);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Policy check failed (${response.status})`);
  }

  return response.json() as Promise<PolicyCheckResult>;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function formatPolicyReportAsText(result: PolicyCheckResult): string {
  const lines: string[] = [];
  lines.push(`CUTSHEET POLICY CHECK REPORT`);
  lines.push(`Verdict: ${result.verdictLabel}`);
  lines.push("");

  if (result.topFixes.length > 0) {
    lines.push("TOP 3 FIXES:");
    result.topFixes.forEach((fix, i) => lines.push(`${i + 1}. ${fix}`));
    lines.push("");
  }

  const allCategories = [...result.metaCategories, ...result.tiktokCategories];
  const flagged = allCategories.filter((c) => c.status !== "clear");
  if (flagged.length > 0) {
    lines.push("FLAGGED ITEMS:");
    flagged.forEach((c) => {
      const icon = c.status === "rejection" ? "🚨" : "⚠️";
      lines.push(`\n${icon} [${c.platform.toUpperCase()}] ${c.name} — ${c.riskLevel.toUpperCase()} RISK`);
      lines.push(`Finding: ${c.finding}`);
      lines.push(`Fix: ${c.fix}`);
    });
    lines.push("");
  }

  if (result.reviewerNotes) {
    lines.push("REVIEWER NOTES (for appeal):");
    lines.push(result.reviewerNotes);
  }

  return lines.join("\n");
}
