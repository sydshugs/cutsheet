import { cn } from "@/src/lib/utils";
import {
  Wand2,
  Copy,
  Sparkles,
  MessageSquare,
  MessageCircle,
  Layers,
  Check,
  Lightbulb,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";
import DOMPurify from "dompurify";
import { supabase } from "../lib/supabase";

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
  /** Return to scores / close embedded panel (e.g. right rail) */
  onClose?: () => void;
  /** Show amber priority-fix banner above the header */
  fromPriorityFix?: boolean;
  /** Body copy for the priority-fix banner */
  priorityFixText?: string;
  /** "static" hides text overlays section, "video" shows timestamps */
  mediaType?: "static" | "video";
  /** UUID of the saved analysis row in Supabase — used as FK in suggestion_feedback */
  analysisId?: string;
  platform?: string;
  niche?: string;
}

/** Section label + icon color pairs — match Figma node 228:589 / AIRewritePanel */
const SECTION = {
  accent: {
    icon: "text-[var(--accent-light)]",
    label: "text-[var(--accent-light)]",
  },
  amber: {
    icon: "text-[var(--warn)]",
    label: "text-[var(--warn)]",
  },
  muted: {
    icon: "text-zinc-500",
    label: "text-zinc-500",
  },
  overlay: {
    icon: "text-[var(--accent-light)]",
    label: "text-[var(--accent-light)]",
  },
} as const;

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

// ─── CARD WRAPPER (Figma: rounded-2xl neutral shell; CTA = amber border) ─────

