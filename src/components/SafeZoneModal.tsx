import { useState, useCallback } from "react";
import { X, Shield, AlertTriangle, CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";

const PLATFORMS = [
  { key: "tiktok", label: "TikTok" },
  { key: "ig_reels", label: "IG Reels" },
  { key: "ig_stories", label: "IG Stories" },
  { key: "yt_shorts", label: "YT Shorts" },
  { key: "fb_reels", label: "FB Reels" },
  { key: "universal", label: "Universal" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

interface SafeZone {
  topPct: number;
  bottomPct: number;
  rightPct: number;
  leftPct: number;
  label: string;
  tips: string[];
}

// All percentages based on a 1080×1920 (9:16) canvas
const SAFE_ZONE_CONFIG: Record<PlatformKey, SafeZone> = {
  tiktok: {
    topPct: 6.8,    // 130px / 1920
    bottomPct: 13.0, // 250px / 1920
    rightPct: 7.4,   // 80px / 1080
    leftPct: 0,
    label: "TikTok Safe Zone",
    tips: [
      "Keep text away from the top 130px (system UI & status bar)",
      "Leave the bottom 250px clear — captions & action buttons live here",
      "Avoid placing key visuals in the right 80px (like / comment / share icons)",
      "Hook copy performs best in the upper-middle area of the safe zone",
    ],
  },
  ig_reels: {
    topPct: 5.2,     // 100px / 1920
    bottomPct: 17.7, // 340px / 1920
    rightPct: 6.9,   // 75px / 1080
    leftPct: 0,
    label: "Instagram Reels Safe Zone",
    tips: [
      "Keep the top 100px clear of important content (back button & indicators)",
      "Bottom 340px is covered by username, caption, and engagement row",
      "Right 75px holds like, comment, share, and audio icons",
      "Place hook text in the center-upper third for maximum readability",
    ],
  },
  ig_stories: {
    topPct: 11.5,  // 220px / 1920
    bottomPct: 6.3, // 120px / 1920
    rightPct: 0,
    leftPct: 2.8,   // 30px / 1080
    label: "Instagram Stories Safe Zone",
    tips: [
      "Top 220px is occupied by story header bar and progress indicator",
      "Bottom 120px has the reply bar and swipe-up gesture area",
      "Leave a small left margin for touch targets and safe framing",
      "Keep CTAs and key copy centered vertically within the safe zone",
    ],
  },
  yt_shorts: {
    topPct: 6.3,    // 120px / 1920
    bottomPct: 15.6, // 300px / 1920
    rightPct: 7.4,   // 80px / 1080
    leftPct: 0,
    label: "YouTube Shorts Safe Zone",
    tips: [
      "Top 120px is reserved for system UI and back button",
      "Bottom 300px contains title, channel name, and engagement buttons",
      "Right 80px is covered by action icon column",
      "Center your product shots and key text within the safe zone",
    ],
  },
  fb_reels: {
    topPct: 6.3,    // 120px / 1920
    bottomPct: 15.6, // 300px / 1920
    rightPct: 7.4,   // 80px / 1080
    leftPct: 0,
    label: "Facebook Reels Safe Zone",
    tips: [
      "Top 120px is the system UI area",
      "Bottom 300px has caption text and engagement buttons",
      "Right 80px is reserved for like, comment, and share icons",
      "Center product shots and primary text for both feed and reels",
    ],
  },
  universal: {
    topPct: 11.5,   // Use the strictest top (IG Stories) = 220px
    bottomPct: 17.7, // Use the strictest bottom (IG Reels) = 340px
    rightPct: 7.4,   // Use the strictest right (TikTok/YT) = 80px
    leftPct: 2.8,    // Use the strictest left (IG Stories) = 30px
    label: "Universal Safe Zone (All Platforms)",
    tips: [
      "These margins ensure your content is safe across every major platform",
      "Use this when creating one creative that runs on multiple placements",
      "Never place text, faces, logos, or CTAs outside the green border",
      "This is the most conservative safe zone — ideal for cross-platform ads",
    ],
  },
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
  /** Base64-encoded image (no data URL prefix) for AI vision detection */
  imageData?: string;
  /** Whether this is organic or paid content — affects AI prompt context */
  mode?: "organic" | "paid";
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function SafeZoneModal({ open, onClose, imageData, mode = "paid" }: SafeZoneModalProps) {
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
    if (!imageData) return;
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setAiError("Not authenticated — please sign in");
        return;
      }
      const res = await fetch("/api/safe-zone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageData,
          mimeType: "image/jpeg",
          platform: activePlatform,
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
  }, [imageData, activePlatform, mode]);

  if (!open) return null;

  const config = SAFE_ZONE_CONFIG[activePlatform];

  // SVG viewBox — 1080×1920 (9:16)
  const VW = 1080;
  const VH = 1920;

  const topH = (config.topPct / 100) * VH;
  const bottomH = (config.bottomPct / 100) * VH;
  const rightW = (config.rightPct / 100) * VW;
  const leftW = (config.leftPct / 100) * VW;

  const safeX = leftW;
  const safeY = topH;
  const safeW = VW - leftW - rightW;
  const safeH = VH - topH - bottomH;

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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] shadow-2xl"
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
          {/* SVG preview — phone frame */}
          <div className="shrink-0 flex flex-col items-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2 font-medium">
              9:16 Preview
            </p>
            <div
              className="relative overflow-hidden rounded-xl border border-white/[0.08]"
              style={{ width: 180, height: 320 }}
            >
              {/* Phone background */}
              <div className="absolute inset-0 bg-zinc-950" />

              {/* Crosshatch fill to suggest content area */}
              <svg
                viewBox="0 0 180 320"
                width="180"
                height="320"
                className="absolute inset-0"
                style={{ display: 'block', opacity: 0.12 }}
              >
                <defs>
                  <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#ffffff" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="180" height="320" fill="url(#hatch)" />
              </svg>

              {/* Safe zone overlay */}
              <svg
                viewBox={`0 0 ${VW} ${VH}`}
                width="180"
                height="320"
                className="absolute inset-0"
                style={{ display: 'block' }}
                aria-label={`Safe zone overlay for ${config.label}`}
              >
                {/* Top danger zone */}
                {topH > 0 && (
                  <rect x={0} y={0} width={VW} height={topH} fill="rgba(239,68,68,0.4)" />
                )}
                {/* Bottom danger zone */}
                {bottomH > 0 && (
                  <rect x={0} y={VH - bottomH} width={VW} height={bottomH} fill="rgba(239,68,68,0.4)" />
                )}
                {/* Right danger zone */}
                {rightW > 0 && (
                  <rect
                    x={VW - rightW}
                    y={topH}
                    width={rightW}
                    height={VH - topH - bottomH}
                    fill="rgba(239,68,68,0.28)"
                  />
                )}
                {/* Left danger zone */}
                {leftW > 0 && (
                  <rect
                    x={0}
                    y={topH}
                    width={leftW}
                    height={VH - topH - bottomH}
                    fill="rgba(239,68,68,0.28)"
                  />
                )}

                {/* Safe zone border */}
                <rect
                  x={safeX}
                  y={safeY}
                  width={safeW}
                  height={safeH}
                  fill="none"
                  stroke="rgba(16,185,129,0.85)"
                  strokeWidth={28}
                  strokeDasharray="90 45"
                />

                {/* UI label — top zone */}
                {topH > 120 && (
                  <text
                    x={VW / 2}
                    y={topH / 2 + 24}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.55)"
                    fontSize={84}
                    fontFamily="system-ui, sans-serif"
                  >
                    UI
                  </text>
                )}
                {/* UI label — bottom zone */}
                {bottomH > 120 && (
                  <text
                    x={VW / 2}
                    y={VH - bottomH / 2 + 24}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.55)"
                    fontSize={84}
                    fontFamily="system-ui, sans-serif"
                  >
                    UI
                  </text>
                )}
              </svg>

              {/* Legend pill */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-2 py-0.5" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
                <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(239,68,68,0.7)' }} />
                <span className="text-[9px] text-zinc-400">Unsafe</span>
                <div className="w-2 h-2 rounded-sm border" style={{ borderColor: 'rgba(16,185,129,0.85)' }} />
                <span className="text-[9px] text-zinc-400">Safe</span>
              </div>
            </div>

            {/* AI Check button — only shown when image is available */}
            {imageData && (
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
            <h3 className="text-xs font-semibold text-zinc-200 mb-4">{config.label}</h3>

            <div className="space-y-3 mb-5">
              {config.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2
                    size={13}
                    className="shrink-0 mt-0.5"
                    style={{ color: '#10b981' }}
                  />
                  <span className="text-[12px] text-zinc-400 leading-[1.55]">{tip}</span>
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
