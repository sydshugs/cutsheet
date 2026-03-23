import { cn } from "@/src/lib/utils";
import { Wand2, Copy, ArrowUp, Sparkles, MessageSquare, Clapperboard } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
}

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

function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        ...style,
      }}
      className={cn("p-4", className)}
    >
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function FixItPanel({ result, onCopyAll }: FixItPanelProps) {
  const handleCopyAll = async () => {
    const text = buildPlainText(result);
    await navigator.clipboard.writeText(text);
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
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 size={20} style={{ color: "var(--accent)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
              Your Rewrite
            </h2>
          </div>
          <button
            onClick={handleCopyAll}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
              "transition-colors cursor-pointer",
            )}
            style={{
              background: "var(--surface-el)",
              color: "var(--ink-muted)",
              border: "1px solid var(--border)",
            }}
          >
            <Copy size={14} />
            Copy All
          </button>
        </div>

        {/* ── Rewritten Hook ─────────────────────────────────────── */}
        <Card style={{ borderColor: "var(--score-excellent-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} style={{ color: "var(--success)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--success)" }}>
              Rewritten Hook
            </span>
          </div>
          <p className="text-base leading-relaxed" style={{ color: "var(--ink)" }}>
            {result.rewrittenHook.copy}
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
            {result.rewrittenHook.reasoning}
          </p>
        </Card>

        {/* ── Revised Body ───────────────────────────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Revised Body
            </span>
          </div>
          {/* Content sourced from our Claude API response, not user input */}
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--ink-muted)" }}
            dangerouslySetInnerHTML={{ __html: renderBold(result.revisedBody) }}
          />
        </Card>

        {/* ── New CTA ────────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              New CTA
            </span>
          </div>
          <p className="text-base font-medium" style={{ color: "var(--ink)" }}>
            {result.newCTA.copy}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--ink-muted)" }}>
            Placement: {result.newCTA.placement}
          </p>
        </Card>

        {/* ── Text Overlays (conditional) ────────────────────────── */}
        {result.textOverlays.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Clapperboard size={16} style={{ color: "var(--accent)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                Text Overlays
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ color: "var(--ink-muted)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left pb-2 pr-4 font-medium text-xs" style={{ color: "var(--ink-faint)" }}>
                      Timestamp
                    </th>
                    <th className="text-left pb-2 pr-4 font-medium text-xs" style={{ color: "var(--ink-faint)" }}>
                      Copy
                    </th>
                    <th className="text-left pb-2 font-medium text-xs" style={{ color: "var(--ink-faint)" }}>
                      Placement
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.textOverlays.map((overlay, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-2 pr-4 font-mono text-xs">{overlay.timestamp}</td>
                      <td className="py-2 pr-4">{overlay.copy}</td>
                      <td className="py-2 text-xs">{overlay.placement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Predicted Improvements ─────────────────────────────── */}
        {result.predictedImprovements.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUp size={16} style={{ color: "var(--success)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                Predicted Improvements
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {result.predictedImprovements.map((imp, i) => (
                <div
                  key={i}
                  className="py-3 px-4 rounded-lg"
                  style={{ background: "var(--surface-el)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                      {imp.dimension}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-mono" style={{ color: "var(--ink-muted)" }}>
                        {imp.oldScore}
                      </span>
                      <ArrowUp size={12} style={{ color: "var(--success)" }} />
                      <span className="text-sm font-mono font-semibold" style={{ color: "var(--success)" }}>
                        {imp.newScore}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed m-0" style={{ color: "var(--ink-faint)" }}>
                    {imp.reason}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Editor Notes ───────────────────────────────────────── */}
        {result.editorNotes.length > 0 && (
          <Card style={{ background: "var(--surface-dim)" }}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} style={{ color: "var(--ink-muted)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--ink-muted)" }}>
                Editor Notes
              </span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {result.editorNotes.map((note, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--ink-muted)" }}>
                  <span style={{ color: "var(--ink-faint)" }} className="mt-0.5">
                    &bull;
                  </span>
                  {note}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
