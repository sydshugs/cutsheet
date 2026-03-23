import { cn } from "@/src/lib/utils";
import { Wand2, Copy, Sparkles, MessageSquare, Layers, Check, Lightbulb, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface FixItResult {
  rewrittenHook: { copy: string; reasoning: string };
  revisedBody: string;
  newCTA: { copy: string; placement: string };
  textOverlays: { timestamp: string; copy: string; placement: string }[];
  predictedImprovements: { dimension: string; oldScore: number; newScore: number; reason: string }[];
  editorNotes: string[];
}

interface FixItPanelProps {
  result: FixItResult;
  onCopyAll?: () => void;
  /** "static" hides text overlays section, "video" shows timestamps */
  mediaType?: "static" | "video";
}

// ─── BRAND COLORS ───────────────────────────────────────────────────────────

const COLORS = {
  hook: { main: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.15)" },
  body: { main: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.15)" },
  cta: { main: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.15)" },
  overlay: { main: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.15)" },
  improvement: { main: "#14b8a6", bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.15)" },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Convert **bold** markdown to <strong> tags.
 *  Content is from our own Claude API — not user-supplied — so XSS is not a concern. */
function renderBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong style='color:var(--ink);font-weight:600'>$1</strong>");
}

function buildPlainText(result: FixItResult): string {
  const lines: string[] = [];

  lines.push("=== YOUR REWRITE ===\n");

  lines.push("## Rewritten Hook");
  lines.push(result.rewrittenHook.copy);
  lines.push(`Why: ${result.rewrittenHook.reasoning}\n`);

  lines.push("## Revised Body");
  lines.push(result.revisedBody.replace(/\*\*/g, "") + "\n");

  lines.push("## New CTA");
  lines.push(result.newCTA.copy);
  lines.push(`Placement: ${result.newCTA.placement}\n`);

  if (result.textOverlays.length > 0) {
    lines.push("## Text Overlays");
    result.textOverlays.forEach((o) => {
      lines.push(`  [${o.timestamp}] "${o.copy}" — ${o.placement}`);
    });
    lines.push("");
  }

  if (result.predictedImprovements.length > 0) {
    lines.push("## Predicted Improvements");
    result.predictedImprovements.forEach((p) => {
      lines.push(`  ${p.dimension}: ${p.oldScore} → ${p.newScore} (${p.reason})`);
    });
    lines.push("");
  }

  if (result.editorNotes.length > 0) {
    lines.push("## Editor Notes");
    result.editorNotes.forEach((n) => lines.push(`  • ${n}`));
  }

  return lines.join("\n");
}

// ─── CARD WRAPPER ───────────────────────────────────────────────────────────

function Card({ 
  children, 
  className, 
  style,
  accentColor,
}: { 
  children: React.ReactNode; 
  className?: string; 
  style?: React.CSSProperties;
  accentColor?: { main: string; bg: string; border: string };
}) {
  return (
    <div
      style={{
        background: accentColor?.bg || "rgba(255,255,255,0.02)",
        border: `1px solid ${accentColor?.border || "rgba(255,255,255,0.06)"}`,
        borderRadius: 14,
        ...style,
      }}
      className={cn("p-4", className)}
    >
      {children}
    </div>
  );
}

// ─── SECTION HEADER ─────────────────────────────────────────────────────────

function SectionHeader({ 
  icon: Icon, 
  label, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div 
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${color}15` }}
      >
        <Icon size={14} color={color} />
      </div>
      <span className="text-sm font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function FixItPanel({ result, onCopyAll, mediaType = "video" }: FixItPanelProps) {
  const [copied, setCopied] = useState(false);
  const isVideo = mediaType === "video";
  const showOverlays = isVideo && result.textOverlays.length > 0;

  const handleCopyAll = async () => {
    const text = buildPlainText(result);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopyAll?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)" }}
            >
              <Wand2 size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Your Rewrite
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isVideo ? "Video ad" : "Static ad"} • AI-optimized copy
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium transition-all cursor-pointer border"
            style={{
              background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
              borderColor: copied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)",
              color: copied ? "#10b981" : "#a1a1aa",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy All"}
          </button>
        </div>

        {/* ── Rewritten Hook ─────────────────────────────────────── */}
        <Card accentColor={COLORS.hook}>
          <SectionHeader icon={Lightbulb} label="Rewritten Hook" color={COLORS.hook.main} />
          <p className="text-[15px] leading-relaxed font-medium text-zinc-100 mb-3">
            {result.rewrittenHook.copy}
          </p>
          <div 
            className="px-3 py-2.5 rounded-lg text-xs leading-relaxed"
            style={{ background: "rgba(255,255,255,0.03)", color: "#a1a1aa" }}
          >
            <span className="font-medium text-zinc-400">Why: </span>
            {result.rewrittenHook.reasoning}
          </div>
        </Card>

        {/* ── Revised Body ───────────────────────────────────────── */}
        <Card accentColor={COLORS.body}>
          <SectionHeader icon={MessageSquare} label="Revised Body" color={COLORS.body.main} />
          {/* Content sourced from our Claude API response, not user input */}
          <div
            className="text-[13px] leading-[1.7] whitespace-pre-wrap text-zinc-300"
            dangerouslySetInnerHTML={{ __html: renderBold(result.revisedBody) }}
          />
        </Card>

        {/* ── New CTA ────────────────────────────────────────────── */}
        <Card accentColor={COLORS.cta}>
          <SectionHeader icon={ArrowRight} label="New CTA" color={COLORS.cta.main} />
          <div 
            className="inline-block px-4 py-2.5 rounded-lg mb-3"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <span className="text-[15px] font-semibold" style={{ color: "#fbbf24" }}>
              {result.newCTA.copy}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            <span className="font-medium text-zinc-400">Placement:</span> {result.newCTA.placement}
          </p>
        </Card>

        {/* ── Text Overlays (VIDEO ONLY) ────────────────────────── */}
        {showOverlays && (
          <Card accentColor={COLORS.overlay}>
            <SectionHeader icon={Layers} label="Text Overlays" color={COLORS.overlay.main} />
            <div className="flex flex-col gap-2">
              {result.textOverlays.map((overlay, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  {/* Timestamp badge */}
                  <div 
                    className="shrink-0 px-2.5 py-1.5 rounded-md font-mono text-xs font-semibold"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
                  >
                    {overlay.timestamp}
                  </div>
                  {/* Copy and placement */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-200 mb-1">
                      {overlay.copy}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {overlay.placement}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Predicted Improvements ─────────────────────────────── */}
        {result.predictedImprovements.length > 0 && (
          <Card accentColor={COLORS.improvement}>
            <SectionHeader icon={Sparkles} label="Predicted Improvements" color={COLORS.improvement.main} />
            <div className="flex flex-col gap-2.5">
              {result.predictedImprovements.map((imp, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium text-zinc-200">
                      {imp.dimension}
                    </span>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-sm font-mono px-2 py-0.5 rounded"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#71717a" }}
                      >
                        {imp.oldScore}
                      </span>
                      <ArrowRight size={14} className="text-zinc-600" />
                      <span 
                        className="text-sm font-mono font-semibold px-2 py-0.5 rounded"
                        style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf" }}
                      >
                        {imp.newScore}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed m-0 text-zinc-500">
                    {imp.reason}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Editor Notes ───────────────────────────────────────── */}
        {result.editorNotes.length > 0 && (
          <div 
            className="p-4 rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <MessageSquare size={12} className="text-zinc-500" />
              </div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Editor Notes
              </span>
            </div>
            <ul className="flex flex-col gap-2 pl-1">
              {result.editorNotes.map((note, i) => (
                <li key={i} className="text-[13px] flex items-start gap-2.5 text-zinc-400">
                  <span className="text-zinc-600 mt-1.5 text-[8px]">●</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
