import { useState, useCallback } from "react";
import { X, Shield, AlertTriangle, CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { SafeZonePlatformChrome } from "./SafeZonePlatformChrome";

const PLATFORMS = [
  { key: "tiktok",            label: "TikTok" },
  { key: "instagram_reels",   label: "IG Reels" },
  { key: "instagram_stories", label: "IG Stories" },
  { key: "youtube_shorts",    label: "YT Shorts" },
  { key: "facebook_reels",    label: "FB Reels" },
  { key: "universal",         label: "Universal" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

// 2026 safe zone specs — pixel values on a 1080×1920 (9:16) canvas.
export const SAFE_ZONE_CONFIG = {
  tiktok: {
    organic: { top: 131, bottom: 370, left: 120, right: 140 },
    paid:    { top: 131, bottom: 420, left: 120, right: 140 },
  },
  instagram_reels: {
    organic: { top: 108, bottom: 370, left: 60, right: 120 },
    paid:    { top: 108, bottom: 400, left: 60, right: 120 },
  },
  instagram_stories: {
    organic: { top: 250, bottom: 250, left: 60, right: 60 },
    paid:    { top: 250, bottom: 250, left: 60, right: 60 },
  },
  youtube_shorts: {
    organic: { top: 160, bottom: 480, left: 120, right: 120 },
    paid:    { top: 160, bottom: 520, left: 120, right: 120 },
  },
  facebook_reels: {
    organic: { top: 108, bottom: 370, left: 60, right: 120 },
    paid:    { top: 108, bottom: 400, left: 60, right: 120 },
  },
  universal: {
    organic: { top: 260, bottom: 260, left: 90, right: 90 },
    paid:    { top: 260, bottom: 310, left: 90, right: 90 },
  },
} as const;

// Per-platform placement tips — 2026 pixel values
const PLATFORM_TIPS: Record<PlatformKey, string[]> = {
  tiktok: [
    "Top 131px: status bar, live indicator, and back button",
    "Bottom 370px organic / 420px paid: comment row, action bar, and expanded caption",
    "Right 140px: like, comment, share, and Add to Playlist icons (updated Jan 2026)",
    "Left 120px: for-you/following toggle and profile avatar",
  ],
  instagram_reels: [
    "Top 108px: back button and reel progress indicators",
    "Bottom 370px organic / 400px paid: username, caption, audio bar (expanded late 2025), and engagement row",
    "Right 120px: like, comment, share, save, and audio icons",
    "Left 60px: margin for safe framing and touch targets",
  ],
  instagram_stories: [
    "Top 250px: story progress bar, header, and close/profile button",
    "Bottom 250px: reply field and swipe-up / link sticker gesture area",
    "60px left and right margins for touch targets and sticker placement safety",
    "Keep all CTAs and key copy centered vertically within the safe zone",
  ],
  youtube_shorts: [
    "Top 160px: system UI, search bar, and Shorts navigation",
    "Bottom 480px organic / 520px paid: title, channel info, actions, and Subscribe button",
    "120px left and right margins for action column and safe framing",
    "Center product shots and hook text vertically in the safe zone",
  ],
  facebook_reels: [
    "Top 108px: system UI and back button",
    "Bottom 370px organic / 400px paid: creator info, caption, and engagement row (unified with IG Reels, March 2026)",
    "Right 120px: like, comment, share, and save icons",
    "Left 60px: margin for safe framing",
  ],
  universal: [
    "These margins cover the strictest requirements across all six platforms",
    "Top 260px / Bottom 310px paid — safest choice when one creative runs everywhere",
    "90px left and right margins ensure safety on every major placement",
    "Never place text, faces, logos, or CTAs outside the green border",
  ],
};

// Platform update notes (amber callout)
const PLATFORM_UPDATES: Record<PlatformKey, string> = {
  tiktok:            "Add to Playlist icon added to right rail (Jan 2026) — right margin increased from 120px to 140px.",
  instagram_reels:   "Audio bar expanded in late 2025 — bottom margin increased from 320px to 370px organic.",
  instagram_stories: "Story UI unchanged since 2024 — specs remain stable at 250px top and bottom.",
  youtube_shorts:    "Shorts redesign (Q4 2025) added persistent search bar — top margin updated from 140px to 160px.",
  facebook_reels:    "Unified with IG Reels specs in March 2026 — same margins now apply across both placements.",
  universal:         "Universal margins cover all platforms. When in doubt, use these for cross-platform campaigns.",
};

// Map modal platform keys → API platform keys
const API_PLATFORM_MAP: Record<PlatformKey, string> = {
  tiktok:            "tiktok",
  instagram_reels:   "ig_reels",
  instagram_stories: "ig_stories",
  youtube_shorts:    "yt_shorts",
  facebook_reels:    "fb_reels",
  universal:         "universal",
};

// ─── AI RESULT TYPES ─────────────────────────────────────────────────────────

interface AIIssue {
  severity: "critical" | "warning";
  element: string;
  location: string;
  fix: string;
}

interface AIResult {
  issues: AIIssue[];
  safe_elements: string[];
  overall_risk: string;
}

// ─── PHONE PREVIEW ───────────────────────────────────────────────────────────

// Safe zone percentages derived from 1080×1920 pixel values
function toSafeZonePct(dims: { top: number; bottom: number; left: number; right: number }) {
  return {
    top:    (dims.top    / 1920) * 100,
    bottom: (dims.bottom / 1920) * 100,
    left:   (dims.left   / 1080) * 100,
    right:  (dims.right  / 1080) * 100,
  };
}

function PhoneMockup({ imageUrl, platform, mode }: { imageUrl: string; platform: PlatformKey; mode: "organic" | "paid" }) {
  const dims = SAFE_ZONE_CONFIG[platform][mode];
  const pct = toSafeZonePct(dims);

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[260px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-xl">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Ad creative"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-zinc-600">No image</span>
        </div>
      )}

      {pct.top > 0 && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 bg-red-500/20"
          style={{ height: `${pct.top}%` }}
        />
      )}
      {pct.bottom > 0 && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 bg-red-500/20"
          style={{ height: `${pct.bottom}%` }}
        />
      )}
      {/* Side danger bands: inset vertically so they do not stack on top/bottom strips (matches Figma mock) */}
      {pct.right > 0 && (
        <div
          className="pointer-events-none absolute right-0 bg-red-500/20"
          style={{
            top: `${pct.top}%`,
            bottom: `${pct.bottom}%`,
            width: `${pct.right}%`,
          }}
        />
      )}
      {pct.left > 0 && (
        <div
          className="pointer-events-none absolute left-0 bg-red-500/20"
          style={{
            top: `${pct.top}%`,
            bottom: `${pct.bottom}%`,
            width: `${pct.left}%`,
          }}
        />
      )}

      <div
        className="pointer-events-none absolute rounded-sm border-2 border-dashed border-emerald-500/80"
        style={{
          top: `${pct.top}%`,
          bottom: `${pct.bottom}%`,
          left: `${pct.left}%`,
          right: `${pct.right}%`,
        }}
      />

      <SafeZonePlatformChrome platform={platform} />
    </div>
  );
}

