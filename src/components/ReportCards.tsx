import type React from "react";
import { useMemo, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { sanitizeFileName } from "../utils/sanitize";
import {
  Copy, FileDown, Share2, Anchor, MessageSquare, MousePointerClick,
  Clapperboard, DollarSign, Hash, Eye, Lightbulb, BarChart3, Heart,
  Layout, Target, Palette, FileText, Upload, Wand2, Image, ShieldCheck,
  GitCompare, FileSignature, Zap, Film, AlignLeft,
  type LucideIcon,
} from "lucide-react";
import { CollapsibleSection } from "./ui/CollapsibleSection";
import { VerdictBanner } from "./ui/VerdictBanner";
import { ZoneLabel } from "./ui/ZoneLabel";
import { PriorityFixCard } from "./ui/PriorityFixCard";
import { DeepDivePreviewCard } from "./ui/DeepDivePreviewCard";
import { DeepDiveRow } from "./ui/DeepDiveRow";
import { ToolButton } from "./ui/ToolButton";
import type { Verdict, StructuredImprovement } from "../services/analyzerService";

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
  // New props for redesigned layout
  verdict?: Verdict;
  structuredImprovements?: StructuredImprovement[];
  improvements?: string[];
  scores?: { hook: number; clarity: number; cta: number; production: number; overall: number } | null;
  format?: 'video' | 'static';
  platform?: string;
  niche?: string;
  hashtags?: { tiktok: string[]; meta: string[]; instagram: string[] };
  // Callbacks forwarded from ScoreCard
  onFixIt?: () => void;
  onVisualize?: () => void;
  onCheckPolicies?: () => void;
  onCompare?: () => void;
  onGenerateBrief?: () => void;
  fixItLoading?: boolean;
  policyLoading?: boolean;
}

const JSON_TITLE_RE = /json|scene|raw\s*data|budget\s*recommend/i;
const SCORECARD_DUPLICATE_RE = /^[#⃣\s]*(improve|hashtag|recommend.*hashtag|budget|predicted.*perform|quick.?score|score.?summary|overall.*score|overall.*strength|verdict)/i;
const JSON_CONTENT_RE = /^\s*[\[{]/;
const HOOK_RE = /hook|opening|first.*(second|frame)|attention.*(grab|open)/i;

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
  [/emotion|sentiment|feeling|tone|impact|arc/i, Heart],
  [/structure|layout|hierarchy|flow/i, Layout],
  [/target|audience|persona|demographic/i, Target],
  [/brand|identity|style|design/i, Palette],
  [/pacing|retention/i, Zap],
  [/transcript/i, AlignLeft],
  [/motion|test/i, Film],
];

const FALLBACK_ICON: LucideIcon = FileText;

function getIconForTitle(title: string): LucideIcon {
  for (const [re, Icon] of SECTION_ICON_MAP) {
    if (re.test(title)) return Icon;
  }
  return FALLBACK_ICON;
}

function getTrailingForSection(title: string, content: string): React.ReactNode {
  const lower = title.toLowerCase();

  if (/hook/i.test(lower)) {
    const verdictMatch = content.match(/Hook (?:Verdict|strength):\s*\[?([^\]\n]+)\]?/i);
    if (verdictMatch) {
      const v = verdictMatch[1].trim();
      const isStrong = /strong|scroll.?stop/i.test(v);
      const isWeak = /weak/i.test(v);
      const color = isStrong ? '#10b981' : isWeak ? '#ef4444' : '#d97706';
      const bg = isStrong ? 'rgba(16,185,129,0.1)' : isWeak ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.12)';
      const label = isStrong ? 'Strong' : isWeak ? 'Weak' : 'Needs work';
      return <span style={{ fontSize: 10, fontWeight: 500, color, background: bg, borderRadius: 99, padding: '2px 7px', lineHeight: '16px' }}>{label}</span>;
    }
  }
  if (/messag/i.test(lower)) {
    if (/no\s*(explicit\s*)?(cta|call.to.action)|cta.*none|none.*cta/i.test(content)) {
      return <span style={{ fontSize: 10, fontWeight: 500, color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderRadius: 99, padding: '2px 7px', lineHeight: '16px' }}>No CTA</span>;
    }
  }
  if (/emotion|arc/i.test(lower)) {
    const chain = content.match(/([A-Z][a-z]+(?:\s*→\s*[A-Z][a-z]+)+)/);
    if (chain) {
      return <span style={{ fontSize: 10, color: '#71717a', fontFamily: 'var(--mono)' }}>{chain[1].length > 40 ? chain[1].slice(0, 37) + '…' : chain[1]}</span>;
    }
  }
  if (/verdict/i.test(lower)) {
    return <span style={{ fontSize: 10, fontWeight: 500, color: '#818cf8', background: 'rgba(99,102,241,0.08)', borderRadius: 99, padding: '2px 7px', lineHeight: '16px' }}>Verdict</span>;
  }
  if (/pacing|retention/i.test(lower)) {
    const pacingMatch = content.match(/Overall pacing:\s*\*?\*?\s*\[?([^\]\n*]+)\]?/i);
    if (pacingMatch) return <span style={{ fontSize: 10, color: '#71717a' }}>{pacingMatch[1].trim()}</span>;
  }
  if (/transcript/i.test(lower)) {
    const words = content.split(/\s+/).length;
    return <span style={{ fontSize: 10, color: '#52525b' }}>{words} words</span>;
  }
  if (/motion/i.test(lower)) {
    return <span style={{ fontSize: 10, color: '#52525b', fontStyle: 'italic' }}>Concept</span>;
  }
  return null;
}

