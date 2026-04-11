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

/** H2, or lone H1 (some models use `# Section` instead of `##`). Never `###`. */
function parseSectionHeadingLine(line: string): string | null {
  if (/^###\s/.test(line) || /^####/.test(line)) return null;
  const m = line.match(/^#{1,2}\s+(.+)$/);
  return m ? m[1].trim() : null;
}

/** Remove leading ``` / ```markdown … ``` wrapper if the model fenced the report */
function stripOuterCodeFence(text: string): string {
  let t = text.trim();
  if (!t.startsWith("```")) return text.trim();
  const firstNl = t.indexOf("\n");
  if (firstNl === -1) return text.trim();
  t = t.slice(firstNl + 1);
  const close = t.lastIndexOf("```");
  if (close !== -1) t = t.slice(0, close);
  return t.trim();
}

/** True if this ## title is the executive-summary block */
export function isWhyThisAdWorksTitle(title: string): boolean {
  const t = title.trim().toLowerCase().replace(/\s+/g, " ");
  return t === "why this ad works" || t.startsWith("why this ad works:");
}

/** True if this ## title is the creative-brief block (case/spacing tolerant) */
export function matchesBriefHeading(
  title: string,
  canonical: ReadonlySet<string>,
): boolean {
  const n = title.trim().toLowerCase().replace(/\s+/g, " ");
  for (const c of canonical) {
    if (c.toLowerCase().replace(/\s+/g, " ") === n) return true;
  }
  return (
    n === "your brief" ||
    (n.includes("steal") && n.includes("brief"))
  );
}

/**
 * Split teardown markdown into ## sections.
 * Tolerates ## without a single space, preamble before the first ##, and ``` fences.
 * If no H2 headings are found, returns one section so the UI never renders empty.
 */
export function parseTeardownSections(markdown: string): TeardownSection[] {
  const md = stripOuterCodeFence(markdown);
  if (!md) return [];

  const lines = md.split("\n");
  const sections: TeardownSection[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];
  const orphan: string[] = [];
  let isFirstClosedSection = true;

  for (const line of lines) {
    const headingTitle = parseSectionHeadingLine(line);
    if (headingTitle !== null) {
      if (currentTitle) {
        let content = currentLines.join("\n").trim();
        if (isFirstClosedSection && orphan.length) {
          const pre = orphan.join("\n").trim();
          orphan.length = 0;
          if (pre) content = pre + (content ? `\n\n${content}` : "");
        }
        if (isFirstClosedSection) isFirstClosedSection = false;
        sections.push({ title: currentTitle, content });
        currentLines = [];
      }
      currentTitle = headingTitle;
    } else if (!currentTitle) {
      orphan.push(line);
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle) {
    let content = currentLines.join("\n").trim();
    if (isFirstClosedSection && orphan.length) {
      const pre = orphan.join("\n").trim();
      if (pre) content = pre + (content ? `\n\n${content}` : "");
    }
    sections.push({ title: currentTitle, content });
  } else if (orphan.length) {
    const body = orphan.join("\n").trim();
    if (body) sections.push({ title: "Full report", content: body });
  }

  if (sections.length === 0) {
    return [{ title: "Full report", content: md }];
  }

  return sections;
}