// ─── PROPS ───────────────────────────────────────────────────────────────────

interface SafeZoneModalProps {
  open: boolean;
  onClose: () => void;
  thumbnailSrc?: string;
  mode?: "organic" | "paid";
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function SafeZoneModal({ open, onClose, thumbnailSrc, mode = "paid" }: SafeZoneModalProps) {
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("tiktok");
  const [activeMode, setActiveMode] = useState<"organic" | "paid">(mode);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handlePlatformChange = useCallback((platform: PlatformKey) => {
    setActivePlatform(platform);
    setAiResult(null);
    setAiError(null);
  }, []);

  const handleModeChange = useCallback((m: "organic" | "paid") => {
    setActiveMode(m);
    setAiResult(null);
    setAiError(null);
  }, []);

  const handleCheckWithAI = useCallback(async () => {
    if (!thumbnailSrc) return;
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setAiError("Not authenticated — please sign in");
        return;
      }

      const fetchedBlob = await fetch(thumbnailSrc).then((r) => r.blob());
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.replace(/^data:[^;]+;base64,/, ""));
        };
        reader.onerror = reject;
        reader.readAsDataURL(fetchedBlob);
      });

      const res = await fetch("/api/safe-zone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageData: base64,
          mimeType: fetchedBlob.type || "image/jpeg",
          platform: API_PLATFORM_MAP[activePlatform],
          mode: activeMode,
        }),
      });
      const data = await res.json() as AIResult & { error?: string };
      if (!res.ok) {
        setAiError(data.message ?? data.error ?? "Analysis failed");
      } else {
        setAiResult(data);
      }
    } catch (err) {
      console.error("[safe-zone] client error:", err);
      setAiError("Network error — please try again");
    } finally {
      setAiLoading(false);
    }
  }, [thumbnailSrc, activePlatform, activeMode]);

  if (!open) return null;

  const platformLabel = PLATFORMS.find((p) => p.key === activePlatform)?.label ?? activePlatform;
  const tips = PLATFORM_TIPS[activePlatform];
  const updateNote = PLATFORM_UPDATES[activePlatform];

  const riskStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    high:    { bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.25)',    text: '#f87171', label: 'High Risk' },
    medium:  { bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.25)',   text: '#fbbf24', label: 'Medium Risk' },
    low:     { bg: 'rgba(99,102,241,0.08)',   border: 'rgba(99,102,241,0.25)',   text: '#818cf8', label: 'Low Risk' },
    none:    { bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.25)',   text: '#34d399', label: 'No Issues' },
    unknown: { bg: 'rgba(255,255,255,0.04)',  border: 'rgba(255,255,255,0.08)',  text: '#a1a1aa', label: 'Unknown' },
  };

  const risk = aiResult?.overall_risk ?? 'unknown';
  const riskStyle = riskStyles[risk] ?? riskStyles.unknown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Safe Zone Check"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color:rgba(var(--accent-rgb),0.08)] bg-[color:rgba(var(--accent-rgb),0.12)]">
              <Shield size={16} className="text-[color:var(--accent-light)]" aria-hidden />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold leading-tight text-zinc-100">Safe Zone Check</h2>
              <span className="mt-0.5 text-[11px] text-zinc-500">Red zones = platform UI overlap risk</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close safe zone modal"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 active:opacity-90"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <div className="px-6 pb-2 pt-5">
            <div className="flex flex-wrap items-center gap-2 gap-y-2">
              {PLATFORMS.map((p) => {
                const isActive = activePlatform === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePlatformChange(p.key)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 active:opacity-90",
                      isActive
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "border border-white/[0.06] bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
              <div className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.04] p-0.5">
                {(["organic", "paid"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeChange(m)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 active:opacity-90",
                      activeMode === m
                        ? "bg-indigo-500 text-white"
                        : "text-zinc-400 hover:text-zinc-300",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 p-6 md:flex-row">
            <div className="flex w-full shrink-0 flex-col items-center md:w-[260px]">
              <PhoneMockup
                imageUrl={thumbnailSrc ?? ""}
                platform={activePlatform}
                mode={activeMode}
              />

              <div className="mt-4 flex w-full items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm border border-red-500/50 bg-red-500/20" />
                  <span className="text-[10px] text-zinc-600">Danger zone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-0 w-3 border-t-2 border-dashed border-emerald-500/80" />
                  <span className="text-[10px] text-zinc-600">Safe zone</span>
                </div>
              </div>

              {thumbnailSrc && (
                <button
                  type="button"
                  onClick={handleCheckWithAI}
                  disabled={aiLoading}
                  aria-label="Check this creative for safe zone violations using AI"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.10] py-2.5 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/[0.15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50 disabled:cursor-not-allowed disabled:opacity-50 active:opacity-90"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs font-semibold">Scanning</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} aria-hidden />
                      <span className="text-xs font-semibold">Check with AI</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-200">
                {platformLabel} Guidelines
              </h3>

              <div className="mb-6 flex flex-col gap-3.5">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={14}
                      className="mt-[2px] shrink-0 text-[color:var(--success)]"
                      aria-hidden
                    />
                    <p className="text-xs leading-relaxed text-zinc-400">{tip}</p>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3.5">
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0 text-[color:var(--warn)]"
                  aria-hidden
                />
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  <span className="font-medium text-zinc-400">Platform Update:</span> {updateNote}
                </p>
              </div>
            </div>
          </div>

          {(aiResult || aiError) && (
          <div className="px-6 pb-6">
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              {/* Results header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={12} style={{ color: '#818cf8' }} />
                  <span className="text-[11px] font-semibold text-[#d4d4d8]">AI Detection Results</span>
                </div>
                {aiResult && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: riskStyle.bg, border: `1px solid ${riskStyle.border}`, color: riskStyle.text }}
                  >
                    {riskStyle.label}
                  </span>
                )}
              </div>

              {aiError && (
                <div className="flex items-start gap-2.5 px-4 py-3">
                  <XCircle size={13} className="shrink-0 mt-0.5 text-red-400" />
                  <p className="text-[12px] text-[#9f9fa9]">{aiError}</p>
                </div>
              )}

              {aiResult && aiResult.issues.length === 0 && (
                <div className="flex items-center gap-2.5 px-4 py-4">
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} className="shrink-0" />
                  <p className="text-[12px] text-[#d4d4d8] font-medium">All key elements are within the safe zone.</p>
                </div>
              )}

              {aiResult && aiResult.issues.length > 0 && (
                <div className="divide-y divide-white/[0.04]">
                  {aiResult.issues.map((issue, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3">
                      <div
                        className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={
                          issue.severity === "critical"
                            ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
                            : { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }
                        }
                      >
                        {issue.severity === "critical" ? "!" : "~"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: issue.severity === "critical" ? '#f87171' : '#fbbf24' }}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-[11px] font-medium text-[#d4d4d8] truncate">{issue.element}</span>
                        </div>
                        <p className="text-[11px] text-[#71717b] mb-1">{issue.location}</p>
                        <p className="text-[11px] text-[#9f9fa9]">
                          <span className="text-[#71717b] mr-1">Fix:</span>
                          {issue.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {aiResult && aiResult.safe_elements.length > 0 && (
                <div className="border-t border-white/[0.04] px-4 py-3">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">Correctly placed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.safe_elements.map((el, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400"
                      >
                        <CheckCircle2 size={10} className="shrink-0" aria-hidden />
                        {el}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