function stripEmoji(s: string): string {
  return s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f]/gu, "").trim();
}

function toSentenceCase(s: string): string {
  if (!s) return s;
  const clean = stripEmoji(s);
  if (!clean) return s;
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
    if (s.title && JSON_TITLE_RE.test(s.title)) return false;
    if (s.title && SCORECARD_DUPLICATE_RE.test(stripEmoji(s.title))) return false;
    const trimmed = s.content.trim();
    if (JSON_CONTENT_RE.test(trimmed) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) return false;
    if (/"scenes"\s*:\s*\[/.test(trimmed)) return false;
    if (!s.title && /^[\s\-]*$/.test(trimmed)) return false;
    return true;
  });
}

/** Extract first meaningful line of section content as preview */
/** Get a short preview (max 5 words) from section content */
function getPreview(content: string, maxWords = 5): string {
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const first = lines[0]?.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim() ?? '';
  const words = first.split(/\s+/).slice(0, maxWords);
  return words.join(' ') + (first.split(/\s+/).length > maxWords ? '…' : '');
}

/** Get a score badge for a section based on content */
function getScoreBadge(title: string, content: string): { badge: string; color: string; bg: string } | null {
  const lower = title.toLowerCase();

  if (/hook/i.test(lower)) {
    const match = content.match(/Hook (?:Verdict|strength):\s*\[?([^\]\n]+)\]?/i);
    if (match) {
      const v = match[1].trim();
      const isStrong = /strong|scroll.?stop/i.test(v);
      const isWeak = /weak/i.test(v);
      return {
        badge: isStrong ? 'Strong' : isWeak ? 'Weak' : 'Needs work',
        color: isStrong ? '#10b981' : isWeak ? '#ef4444' : '#d97706',
        bg: isStrong ? 'rgba(16,185,129,0.1)' : isWeak ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.12)',
      };
    }
  }
  if (/messag/i.test(lower)) {
    if (/no\s*(explicit\s*)?(cta|call.to.action)|cta.*none|none.*cta/i.test(content)) {
      return { badge: 'No CTA', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    }
  }
  if (/copy.*inventory/i.test(lower)) {
    if (/cta.*missing|missing.*cta/i.test(content)) {
      return { badge: 'CTA missing', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    }
  }
  return null;
}

// ─── Section classification: center column vs right panel ────────────────────

/** Sections that render in the CENTER COLUMN */
const CENTER_SECTION_RE = [/verdict/i, /emotion|arc|impact/i, /motion|test/i, /pacing|retention/i, /transcript/i];

/** Sections that render in the RIGHT PANEL (ScoreCard) */
const RIGHT_PANEL_RE = [/hook/i, /hierarchy/i, /copy.*inventory/i, /messag/i];

function isCenterSection(title: string): boolean {
  const clean = stripEmoji(title).toLowerCase();
  return CENTER_SECTION_RE.some(re => re.test(clean));
}

function isRightPanelSection(title: string): boolean {
  const clean = stripEmoji(title).toLowerCase();
  return RIGHT_PANEL_RE.some(re => re.test(clean));
}

/** Extract right panel sections from analysis markdown — used by ScoreCard */
export function extractRightPanelSections(markdown: string): { title: string; content: string }[] {
  const sections = splitMarkdown(markdown);
  // Merge hook sections
  const hookSections = sections.filter(s => s.title && HOOK_RE.test(s.title));
  const otherSections = sections.filter(s => !s.title || !HOOK_RE.test(s.title));
  const merged = hookSections.length > 1
    ? [{
        title: "Hook analysis",
        content: hookSections.map(s => s.title ? `### ${toSentenceCase(s.title)}\n${s.content}` : s.content).join("\n\n"),
      }, ...otherSections]
    : sections;

  return merged
    .filter(s => s.title && isRightPanelSection(s.title))
    .map(s => ({ title: toSentenceCase(s.title!), content: s.content }));
}

export function ReportCards({
  file, markdown, thumbnailDataUrl, onCopy, onExportPdf, onShare, copied, shareLoading,
  onReset, onFileSelect,
  verdict, structuredImprovements, improvements, scores, format = 'video',
  platform, niche, hashtags,
  onFixIt, onVisualize, onCheckPolicies, onCompare, onGenerateBrief,
  fixItLoading, policyLoading,
}: ReportCardsProps) {
  const isImage = file?.type.startsWith("image/") ?? false;
  const fileUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showAllFixes, setShowAllFixes] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [fileUrl]);

  const sections = useMemo(() => splitMarkdown(markdown), [markdown]);

  // Merge hook-related sections
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
    if (hookSections.length <= 1) return sections;
    const merged = {
      title: "Hook analysis",
      content: hookSections.map(s => {
        const sub = s.title ? `### ${toSentenceCase(s.title)}\n${s.content}` : s.content;
        return sub;
      }).join("\n\n"),
    };
    const firstIdx = sections.findIndex(s => s.title && HOOK_RE.test(s.title));
    const result = [...otherSections];
    result.splice(Math.min(firstIdx, result.length), 0, merged);
    return result;
  }, [sections]);

  // Split sections into center column vs right panel
  const centerSections = useMemo(() =>
    mergedSections.filter(s => s.title && isCenterSection(s.title)),
    [mergedSections]
  );
  const rightPanelSections = useMemo(() =>
    mergedSections.filter(s => s.title && isRightPanelSection(s.title)),
    [mergedSections]
  );

  // Build priority fixes from structuredImprovements or plain improvements
  const fixes = useMemo<StructuredImprovement[]>(() => {
    if (structuredImprovements && structuredImprovements.length > 0) return structuredImprovements;
    if (improvements && improvements.length > 0) {
      return improvements.map((text, i) => ({
        priority: (i === 0 ? 'high' : i === 1 ? 'medium' : 'low') as StructuredImprovement['priority'],
        category: 'visual',
        text,
      }));
    }
    return [];
  }, [structuredImprovements, improvements]);

  const visibleFixes = showAllFixes ? fixes : fixes.slice(0, 3);
  const hasMoreFixes = fixes.length > 3;

  // Build fallback verdict from scores if not provided
  const effectiveVerdict = useMemo<Verdict | undefined>(() => {
    if (verdict) return verdict;
    if (scores) {
      const verdictSection = markdown.match(/##\s*(?:🧠\s*)?CREATIVE VERDICT\s*\n([\s\S]*?)(?=\n---|\n##|$)/i);
      const sentences = verdictSection?.[1]?.trim().split(/(?<=[.!])\s+/) ?? [];
      return {
        state: scores.overall >= 8 ? 'ready' : scores.overall >= 5 ? 'needs_work' : 'not_ready',
        headline: sentences[0] ?? 'Analysis complete',
        sub: sentences[1] ?? '',
      };
    }
    return undefined;
  }, [verdict, scores, markdown]);

  // Render a section's full content (for expanded deep dive)
  const renderSectionContent = (section: { title: string | null; content: string }) => (
    <div className="text-sm text-zinc-400 leading-relaxed [&_strong]:text-zinc-300 [&_strong]:font-medium [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1.5 [&_code]:bg-white/5 [&_code]:rounded [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-zinc-300 [&_h3]:mt-4 [&_h3]:mb-2 [&_em]:text-indigo-300/70">
      <ReactMarkdown>{section.content}</ReactMarkdown>
    </div>
  );

  const allHashtags = useMemo(() => {
    if (!hashtags) return [];
    return [...(hashtags.tiktok ?? []), ...(hashtags.meta ?? []), ...(hashtags.instagram ?? [])].filter((v, i, a) => a.indexOf(v) === i);
  }, [hashtags]);

  return (
    <div className="flex flex-col">
      {/* ─── Media preview ─── */}
      {file && fileUrl && (
        <div>
          {isImage ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <img
                src={fileUrl}
                alt={sanitizeFileName(file.name)}
                style={{ maxWidth: "100%", maxHeight: 600, objectFit: "contain", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}
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
          <p className="text-xs text-zinc-500 font-mono mt-2 truncate" title={file.name}>
            {(() => { const n = sanitizeFileName(file.name); return n.length > 40 ? n.slice(0, 37) + "\u2026" : n; })()} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      )}

      {/* ─── Mini dropzone ─── */}
      {onReset && onFileSelect && (
        <div
          style={{
            marginTop: 12, height: 52, border: "1px dashed rgba(99,102,241,0.3)", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            cursor: "pointer", transition: "all 150ms", background: "rgba(99,102,241,0.03)",
          }}
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
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; const f = e.dataTransfer.files[0]; if (f) { onReset(); setTimeout(() => onFileSelect(f), 50); } }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; }}
        >
          <Upload size={14} style={{ color: "#818cf8" }} />
          <span style={{ fontSize: 12, color: "#a1a1aa" }}>Analyze another creative</span>
        </div>
      )}

      {/* Verdict banner moved to right panel */}

      {/* ─── Center column analysis sections ─── */}
      {/* Design Review + Second Eye Review rendered by PaidAdAnalyzer */}

      {/* Creative Verdict — always visible, no accordion */}
      {centerSections.filter(s => /verdict/i.test(s.title ?? '')).map((section, i) => {
        const title = toSentenceCase(section.title!);
        const SectionIcon = getIconForTitle(title);
        return (
          <div key={`verdict-${i}`} className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon size={14} className="text-zinc-500" />
              <span className="text-xs font-medium text-zinc-200">{title}</span>
              {scores && (
                <span className="ml-auto text-[10px] font-mono font-medium rounded-full px-1.5 py-px"
                  style={{
                    color: scores.overall >= 8 ? '#10b981' : scores.overall >= 5 ? '#d97706' : '#ef4444',
                    background: scores.overall >= 8 ? 'rgba(16,185,129,0.1)' : scores.overall >= 5 ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.1)',
                  }}>{scores.overall}/10</span>
              )}
            </div>
            {(() => {
              // Extract one-liner (first sentence) + support (next 2 sentences max)
              const sentences = section.content.trim().split(/(?<=[.!])\s+/).filter(s => s.trim());
              const oneLiner = sentences[0] ?? '';
              const support = sentences.slice(1, 3).join(' ');
              return (
                <>
                  <div className="rounded-lg px-3 py-2.5 mb-3"
                    style={{ background: 'rgba(99,102,241,0.06)', border: '0.5px solid rgba(99,102,241,0.18)' }}>
                    <span className="text-[10px] text-indigo-400 uppercase tracking-[0.05em] block mb-1">Verdict</span>
                    <p className="text-[13px] font-medium text-zinc-200 leading-snug">{oneLiner}</p>
                  </div>
                  {support && (
                    <p className="text-xs text-zinc-400 leading-relaxed">{support}</p>
                  )}
                </>
              );
            })()}
          </div>
        );
      })}

      {/* Emotional Impact / Emotion Arc — show only one (prefer arc on video) */}
      {(() => {
        const emotionSections = centerSections.filter(s => /emotion|arc|impact/i.test(s.title ?? ''));
        // On video: prefer Emotion Arc, skip Emotional Impact to avoid dupes
        const filtered = format === 'video'
          ? emotionSections.filter(s => /arc/i.test(s.title ?? '') || emotionSections.length === 1)
          : emotionSections.filter(s => !/arc/i.test(s.title ?? '') || emotionSections.length === 1);
        // Only show first match to prevent duplicates
        return filtered.slice(0, 1);
      })().map((section, i) => {
        const title = toSentenceCase(section.title!);
        const SectionIcon = getIconForTitle(title);
        const isArc = /arc/i.test(section.title ?? '');
        // For emotion arc, render as chip sequence
        if (isArc || format === 'video') {
          // Try arrow chain first: "Curiosity → Discovery → Satisfaction"
          const chain = section.content.match(/([A-Z][a-z]+(?:\s*→\s*[A-Z][a-z]+)+)/);
          let emotions = chain ? chain[1].split(/\s*→\s*/) : [];
          // Fallback: try to extract from bold labels or numbered list
          if (emotions.length === 0) {
            const boldItems = section.content.match(/\*\*([A-Z][a-z]+(?:\s*\/\s*[A-Z][a-z]+)?)\*\*/g);
            if (boldItems) emotions = boldItems.map(b => b.replace(/\*\*/g, ''));
          }
          return (
            <div key={`emotion-${i}`} className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5 mt-3">
              <div className="flex items-center gap-2 mb-3">
                <SectionIcon size={14} className="text-zinc-500" />
                <span className="text-xs font-medium text-zinc-200">{isArc ? 'Emotion arc' : title}</span>
              </div>
              {emotions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {emotions.map((e, j) => (
                    <span key={j} className="flex items-center gap-1.5">
                      <span className="text-[11px] bg-white/5 rounded-full px-2.5 py-0.5 text-zinc-300">{e}</span>
                      {j < emotions.length - 1 && <span className="text-[11px] text-zinc-600">→</span>}
                    </span>
                  ))}
                </div>
              ) : (
                renderSectionContent(section)
              )}
            </div>
          );
        }
        // Static: 2-up tiles
        return (
          <div key={`emotion-${i}`} className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon size={14} className="text-zinc-500" />
              <span className="text-xs font-medium text-zinc-200">{title}</span>
            </div>
            {renderSectionContent(section)}
          </div>
        );
      })}

      {/* Motion Test Idea — always visible */}
      {centerSections.filter(s => /motion|test/i.test(s.title ?? '')).map((section, i) => {
        const title = toSentenceCase(section.title!);
        const SectionIcon = getIconForTitle(title);
        return (
          <div key={`motion-${i}`} className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon size={14} className="text-zinc-500" />
              <span className="text-xs font-medium text-zinc-200">{title}</span>
            </div>
            <div className="bg-white/[0.03] rounded-[9px] p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.05em] block mb-1.5">Concept</span>
              <p className="text-xs font-medium text-zinc-200 leading-relaxed">
                {section.content.replace(/^MOTION TEST IDEA:\s*/i, '').replace(/\*\*/g, '').trim()}
              </p>
            </div>
          </div>
        );
      })}

      {/* Pacing & Retention — VIDEO ONLY, structured layout */}
      {format === 'video' && centerSections.filter(s => /pacing|retention/i.test(s.title ?? '')).map((section, i) => {
        const title = toSentenceCase(section.title!);
        const SectionIcon = getIconForTitle(title);
        const c = section.content;

        // Parse structured fields from markdown
        const avgScene = c.match(/Average scene length:\s*\*?\*?\s*([^\n*]+)/i)?.[1]?.trim();
        const pacing = c.match(/Overall pacing:\s*\*?\*?\s*([^\n*]+)/i)?.[1]?.trim();
        const retentionMatch = c.match(/Retention hooks?:\s*\*?\*?\s*([^\n]+(?:\n(?!\*\*|-\s)[^\n]+)*)/i);
        const retention = retentionMatch?.[1]?.trim();
        const dropOffMatch = c.match(/Drop.off risk.*?:\s*\*?\*?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/i);
        const dropOffText = dropOffMatch?.[1]?.trim();

        // Parse drop-off moments from bullet list
        const dropOffs = dropOffText
          ? dropOffText.split('\n').filter(l => l.trim()).map(l => {
              const clean = l.replace(/^[-*]\s*/, '').trim();
              const tsMatch = clean.match(/^(\d+:\d+[–-]\d+:\d+|\d+:\d+s?)/);
              const ts = tsMatch?.[1] ?? 'Overall';
              const rest = clean.replace(tsMatch?.[0] ?? '', '').replace(/^[\s:—–-]+/, '').trim();
              return { timestamp: ts, text: rest };
            })
          : [];

        const pacingChipColor = /fast/i.test(pacing ?? '') ? '#10b981' : /slow/i.test(pacing ?? '') ? '#ef4444' : '#d97706';

        return (
          <div key={`pacing-${i}`} className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5 mt-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon size={14} className="text-zinc-500" />
              <span className="text-xs font-medium text-zinc-200">{title}</span>
              {pacing && (
                <span className="ml-auto text-[10px] font-medium rounded-full px-1.5 py-px"
                  style={{ color: pacingChipColor, background: `${pacingChipColor}15` }}>
                  {pacing}
                </span>
              )}
            </div>

            {/* 2-up tile grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {avgScene && (
                <div className="bg-white/[0.03] rounded-lg p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-[0.05em] block mb-1">Avg scene length</span>
                  <span className="text-[13px] font-medium text-zinc-200">{avgScene}</span>
                </div>
              )}
              {pacing && (
                <div className="bg-white/[0.03] rounded-lg p-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-[0.05em] block mb-1">Overall pacing</span>
                  <span className="text-[13px] font-medium text-zinc-200">{pacing}</span>
                </div>
              )}
              {retention && (
                <div className="bg-white/[0.03] rounded-lg p-2.5 col-span-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-[0.05em] block mb-1">Retention hooks</span>
                  <span className="text-xs text-zinc-300 leading-relaxed">{retention}</span>
                </div>
              )}
            </div>

            {/* Drop-off risk moments */}
            {dropOffs.length > 0 && (
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.05em] block mb-2">Drop-off risk moments</span>
                <div className="flex flex-col gap-[5px]">
                  {dropOffs.map((d, j) => (
                    <div key={j} className="flex items-start gap-2.5 bg-white/[0.03] rounded-lg px-2.5 py-2">
                      <span className="text-[11px] font-mono text-zinc-500 min-w-[52px] shrink-0">{d.timestamp}</span>
                      <span className="text-xs text-zinc-300 flex-1 leading-relaxed">{d.text}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback if parsing fails */}
            {!avgScene && !pacing && !retention && dropOffs.length === 0 && renderSectionContent(section)}
          </div>
        );
      })}

      {/* ─── Sticky action bar ─── */}
      <div className="sticky bottom-0 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 px-4 md:px-6 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] md:pb-3 flex items-center gap-3 mt-6 -mx-4 md:-mx-8 -mb-6">
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl px-4 py-2 transition-colors"
        >
          <Copy size={14} />
          {copied ? "Copied!" : "Copy Report"}
        </button>
        <button
          onClick={onExportPdf}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/50 text-sm rounded-xl px-4 py-2 transition-colors"
        >
          <FileDown size={14} />
          Export PDF
          <span className="text-[9px] text-white/30 ml-0.5">Soon</span>
        </button>
        <button
          onClick={onShare}
          disabled={shareLoading}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors disabled:opacity-50 ml-auto"
        >
          <Share2 size={14} />
          {shareLoading ? "Creating…" : "Share"}
        </button>
      </div>
    </div>
  );
}
