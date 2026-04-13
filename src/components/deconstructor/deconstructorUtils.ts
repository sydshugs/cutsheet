// src/components/deconstructor/deconstructorUtils.ts — Shared utilities and constants

import type { CSSProperties } from "react";
import type { SourceType, DeconstructResult } from "../../lib/deconstructorService";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const SOURCE_COLORS: Record<SourceType, string> = {
  meta: "#1877F2",
  tiktok: "#69C9D0",
  youtube: "#FF0000",
};

/** API teardown heading for the brief block */
export const BRIEF_TITLE = "Your Brief";
/** Figma (263-124 / 263-535) label */
export const BRIEF_DISPLAY_TITLE = "Your Steal-This Brief";

export const BRIEF_SECTION_TITLES = new Set<string>([BRIEF_TITLE, BRIEF_DISPLAY_TITLE]);

export const SOURCE_PLATFORMS: { type: SourceType; label: string }[] = [
  { type: "meta", label: "Meta Ad Library" },
  { type: "tiktok", label: "TikTok Creative Center" },
  { type: "youtube", label: "YouTube" },
];

// ─── PILL STYLES ──────────────────────────────────────────────────────────────

export function sourcePillStyle(source: SourceType): CSSProperties {
  const c = SOURCE_COLORS[source];
  return {
    background: `${c}14`,
    borderColor: `${c}33`,
    color: c,
  };
}

/** Figma 263-525 — left-rail platform pill (TikTok mint, Meta/YouTube tuned) */
export function resultsRailSourcePillStyle(source: SourceType): CSSProperties {
  switch (source) {
    case "tiktok":
      return {
        background: "rgba(0, 187, 167, 0.1)",
        borderColor: "rgba(0, 187, 167, 0.2)",
        color: "#5eead4",
      };
    case "meta":
      return {
        background: "rgba(24, 119, 242, 0.1)",
        borderColor: "rgba(24, 119, 242, 0.2)",
        color: "#60a5fa",
      };
    case "youtube":
      return {
        background: "rgba(239, 68, 68, 0.1)",
        borderColor: "rgba(239, 68, 68, 0.2)",
        color: "#f87171",
      };
    default:
      return sourcePillStyle(source);
  }
}

// ─── TIME PARSING ─────────────────────────────────────────────────────────────

export function parseMmSsToSeconds(token: string): number | null {
  const t = token.trim();
  const m = t.match(/^(\d+):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function formatSecondsAsMmSs(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Parse e.g. "The Hook (0:00 - 0:03)" → start/end seconds */
export function parseHookRangeFromTitle(title: string): {
  startSec: number;
  endSec: number;
  labelStart: string;
  labelEnd: string;
} | null {
  const match = title.match(/hook\s*\(([^)]+)\)/i);
  if (!match) return null;
  const inner = match[1];
  const parts = inner.split(/\s*[-–—]\s*/).map((p) => p.trim());
  if (parts.length < 2) return null;
  const startSec = parseMmSsToSeconds(parts[0]);
  const endSec = parseMmSsToSeconds(parts[1]);
  if (startSec == null || endSec == null) return null;
  return {
    startSec,
    endSec,
    labelStart: parts[0],
    labelEnd: parts[1],
  };
}

export function parseTotalDurationSeconds(raw: string): number | null {
  const t = raw.trim();
  if (!t || t === "—") return null;
  const colon = parseMmSsToSeconds(t);
  if (colon != null) return colon;
  const sec = t.match(/^(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?$/i);
  if (sec) return Math.round(parseFloat(sec[1]));
  return null;
}

// ─── CREATIVE FOOTER META ─────────────────────────────────────────────────────

/** Figma results — left rail footer (placement · aspect · duration) */
export function creativeFooterMeta(result: DeconstructResult): {
  placement: string;
  aspect: string;
  duration: string;
} {
  const placement =
    result.sourceType === "meta"
      ? "Feed / Reels"
      : result.sourceType === "tiktok"
        ? "TikTok"
        : "YouTube";
  const aspect = result.sourceType === "youtube" ? "16:9 Video" : "9:16 Video";
  const g = result.gemini;
  const duration =
    typeof g?.duration === "string"
      ? (g.duration as string)
      : typeof g?.videoLength === "string"
        ? (g.videoLength as string)
        : "—";
  return { placement, aspect, duration };
}

// ─── FIGMA 263-538 — right-rail section helpers ──────────────────────────────

export function isPacingSectionTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    (t.includes("pacing") || t.includes("composition")) && !t.includes("hook")
  );
}

export function parsePacingMetricsFromMarkdown(md: string): {
  avgDisplay: string | null;
  momentum: string | null;
} {
  const text = md.replace(/\*\*/g, "");
  let avgDisplay: string | null = null;
  const patterns = [
    /(\d+(?:\.\d+)?)\s*s(?:ec(?:onds?)?)?\s+(?:avg|average)\s+scene/i,
    /(?:avg|average)\s+scene\s+(?:length\s*)?[:(]?\s*(\d+(?:\.\d+)?)\s*s\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      avgDisplay = `${m[1]}s`;
      break;
    }
  }
  const mom = text.match(/\bmomentum\s*[:\s]+\s*(high|medium|low)\b/i);
  const momentum = mom
    ? `${mom[1].charAt(0).toUpperCase()}${mom[1].slice(1).toLowerCase()}`
    : null;
  return { avgDisplay, momentum };
}

export function stripPacingMetricLines(md: string): string {
  return md
    .split("\n")
    .filter((line) => {
      const t = line.replace(/\*\*/g, "");
      if (/\bmomentum\s*[:\s]+\s*(high|medium|low)\b/i.test(t)) return false;
      if (
        /(\d+(?:\.\d+)?)\s*s\b.*(avg|average)\s+scene/i.test(t) ||
        /(avg|average)\s+scene.*(\d+(?:\.\d+)?)\s*s/i.test(t)
      )
        return false;
      return true;
    })
    .join("\n")
    .trim();
}

export function isMessagingSectionTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes("messaging") ||
    t.includes("copywriting") ||
    (t.includes("copy") && !t.includes("copyright"))
  );
}

export function splitMessagingCoreClaim(md: string): {
  callout: { quote: string } | null;
  rest: string;
} {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const plain = lines[i].replace(/\*\*/g, "").trim();
    const m =
      plain.match(/^[-*•]\s*core claim\s*:?\s*(.+)$/i) ||
      plain.match(/^core claim\s*:?\s*(.+)$/i);
    if (m) {
      const quote = m[1].replace(/^["'""'']|["'""'']$/g, "").trim();
      const rest = [...lines.slice(0, i), ...lines.slice(i + 1)]
        .join("\n")
        .trim();
      return { callout: quote ? { quote } : null, rest };
    }
  }
  return { callout: null, rest: md };
}
