import { useState, useCallback } from "react";
import { X, Shield, AlertTriangle, CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { SafeZonePreview } from "./SafeZonePreview";

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
// Each platform has organic and paid variants; paid always clears more bottom space.
export const SAFE_ZONE_CONFIG = {
  tiktok: {
    organic: { top: 131, bottom: 370, left: 120, right: 140 }, // right updated Jan 2026 (+20px Add to Playlist)
    paid:    { top: 131, bottom: 420, left: 120, right: 140 },
  },
  instagram_reels: {
    organic: { top: 108, bottom: 370, left: 60, right: 120 }, // bottom updated late 2025 (+50px audio bar)
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
    organic: { top: 108, bottom: 370, left: 60, right: 120 }, // unified with IG Reels March 2026
    paid:    { top: 108, bottom: 400, left: 60, right: 120 },
  },
  universal: {
    organic: { top: 260, bottom: 260, left: 90, right: 90 },
    paid:    { top: 260, bottom: 310, left: 90, right: 90 },
  },
} as const;

// Per-platform placement tips — reference updated 2026 pixel values
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

// Map modal platform keys → API's platform keys (API uses legacy short-form keys)
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

// ─── PROPS ───────────────────────────────────────────────────────────────────

interface SafeZoneModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Image source for preview + AI detection — accepts blob URL (images) or
   * data URL (video thumbnails). Converted to base64 client-side before
   * sending to the API so both formats work correctly.
   */
  thumbnailSrc?: string;
  /** Whether this is organic or paid content — affects AI prompt context */
  mode?: "organic" | "paid";
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function SafeZoneModal({ open, onClose, thumbnailSrc, mode = "paid" }: SafeZoneModalProps) {
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("tiktok");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handlePlatformChange = useCallback((platform: PlatformKey) => {
    setActivePlatform(platform);
    // Reset AI results when switching platforms — different safe zones
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

      // Convert thumbnailSrc (blob URL or data URL) to pure base64.
      // fetch() works for both blob: and data: URLs in the browser.
      const fetchedBlob = await fetch(thumbnailSrc).then((r) => r.blob());
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URL prefix (data:image/jpeg;base64,) to get raw base64
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
          mode,
        }),
      });
      const data = await res.json() as AIResult & { error?: string };
      if (!res.ok) {
        setAiError(data.error ?? "Analysis failed");
      } else {
        setAiResult(data);
      }
    } catch {
      setAiError("Network error — please try again");
    } finally {
      setAiLoading(false);
    }
  }, [thumbnailSrc, activePlatform, mode]);

  if (!open) return null;

  // Pick dims from the 2026 config based on active platform + mode
  const dims = SAFE_ZONE_CONFIG[activePlatform][mode];
  const tips = PLATFORM_TIPS[activePlatform];
  const platformLabel = PLATFORMS.find((p) => p.key === activePlatform)?.label ?? activePlatform;

  // Convert pixel dims to percentages for SafeZonePreview (which uses % not px)
  const safeZonePct = {
    top: (dims.top / 1920) * 100,
    bottom: (dims.bottom / 1920) * 100,
    left: (dims.left / 1080) * 100,
    right: (dims.right / 1080) * 100,
  };

  // Risk level styling
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Safe Zone Check"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] shadow-2xl"
        style={{ background: 'var(--surface, #18181b)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)' }}
            >
              <Shield size={16} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Safe Zone Check</h2>
              <p className="text-[11px] text-zinc-500">Red zones = platform UI overlap risk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close safe zone modal"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Platform tabs */}
        <div className="px-6 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePlatformChange(p.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                  activePlatform === p.key
                    ? "text-white"
                    : "text-zinc-400 border border-white/[0.06]"
                )}
                style={
                  activePlatform === p.key
                    ? { background: 'var(--accent, #6366f1)' }
                    : { background: 'rgba(255,255,255,0.04)' }
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col md:flex-row gap-6">
          {/* Phone frame preview — polished v0 SafeZonePreview */}
          <div className="shrink-0">
            <SafeZonePreview
              imageUrl={thumbnailSrc ?? ""}
              platform={activePlatform}
              mode={mode}
              safeZoneConfig={safeZonePct}
            />

            {/* AI Check button — only shown when image is available */}
            {thumbnailSrc && (
              <button
                type="button"
                onClick={handleCheckWithAI}
                disabled={aiLoading}
                aria-label="Check this creative for safe zone violations using AI"
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  border: '0.5px solid rgba(99,102,241,0.3)',
                  color: '#818cf8',
                }}
                onMouseEnter={(e) => { if (!aiLoading) e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <Sparkles size={11} />
                    Check with AI
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tips + warning */}
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="text-xs font-semibold text-zinc-200 mb-4">
              {platformLabel} — {mode === "paid" ? "Paid" : "Organic"}
            </h3>

            <div className="space-y-3 mb-5">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={13}
                    className="shrink-0 mt-0.5"
                    style={{ color: '#10b981' }}
                  />
                  <span className="text-[12px] text-zinc-400 leading-[1.55] break-words min-w-0">{tip}</span>
                </div>
              ))}
            </div>

            {/* Warning callout */}
            <div
              className="mt-auto rounded-xl p-3.5 flex items-start gap-2.5"
              style={{
                background: 'rgba(239,68,68,0.05)',
                border: '0.5px solid rgba(239,68,68,0.15)',
              }}
            >
              <AlertTriangle size={13} className="shrink-0 mt-0.5 text-red-400" />
              <p className="text-[11px] text-zinc-500 leading-[1.55]">
                Content placed in red zones risks being hidden by platform UI elements — navigation bars, action buttons, captions, and system indicators. Always verify on a real device before publishing.
              </p>
            </div>
          </div>
        </div>

        {/* ── AI Results section ─────────────────────────────────────────────── */}
        {(aiResult || aiError) && (
          <div className="px-6 pb-6">
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
              {/* Results header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={12} style={{ color: '#818cf8' }} />
                  <span className="text-[11px] font-semibold text-zinc-300">AI Detection Results</span>
                </div>
                {aiResult && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: riskStyle.bg, border: `0.5px solid ${riskStyle.border}`, color: riskStyle.text }}
                  >
                    {riskStyle.label}
                  </span>
                )}
              </div>

              {/* Error state */}
              {aiError && (
                <div className="flex items-start gap-2.5 px-4 py-3">
                  <XCircle size={13} className="shrink-0 mt-0.5 text-red-400" />
                  <p className="text-[12px] text-zinc-400">{aiError}</p>
                </div>
              )}

              {/* No issues */}
              {aiResult && aiResult.issues.length === 0 && (
                <div className="flex items-center gap-2.5 px-4 py-4">
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} className="shrink-0" />
                  <p className="text-[12px] text-zinc-300 font-medium">All key elements are within the safe zone.</p>
                </div>
              )}

              {/* Issues list */}
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
                          <span className="text-[11px] font-medium text-zinc-200 truncate">{issue.element}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-1">{issue.location}</p>
                        <p className="text-[11px] text-zinc-400">
                          <span className="text-zinc-500 mr-1">Fix:</span>
                          {issue.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Safe elements */}
              {aiResult && aiResult.safe_elements.length > 0 && (
                <div
                  className="px-4 py-3"
                  style={{ borderTop: '0.5px solid rgba(255,255,255,0.04)' }}
                >
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2 font-medium">Correctly placed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.safe_elements.map((el, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-zinc-400 px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '0.5px solid rgba(16,185,129,0.2)' }}
                      >
                        ✓ {el}
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
  );
}
