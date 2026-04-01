import { useState, useCallback } from "react";
import { X, Shield, AlertTriangle, CheckCircle2, Loader2, Sparkles, XCircle, Wand2 } from "lucide-react";
import { supabase } from "../lib/supabase";

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
    <div
      className="relative overflow-hidden"
      style={{
        width: 285,
        aspectRatio: '9/16',
        background: '#18181b',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 17.5,
      }}
    >
      {/* Ad image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Ad creative"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.9 }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#3f3f46] text-xs font-medium">No image</span>
        </div>
      )}

      {/* Top danger zone */}
      {pct.top > 0 && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ height: `${pct.top}%`, background: 'rgba(251,44,54,0.2)' }}
        />
      )}

      {/* Bottom danger zone */}
      {pct.bottom > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: `${pct.bottom}%`, background: 'rgba(251,44,54,0.2)' }}
        />
      )}

      {/* Right danger zone */}
      {pct.right > 0 && (
        <div
          className="absolute top-0 bottom-0 right-0 pointer-events-none"
          style={{ width: `${pct.right}%`, background: 'rgba(251,44,54,0.2)' }}
        />
      )}

      {/* Left danger zone */}
      {pct.left > 0 && (
        <div
          className="absolute top-0 bottom-0 left-0 pointer-events-none"
          style={{ width: `${pct.left}%`, background: 'rgba(251,44,54,0.2)' }}
        />
      )}

      {/* Safe zone border */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: `${pct.top}%`,
          bottom: `${pct.bottom}%`,
          left: `${pct.left}%`,
          right: `${pct.right}%`,
          border: '2.2px dashed rgba(0,188,125,0.8)',
          borderRadius: 8.76,
        }}
      />
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
        setAiError(data.error ?? "Analysis failed");
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
        className="relative w-full max-h-[92vh] overflow-y-auto font-['Geist',sans-serif]"
        style={{
          maxWidth: 820,
          background: '#18181b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 17.5,
          boxShadow: '0px 27.4px 54.8px -13.1px rgba(0,0,0,0.25)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-[26px]"
          style={{ height: 75.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 35,
                height: 35,
                background: 'rgba(14,165,233,0.12)',
                border: '1px solid rgba(14,165,233,0.08)',
                borderRadius: 10,
              }}
            >
              <Shield size={15} style={{ color: '#38bdf8' }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h2
                className="font-semibold text-[#f4f4f5]"
                style={{ fontSize: 15.3, letterSpacing: -0.165 }}
              >
                Safe Zone Check
              </h2>
              <p className="text-[#71717b]" style={{ fontSize: 12 }}>
                Red zones = platform UI overlap risk
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close safe zone modal"
            className="flex items-center justify-center text-[#71717b] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            style={{
              width: 30.7,
              height: 30.7,
              borderRadius: 10,
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = '#d4d4d8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#71717b';
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Platform tabs + organic/paid toggle ── */}
        <div className="px-[26px] pt-[22px] pb-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const isActive = activePlatform === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePlatformChange(p.key)}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                  style={{
                    height: isActive ? 30.7 : 32.9,
                    padding: '0 14px',
                    borderRadius: 999,
                    fontSize: 13.1,
                    fontWeight: 500,
                    background: isActive ? '#615fff' : 'rgba(255,255,255,0.04)',
                    border: isActive ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    color: isActive ? '#fff' : '#9f9fa9',
                    boxShadow: isActive ? '0 1px 4px rgba(97,95,255,0.3)' : 'none',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Organic / Paid toggle */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-full shrink-0 ml-auto"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {(["organic", "paid"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className="px-3 py-1 rounded-full text-xs font-medium capitalize cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                style={
                  activeMode === m
                    ? { background: '#615fff', color: '#fff' }
                    : { background: 'transparent', color: '#9f9fa9' }
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="px-[26px] pb-[26px] flex flex-col md:flex-row gap-6">

          {/* Left: phone mockup + AI button */}
          <div className="shrink-0 flex flex-col gap-3">
            <PhoneMockup
              imageUrl={thumbnailSrc ?? ""}
              platform={activePlatform}
              mode={activeMode}
            />

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 13.1,
                    height: 13.1,
                    borderRadius: 8.76,
                    background: 'rgba(251,44,54,0.2)',
                    border: '1px solid rgba(251,44,54,0.5)',
                  }}
                />
                <span className="text-[#71717b]" style={{ fontSize: 11 }}>Danger zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 13.1,
                    height: 0,
                    borderTop: '2.2px dashed rgba(0,188,125,0.8)',
                  }}
                />
                <span className="text-[#71717b]" style={{ fontSize: 11 }}>Safe zone</span>
              </div>
            </div>

            {/* Check with AI button */}
            {thumbnailSrc && (
              <button
                type="button"
                onClick={handleCheckWithAI}
                disabled={aiLoading}
                aria-label="Check this creative for safe zone violations using AI"
                className="flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{
                  width: 285,
                  height: 41.6,
                  borderRadius: 26.3,
                  background: 'rgba(97,95,255,0.1)',
                  border: '1px solid rgba(97,95,255,0.3)',
                  color: '#a3b3ff',
                  fontSize: 13.1,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => { if (!aiLoading) e.currentTarget.style.background = 'rgba(97,95,255,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(97,95,255,0.1)'; }}
              >
                {aiLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <Wand2 size={13} />
                    Check with AI
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right: guidelines */}
          <div className="flex-1 flex flex-col min-w-0 gap-5">
            {/* Section title */}
            <span
              className="font-semibold text-[#e4e4e7] uppercase"
              style={{ fontSize: 13.1, letterSpacing: 0.33 }}
            >
              {platformLabel} Guidelines
            </span>

            {/* Tips */}
            <div className="flex flex-col gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2
                    size={15.3}
                    className="shrink-0 mt-0.5"
                    style={{ color: '#10b981' }}
                  />
                  <span className="text-[#9f9fa9] leading-[1.63]" style={{ fontSize: 13.1 }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>

            {/* Platform update callout — amber */}
            <div
              className="flex items-start gap-3 mt-auto"
              style={{
                background: 'rgba(254,154,0,0.05)',
                border: '1px solid rgba(254,154,0,0.2)',
                borderRadius: 26.3,
                padding: '17.5px',
              }}
            >
              <AlertTriangle
                size={15.3}
                className="shrink-0 mt-0.5"
                style={{ color: '#f59e0b' }}
              />
              <p className="text-[#71717b]" style={{ fontSize: 12 }}>
                <span className="font-semibold text-[#d4d4d8]">Platform Update: </span>
                {updateNote}
              </p>
            </div>
          </div>
        </div>

        {/* ── AI Results section ── */}
        {(aiResult || aiError) && (
          <div className="px-[26px] pb-[26px]">
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
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
                <div
                  className="px-4 py-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <p className="text-[10px] text-[#52525c] uppercase tracking-wider mb-2 font-medium">Correctly placed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.safe_elements.map((el, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-[#9f9fa9] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
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
