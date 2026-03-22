// src/lib/deconstructorService.ts — URL parsing + API orchestration for Ad Deconstructor

import { supabase } from "./supabase";
import { getUserContext } from "../services/userContextService";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SourceType = "meta" | "tiktok" | "youtube";

export interface DeconstructResult {
  teardown: string;
  adTitle: string;
  thumbnailUrl: string;
  sourceType: SourceType;
  gemini: Record<string, unknown>;
}

export interface TeardownSection {
  title: string;
  content: string;
}

// ─── URL DETECTION ────────────────────────────────────────────────────────────

export function detectSourceType(url: string): SourceType | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (
      (host.includes("facebook.com") || host.includes("fb.com")) &&
      parsed.pathname.includes("/ads/library")
    )
      return "meta";
    if (
      host.includes("ads.tiktok.com") &&
      parsed.pathname.includes("creativecenter")
    )
      return "tiktok";
    if (host.includes("youtube.com") || host.includes("youtu.be"))
      return "youtube";
    return null;
  } catch {
    return null;
  }
}

export function getSourceLabel(sourceType: SourceType): string {
  const labels: Record<SourceType, string> = {
    meta: "Meta Ad Library",
    tiktok: "TikTok Creative Center",
    youtube: "YouTube",
  };
  return labels[sourceType];
}

// ─── API CALL ─────────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

export async function deconstructAd(
  url: string,
  sourceType: SourceType,
  mediaUrl?: string
): Promise<DeconstructResult> {
  const [token, userCtx] = await Promise.all([getAuthToken(), getUserContext()]);

  const response = await fetch("/api/deconstruct", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      sourceType,
      mediaUrl,
      niche: userCtx.niche,
      userRole: userCtx.role,
      userIntent: userCtx.intent,
    }),
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const resetAt = (data as { resetAt?: string }).resetAt;
    const secs = resetAt
      ? Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000)
      : 86400;
    const hours = Math.floor(secs / 3600);
    const label = hours > 0 ? `${hours}h` : `${Math.ceil(secs / 60)}m`;
    throw new Error(`RATE_LIMITED:${label}`);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? `API error ${response.status}`
    );
  }

  return response.json() as Promise<DeconstructResult>;
}

// ─── MARKDOWN PARSING ─────────────────────────────────────────────────────────

/** Split teardown markdown into named sections keyed by ## heading */
export function parseTeardownSections(markdown: string): TeardownSection[] {
  const sections: TeardownSection[] = [];
  const lines = markdown.split("\n");
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          content: currentLines.join("\n").trim(),
        });
      }
      currentTitle = line.replace(/^## /, "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle) {
    sections.push({
      title: currentTitle,
      content: currentLines.join("\n").trim(),
    });
  }

  return sections;
}
