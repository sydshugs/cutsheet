import { useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { sanitizeFileName } from "../utils/sanitize";
import { Copy, FileDown, Share2, Anchor, MessageSquare, MousePointerClick, Clapperboard, DollarSign, Hash, Eye, Lightbulb, BarChart3, Heart, Layout, Target, Palette, FileText, type LucideIcon } from "lucide-react";
import { CollapsibleSection } from "./ui/CollapsibleSection";

interface ReportCardsProps {
  file: File | null;
  markdown: string;
  thumbnailDataUrl?: string;
  onCopy: () => void;
  onExportPdf: () => void;
  onShare: () => void;
  copied?: boolean;
  shareLoading?: boolean;
  onReset?: () => void;
  onFileSelect?: (file: File | null) => void;
}

const JSON_TITLE_RE = /json|scene|raw\s*data|budget\s*recommend/i;
// Sections already shown in ScoreCard — filter from left panel to avoid duplication
const SCORECARD_DUPLICATE_RE = /^(improve|hashtag|recommend.*hashtag|budget|predicted.*perform|quick.?score|score.?summary|overall.*score|overall.*strength)/i;
const JSON_CONTENT_RE = /^\s*[\[{]/;

// Hook-related section titles to merge into a single "Hook analysis" section
const HOOK_RE = /hook|opening|first.*(second|frame)|attention.*(grab|open)/i;

// Map section titles to Lucide icons (case-insensitive keyword match)
const SECTION_ICON_MAP: [RegExp, LucideIcon][] = [
  [/hook|opening|attention/i, Anchor],
  [/message|clarity|script|copy|messaging/i, MessageSquare],
  [/cta|call.to.action/i, MousePointerClick],
  [/production|visual|quality|creative/i, Clapperboard],
  [/budget|spend|cost/i, DollarSign],
  [/hashtag|tag/i, Hash],
  [/second.eye|review|audit/i, Eye],
  [/improve|recommend|suggest|tip/i, Lightbulb],
  [/score|overall|summary|performance/i, BarChart3],
  [/emotion|sentiment|feeling|tone|impact/i, Heart],
  [/structure|layout|hierarchy|flow/i, Layout],
  [/target|audience|persona|demographic/i, Target],
  [/brand|identity|style|design/i, Palette],
];

/** Fallback icon for sections that don't match any pattern */
const FALLBACK_ICON: LucideIcon = FileText;

function getIconForTitle(title: string): LucideIcon {
  for (const [re, Icon] of SECTION_ICON_MAP) {
    if (re.test(title)) return Icon;
  }
  return FALLBACK_ICON;
}

/** Strip emoji characters from a string */
function stripEmoji(s: string): string {
  return s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f]/gu, "").trim();
}

/** Sentence-case a title: "HOOK STRENGTH ANALYSIS" → "Hook strength analysis" */
function toSentenceCase(s: string): string {
  if (!s) return s;
  const clean = stripEmoji(s);
  if (!clean) return s;
  // If already mixed case (not ALL CAPS), leave it
  if (clean !== clean.toUpperCase()) return clean;
  return clean.charAt(0) + clean.slice(1).toLowerCase();
}

function splitMarkdown(md: string): { title: string | null; content: string }[] {
  const sections = md.split(/\n(?=## )/);
  return sections.map(section => {
    const match = section.match(/^## (.+)\n([\s\S]*)$/);
    if (match) return { title: match[1], content: match[2].trim() };
    return { title: null, content: section.trim() };
  }).filter(s => {
    if (!s.content) return false;
    // Filter out sections with JSON-related titles (SCENE JSON, Raw Data, etc.)
    if (s.title && JSON_TITLE_RE.test(s.title)) return false;
    // Filter out sections already displayed in ScoreCard (Improvements, Hashtags, Budget, etc.)
    if (s.title && SCORECARD_DUPLICATE_RE.test(stripEmoji(s.title))) return false;
    // Filter out sections whose content is raw JSON
    const trimmed = s.content.trim();
    if (JSON_CONTENT_RE.test(trimmed) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) return false;
    // Filter out sections that contain "scenes": [ ... ] pattern
    if (/"scenes"\s*:\s*\[/.test(trimmed)) return false;
    return true;
  });
}

export function ReportCards({ file, markdown, thumbnailDataUrl, onCopy, onExportPdf, onShare, copied, shareLoading, onReset, onFileSelect }: ReportCardsProps) {
  const isImage = file?.type.startsWith("image/") ?? false;
  const fileUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [fileUrl]);

  const sections = useMemo(() => splitMarkdown(markdown), [markdown]);

  // Merge hook-related sections into a single "Hook analysis" section
  const mergedSections = useMemo(() => {
    const hookSections: typeof sections = [];
    const otherSections: typeof sections = [];
    for (const s of sections) {
      if (s.title && HOOK_RE.test(s.title)) {
        hookSections.push(s);
      } else {
        otherSections.push(s);
      }
    }
    if (hookSections.length <= 1) return sections; // Nothing to merge
    const merged = {
      title: "Hook analysis",
      content: hookSections.map(s => {
        const sub = s.title ? `### ${toSentenceCase(s.title)}\n${s.content}` : s.content;
        return sub;
      }).join("\n\n"),
    };
    // Insert merged hook section at the position of the first hook section
    const firstIdx = sections.findIndex(s => s.title && HOOK_RE.test(s.title));
    const result = [...otherSections];
    result.splice(Math.min(firstIdx, result.length), 0, merged);
    return result;
  }, [sections]);

  return (
    <div className="flex flex-col">
      {/* Media preview — image or video */}
      {file && fileUrl && (
        <div>
          {isImage ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <img
                src={fileUrl}
                alt={sanitizeFileName(file.name)}
                style={{
                  maxWidth: "100%",
                  maxHeight: 600,
                  objectFit: "contain",
                  borderRadius: 12,
                  border: "1px solid var(--border-subtle)",
                }}
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={fileUrl}
              poster={thumbnailDataUrl ?? undefined}
              controls
              className="rounded-2xl border border-white/5 overflow-hidden max-h-[320px] w-full object-contain bg-black"
            />
          )}
          <p className="text-xs text-zinc-500 font-mono mt-2">
            {sanitizeFileName(file.name)} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      )}

      {/* Mini dropzone — between media and analysis */}
      {onReset && onFileSelect && (
        <div
          className="mt-3 h-[52px] border border-dashed border-[var(--border-subtle)] rounded-[10px] flex items-center justify-center cursor-pointer hover:border-[var(--border-hover)] hover:bg-[var(--surface)] transition-all"
          style={{ transitionDuration: 'var(--duration-fast)' }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "video/*,image/*";
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) { onReset(); setTimeout(() => onFileSelect(f), 50); }
            };
            input.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = 'var(--accent-border)';
            e.currentTarget.style.background = 'var(--accent-bg)';
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.background = '';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.background = '';
            const f = e.dataTransfer.files[0];
            if (f) { onReset(); setTimeout(() => onFileSelect(f), 50); }
          }}
        >
          <span className="text-[11px]" style={{ color: 'var(--ink-tertiary)' }}>Drop new creative or click to browse</span>
        </div>
      )}

      {/* Report section label */}
      <p className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4 mt-6">ANALYSIS</p>

      {/* Report cards — collapsible with Lucide icons */}
      <div className="flex flex-col gap-3">
        {mergedSections.map((section, i) => {
          const title = section.title ? toSentenceCase(section.title) : null;
          const SectionIcon = title ? getIconForTitle(title) : FALLBACK_ICON;
          const content = (
            <div className="text-sm text-zinc-400 leading-relaxed [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1 [&_code]:bg-white/5 [&_code]:rounded [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-zinc-300 [&_h3]:mt-4 [&_h3]:mb-2">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          );

          if (title) {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="cs-card p-5">
                  <CollapsibleSection
                    title={title}
                    defaultOpen={i < 3}
                    icon={<SectionIcon size={14} />}
                  >
                    {content}
                  </CollapsibleSection>
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="cs-card p-5">
                {content}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-[var(--bg)] border-t border-[var(--border-subtle)] px-4 md:px-6 py-3 flex items-center gap-3 mt-6 -mx-4 md:-mx-8 -mb-6">
        <button
          onClick={onCopy}
          className="cs-btn-ghost flex items-center gap-1.5"
        >
          <Copy size={14} />
          {copied ? "Copied!" : "Copy Report"}
        </button>
        <button
          onClick={onExportPdf}
          className="cs-btn-ghost flex items-center gap-1.5"
        >
          <FileDown size={14} />
          Export PDF
        </button>
        <button
          onClick={onShare}
          disabled={shareLoading}
          className="cs-btn-primary ml-auto flex items-center gap-1.5"
        >
          <Share2 size={14} />
          {shareLoading ? "Creating…" : "Share"}
        </button>
      </div>
    </div>
  );
}