function Card({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "cta";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        variant === "cta"
          ? "border border-amber-500/20 bg-amber-500/[0.04]"
          : "border border-white/[0.06] bg-white/[0.02]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── SECTION HEADER (Figma: icon + uppercase label, no tile) ───────────────

function SectionHeader({
  icon: Icon,
  label,
  iconClassName,
  labelClassName,
}: {
  icon: React.ElementType;
  label: string;
  iconClassName: string;
  labelClassName: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <Icon size={14} className={cn("shrink-0", iconClassName)} aria-hidden />
      <h3 className={cn("text-[10px] font-semibold uppercase tracking-wider", labelClassName)}>{label}</h3>
    </div>
  );
}

// ─── FEEDBACK ROW ───────────────────────────────────────────────────────────

interface FeedbackRowProps {
  analysisId?: string;
  suggestionType: string;
  suggestionIndex?: number;
  suggestionPreview: string;
  platform?: string;
  niche?: string;
}

function FeedbackRow({ analysisId, suggestionType, suggestionIndex = 0, suggestionPreview, platform, niche }: FeedbackRowProps) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  const handleVote = async (helpful: boolean) => {
    if (vote != null) return; // already voted
    setVote(helpful ? 'up' : 'down');
    const { error } = await supabase.from('suggestion_feedback').insert({
      analysis_id: analysisId ?? null,
      suggestion_type: suggestionType,
      suggestion_index: suggestionIndex,
      suggestion_preview: suggestionPreview.slice(0, 100),
      platform: platform ?? null,
      niche: niche ?? null,
      helpful,
    });
    if (error) console.warn('[FeedbackRow] insert failed:', error.message);
  };

  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 transition-opacity duration-200",
        vote == null ? "opacity-40 hover:opacity-100" : "opacity-100"
      )}
    >
      {vote == null ? (
        <>
          <button
            type="button"
            onClick={() => handleVote(true)}
            className={cn(
              "cursor-pointer rounded-lg border p-1.5 transition-colors",
              "border-white/[0.06] bg-transparent hover:bg-white/[0.04]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            )}
            aria-label="Mark helpful"
          >
            <ThumbsUp size={12} className="text-zinc-500 hover:text-[var(--success)]" />
          </button>
          <button
            type="button"
            onClick={() => handleVote(false)}
            className={cn(
              "cursor-pointer rounded-lg border p-1.5 transition-colors",
              "border-white/[0.06] bg-transparent hover:bg-white/[0.04]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            )}
            aria-label="Mark not helpful"
          >
            <ThumbsDown size={12} className="text-zinc-500 hover:text-[var(--error)]" />
          </button>
        </>
      ) : (
        <span className="text-[10px] text-zinc-600">Thanks</span>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const FixItPanel = memo(function FixItPanel({
  result,
  onCopyAll,
  onClose,
  fromPriorityFix = false,
  priorityFixText,
  mediaType = "video",
  analysisId,
  platform,
  niche,
}: FixItPanelProps) {
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
        className="flex w-full min-w-0 flex-col gap-3 font-[family-name:var(--sans)]"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="group flex w-fit cursor-pointer items-center gap-1.5 rounded text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <ChevronLeft size={12} className="transition-transform group-hover:-translate-x-0.5" aria-hidden />
            <span className="text-xs font-medium">Back to Scores</span>
          </button>
        )}

        {fromPriorityFix && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--warn)]" aria-hidden />
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold tracking-wider text-[var(--warn)]">
                FIXING PRIORITY ISSUE
              </p>
              {priorityFixText ? (
                <p className="text-xs leading-relaxed text-zinc-400">{priorityFixText}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Header — Figma 228:589 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)]">
              <Wand2 size={16} className="text-[var(--accent)]" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-tight text-zinc-100">Your Rewrite</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {isVideo ? "Video ad" : "Static ad"} · AI-optimized copy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyAll}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
              copied
                ? "border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]"
                : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300"
            )}
          >
            {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
            {copied ? "Copied!" : "Copy All"}
          </button>
        </div>

        {/* ── Rewritten Hook ─────────────────────────────────────── */}
        <Card>
          <SectionHeader
            icon={Lightbulb}
            label="Rewritten Hook"
            iconClassName={SECTION.accent.icon}
            labelClassName={SECTION.accent.label}
          />
          <p className="text-sm font-semibold leading-relaxed text-zinc-100">{result.rewrittenHook.copy}</p>
          <div className="mt-3 rounded-[12px] border border-white/[0.04] bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed">
            <span className="mr-1.5 font-medium text-zinc-500">Why:</span>
            <span className="text-zinc-400">{result.rewrittenHook.reasoning}</span>
          </div>
          <FeedbackRow
            analysisId={analysisId}
            suggestionType="hook"
            suggestionPreview={result.rewrittenHook.copy}
            platform={platform}
            niche={niche}
          />
        </Card>

        {/* ── Revised Body ───────────────────────────────────────── */}
        <Card>
          <SectionHeader
            icon={MessageSquare}
            label="Revised Body"
            iconClassName={SECTION.accent.icon}
            labelClassName={SECTION.accent.label}
          />
          {/* Content sourced from our Claude API response, not user input */}
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-200"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderBold(result.revisedBody)) }}
          />
          <FeedbackRow
            analysisId={analysisId}
            suggestionType="body"
            suggestionPreview={result.revisedBody}
            platform={platform}
            niche={niche}
          />
        </Card>

        {/* ── New CTA ────────────────────────────────────────────── */}
        <Card variant="cta">
          <SectionHeader
            icon={ArrowRight}
            label="New CTA"
            iconClassName={SECTION.amber.icon}
            labelClassName={SECTION.amber.label}
          />
          <p className="mb-2 text-base font-semibold text-zinc-100">{result.newCTA.copy}</p>
          <div className="text-xs">
            <span className="mr-1.5 font-medium text-zinc-500">Placement:</span>
            <span className="text-zinc-400">{result.newCTA.placement}</span>
          </div>
          <FeedbackRow
            analysisId={analysisId}
            suggestionType="cta"
            suggestionPreview={result.newCTA.copy}
            platform={platform}
            niche={niche}
          />
        </Card>

        {/* ── Text Overlays (VIDEO ONLY) ────────────────────────── */}
        {showOverlays && (
          <Card>
            <SectionHeader
              icon={Layers}
              label="Text Overlays"
              iconClassName={SECTION.overlay.icon}
              labelClassName={SECTION.overlay.label}
            />
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
          <Card>
            <SectionHeader
              icon={Sparkles}
              label="Predicted Improvements"
              iconClassName={SECTION.accent.icon}
              labelClassName={SECTION.muted.label}
            />
            <div className="flex flex-col gap-2">
              {result.predictedImprovements.map((imp, i) => (
                <div
                  key={i}
                  className="rounded-[12px] border border-white/[0.04] bg-white/[0.02] p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">{imp.dimension}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-600">{imp.oldScore}</span>
                      <ArrowRight size={10} className="text-zinc-600" aria-hidden />
                      <span className="text-xs font-semibold text-[var(--success)]">{imp.newScore}</span>
                    </div>
                  </div>
                  <p className="m-0 mt-1 text-xs leading-relaxed text-zinc-500">{imp.reason}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Editor Notes ───────────────────────────────────────── */}
        {result.editorNotes.length > 0 && (
          <Card>
            <SectionHeader
              icon={MessageCircle}
              label="Editor Notes"
              iconClassName={SECTION.muted.icon}
              labelClassName={SECTION.muted.label}
            />
            <div className="flex flex-col gap-2">
              {result.editorNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" aria-hidden />
                  <p className="text-xs leading-relaxed text-zinc-400">{note}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

export default FixItPanel;
