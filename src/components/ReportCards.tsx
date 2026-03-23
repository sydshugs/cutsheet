import type React from "react";
import { useMemo, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { sanitizeFileName } from "../utils/sanitize";
import {
  Copy, FileDown, Share2, Anchor, MessageSquare, MousePointerClick,
  Clapperboard, DollarSign, Hash, Eye, Lightbulb, BarChart3, Heart,
  Layout, Target, Palette, FileText, Upload, Wand2, Image, ShieldCheck,
  Zap, Film, AlignLeft, AlertCircle, Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Verdict, StructuredImprovement } from "../services/analyzerService";
import { CreativeAnalysis } from "./CreativeAnalysis";
import { CreativeVerdictAndSecondEye } from "./CreativeVerdictAndSecondEye";

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
  format: 'video' | 'static';
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
  fixItResult?: { rewrittenHook?: { copy: string; reasoning: string }; revisedBody?: string; newCTA?: { copy: string; placement: string }; textOverlays?: { timestamp: string; copy: string; placement: string }[]; predictedImprovements?: { dimension: string; oldScore: number; newScore: number; reason: string }[] } | null;
  policyLoading?: boolean;
  policyResult?: { verdict: string; topFixes?: string[]; reviewerNotes?: string; metaCategories?: { name: string; status: string; finding?: string; fix?: string }[]; tiktokCategories?: { name: string; status: string; finding?: string; fix?: string }[] } | null;
  visualizeLoading?: boolean;
  visualizeResult?: { url?: string; type?: string } | null;
  // Render slots for components managed by PaidAdAnalyzer
  designReviewSlot?: React.ReactNode;
  secondEyeSlot?: React.ReactNode;
  // Design review data for CreativeAnalysis
  designReviewData?: { flags: { area: string; severity: string; fix: string; issue: string }[]; topIssue?: string; overallDesignVerdict?: string };
  // Second eye data for combined video component
  secondEyeResult?: { scrollMoment: string | null; flags: { timestamp: string; category: string; severity: string; issue: string; fix: string }[]; whatItCommunicates: string; whatItFails: string } | null;
  secondEyeLoading?: boolean;
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
const CENTER_SECTION_RE = [/verdict/i, /emotion.*(?:impact|arc)|emotion\s*arc/i, /motion.*(?:test|idea)/i, /pacing|retention/i, /transcript/i];

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
  verdict, structuredImprovements, improvements, scores, format,
  platform, niche, hashtags,
  onFixIt, onVisualize, onCheckPolicies, onCompare, onGenerateBrief,
  fixItLoading, fixItResult, policyLoading, policyResult, visualizeLoading, visualizeResult,
  designReviewSlot, secondEyeSlot,
  designReviewData,
  secondEyeResult: secondEyeData, secondEyeLoading: secondEyeDataLoading,
}: ReportCardsProps) {
  const isImage = file?.type.startsWith("image/") ?? false;
  const fileUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showAllFixes, setShowAllFixes] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

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

      {/* ─── Tools card with click-to-expand detail strip ─── */}
      {(onFixIt || onVisualize || onCheckPolicies || onCompare) && (() => {
        const tools = [
          { key: 'fix', icon: Wand2, name: 'AI Rewrite', credit: 'free', iconBg: 'rgba(99,102,241,0.1)', hoverIconBg: 'rgba(99,102,241,0.18)', iconColor: '#818cf8', ctaBg: 'rgba(99,102,241,0.12)', ctaBorder: 'rgba(99,102,241,0.25)', ctaColor: '#818cf8', ctaLabel: 'Run AI Rewrite →', desc: 'AI rewrites your ad with all priority fixes applied — tighter hook, CTA added, copy sharpened.', onClick: onFixIt, loading: fixItLoading },
          { key: 'visualize', icon: Image, name: 'Visualize It', credit: '1 credit', iconBg: 'rgba(16,185,129,0.1)', hoverIconBg: 'rgba(16,185,129,0.18)', iconColor: '#10b981', ctaBg: 'rgba(16,185,129,0.08)', ctaBorder: 'rgba(16,185,129,0.2)', ctaColor: '#10b981', ctaLabel: 'Run Visualize →', desc: 'Turn your static image into a short animated video using AI — ready to test as motion creative.', onClick: onVisualize, disabled: format !== 'static' },
          { key: 'policy', icon: ShieldCheck, name: 'Policy check', credit: 'free', iconBg: 'rgba(251,191,36,0.1)', hoverIconBg: 'rgba(251,191,36,0.18)', iconColor: '#d97706', ctaBg: 'rgba(251,191,36,0.08)', ctaBorder: 'rgba(251,191,36,0.2)', ctaColor: '#d97706', ctaLabel: 'Run Policy check →', desc: 'Scans your ad against Meta, TikTok, and Google platform policies and flags violations.', onClick: onCheckPolicies, loading: policyLoading },
          // Compare removed from tools grid
        ];
        const active = tools.find(t => t.key === activeTool);
        return (
          <div
            className="mt-4 rounded-xl overflow-hidden transition-colors"
            style={{ border: activeTool ? '0.5px solid rgba(99,102,241,0.3)' : '0.5px solid rgba(255,255,255,0.06)', background: 'var(--surface, rgba(255,255,255,0.02))' }}
          >
            {/* 4-column tab row */}
            <div className="grid grid-cols-3" style={{ borderBottom: active ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
              {tools.map((t, i) => {
                const isActive = activeTool === t.key;
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTool(isActive ? null : t.key)}
                    className="group flex flex-col items-center gap-2 py-4 px-2 transition-colors duration-150 cursor-pointer hover:bg-white/[0.03]"
                    style={{
                      background: isActive ? 'rgba(99,102,241,0.06)' : 'transparent',
                      borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center transition-transform duration-150 group-hover:scale-105" style={{ background: t.iconBg }}>
                      <Icon size={16} style={{ color: t.iconColor }} />
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: isActive ? '#818cf8' : '#e4e4e7' }}>{t.name}</span>
                    <span className="text-[9px] text-zinc-500 bg-white/5 rounded-full px-1.5 py-px">{t.credit}</span>
                  </button>
                );
              })}
            </div>
            {/* Detail strip */}
            {active && (
              <div className="flex items-center gap-3.5 px-4 py-3.5" style={{ animation: 'fadeIn 150ms ease' }}>
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: active.iconBg }}>
                  <active.icon size={18} style={{ color: active.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200">
                    {active.name} <span className="text-[10px] text-zinc-500 font-normal ml-1">{active.credit}</span>
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{active.desc}</p>
                </div>
                <button
                  onClick={active.onClick}
                  disabled={active.disabled || active.loading}
                  className="shrink-0 text-xs font-medium rounded-lg px-4 py-2 whitespace-nowrap transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: active.ctaBg, border: `1px solid ${active.ctaBorder}`, color: active.ctaColor }}
                >
                  {active.loading ? 'Running...' : active.ctaLabel}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* ─── Inline tool results (Visualize only — Fix It + Policy in right panel) ─── */}
      {/* Visualize loading */}
      {visualizeLoading && (
        <div className="mt-3 rounded-xl border border-white/5 p-5 text-center" style={{ background: 'var(--surface, rgba(255,255,255,0.02))' }}>
          <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
          <span className="text-[13px] text-zinc-400">Generating visualization...</span>
        </div>
      )}
      {/* Visualize result */}
      {!visualizeLoading && visualizeResult?.url && (
        <div className="mt-3 rounded-xl border border-white/5 overflow-hidden" style={{ background: 'var(--surface, rgba(255,255,255,0.02))' }}>
          <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Image size={14} className="text-emerald-400" />
              <span className="text-[13px] font-medium text-zinc-200">Visualize It result</span>
            </div>
          </div>
          <div className="p-3.5">
            {visualizeResult.type?.startsWith('video') ? (
              <video src={visualizeResult.url} controls className="w-full rounded-[9px]" />
            ) : (
              <img src={visualizeResult.url} alt="Visualized ad" className="w-full rounded-[9px]" />
            )}
            <a
              href={visualizeResult.url}
              download
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-[9px] py-2.5 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 no-underline"
              style={{ background: 'rgba(16,185,129,0.1)', border: '0.5px solid rgba(16,185,129,0.2)', color: '#10b981' }}
            >
              Download →
            </a>
          </div>
        </div>
      )}

      {/* ─── Center column analysis sections ─── */}
      {/* Design Review + Second Eye Review rendered by PaidAdAnalyzer */}

      {/* ─── Creative Analysis / Verdict + Second Eye ─── */}
      {(() => {
        const verdictSection = centerSections.find(s => /verdict/i.test(s.title ?? ''));
        const sentences = verdictSection?.content.trim().split(/(?<=[.!])\s+/).filter(s => s.trim()) ?? [];
        const oneLiner = effectiveVerdict?.headline ?? sentences[0] ?? 'Analysis complete';
        const vState = (effectiveVerdict?.state ?? (scores?.overall && scores.overall >= 8 ? 'ready' : scores?.overall && scores.overall >= 5 ? 'needs_work' : 'not_ready')) as 'not_ready' | 'needs_work' | 'ready';
        const detail = sentences.slice(1, 3).join(' ');

        // Video: combined verdict + second eye
        if (format === 'video') {
          return (
            <CreativeVerdictAndSecondEye
              verdictState={vState}
              verdictOneLiner={oneLiner}
              verdictDetail={detail}
              secondEyeResult={secondEyeData}
              secondEyeLoading={secondEyeDataLoading}
            />
          );
        }

        // Static: CreativeAnalysis (verdict + design review)
        const fixes = (designReviewData?.flags ?? []).map(f => ({
          fix: f.fix, category: f.area,
          severity: f.severity === 'critical' ? 'high' : f.severity === 'warning' ? 'medium' : 'low',
        }));
        const topFix = designReviewData?.flags?.find(f => f.severity === 'critical') ?? designReviewData?.flags?.[0];
        return (
          <CreativeAnalysis
            verdictState={vState}
            verdictOneLiner={oneLiner}
            score={scores?.overall ?? 0}
            topIssue={topFix ? { fix: topFix.fix, category: topFix.area } : undefined}
            fixes={fixes}
            overallNote={designReviewData?.overallDesignVerdict ?? (detail || undefined)}
          />
        );
      })()}

      {/* ─── Emotional Impact — redesigned (DE-1) ─── */}
      {(() => {
        const emotionSections = centerSections.filter(s => /emotion.*(?:impact|arc)|emotion\s*arc/i.test(s.title ?? ''));
        const section = emotionSections[0];
        if (!section) return null;
        const c = section.content;

        // Parse emotions from content
        const primaryMatch = c.match(/(?:Primary|Main)\s*(?:emotion|feeling)?:?\s*\*?\*?\s*([A-Z][a-z]+(?:\s*\/\s*[A-Z][a-z]+)?)/i);
        const primary = primaryMatch?.[1]?.trim() ?? 'Trust';
        // Try arrow chain for video arc
        const chain = c.match(/([A-Z][a-z]+(?:\s*→\s*[A-Z][a-z]+)+)/);
        const arcEmotions = chain ? chain[1].split(/\s*→\s*/) : [];
        const secondary = arcEmotions[1] ?? c.match(/(?:Secondary|second)\s*(?:emotion)?:?\s*\*?\*?\s*([A-Z][a-z]+)/i)?.[1]?.trim() ?? 'Aspiration';
        const tertiary = arcEmotions[2] ?? 'Relief';

        // Parse tone
        const toneMatch = c.match(/(?:Tone|style):?\s*\*?\*?\s*([^\n]+)/i);
        const tones = toneMatch ? toneMatch[1].replace(/\*\*/g, '').split(/[,\/·]/).map(t => t.trim()).filter(Boolean) : ['Professional'];

        // Parse CTA mismatch
        const hasMismatch = /no\s*(clear\s*)?(cta|call.to.action)|mismatch|nowhere to go|no.*path.*act/i.test(c);
        const mismatchNote = hasMismatch ? (c.match(/(?:mismatch|no.*cta)[^.]*\.\s*([^.]+)/i)?.[1]?.trim() ?? 'No CTA to channel the emotion') : undefined;

        // Build statement from first sentence
        const sentences = c.split(/\n/).filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('*'));
        const statementRaw = sentences.find(s => s.length > 20)?.replace(/\*\*/g, '').trim() ?? `This ad evokes ${primary} and ${secondary}.`;

        const EMOTION_COLORS: Record<string, string> = { [primary]: '#818cf8', [secondary]: '#10b981', [tertiary]: '#6366f1' };

        return (
          <div className="rounded-xl border border-white/5 overflow-hidden mt-3" style={{ background: 'var(--surface, rgba(255,255,255,0.02))' }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <Heart size={14} className="text-zinc-500" />
              <span className="text-[13px] font-medium text-zinc-200">Emotional impact</span>
            </div>
            {/* Body */}
            <div className="px-4 py-4">
              {/* Spectrum bar */}
              <div className="h-1.5 rounded-full mb-1.5" style={{ background: 'linear-gradient(90deg, #818cf8 0%, #10b981 50%, #6366f1 100%)' }} />
              <div className="flex justify-between mb-3.5">
                <span className="text-xs font-medium" style={{ color: '#818cf8' }}>{primary}</span>
                <span className="text-xs font-medium" style={{ color: '#10b981' }}>{secondary}</span>
                <span className="text-xs font-medium" style={{ color: '#6366f1' }}>{tertiary}</span>
              </div>

              {/* Statement with colored emotion words */}
              <p className="text-sm text-zinc-400 leading-[1.65] mb-3">
                {statementRaw.split(/\b/).map((word, wi) => {
                  const cleanWord = word.replace(/[.,!?]/g, '');
                  const emotionColor = EMOTION_COLORS[cleanWord];
                  return emotionColor
                    ? <strong key={wi} style={{ color: emotionColor, fontWeight: 600 }}>{word}</strong>
                    : <span key={wi}>{word}</span>;
                })}
              </p>

              {/* Tone pills */}
              <div className="flex gap-1.5 mb-3">
                {tones.map(t => (
                  <span key={t} className="text-[11px] bg-white/5 rounded-full px-2.5 py-0.5 text-zinc-400">{t}</span>
                ))}
              </div>

              {/* CTA mismatch warning */}
              {hasMismatch && (
                <div className="flex items-center gap-2 rounded-[9px] px-3 py-2" style={{ background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.15)' }}>
                  <AlertCircle size={11} className="text-red-400 shrink-0" />
                  <span className="text-[10px] font-medium text-red-400 shrink-0">CTA mismatch</span>
                  <span className="text-[11px] text-zinc-400">{mismatchNote}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ─── Motion Test Idea — redesigned (B3-A) ─── */}
      {centerSections.filter(s => /motion.*(?:test|idea)/i.test(s.title ?? '')).map((section, i) => {
        const conceptText = section.content
          .replace(/^MOTION TEST IDEA:\s*/i, '')
          .replace(/^-\s*Primary emotion.*$/gim, '')
          .replace(/^-\s*Tone:.*$/gim, '')
          .replace(/^-\s*Does the emotion.*$/gim, '')
          .replace(/\*\*/g, '')
          .replace(/[-\s]+$/, '')
          .trim();
        // Infer tags from context
        const platformTag = platform ?? 'Meta feed';
        const durationTag = format === 'video' ? '6–8s loop' : '6–8s loop';
        const formatTag = format === 'static' ? 'Static → motion' : 'Video remix';
        return (
          <div key={`motion-${i}`} className="rounded-xl border border-white/5 overflow-hidden mt-3" style={{ background: 'var(--surface, rgba(255,255,255,0.02))' }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <Film size={14} className="text-zinc-500" />
              <span className="text-[13px] font-medium text-zinc-200">Motion test idea</span>
            </div>
            {/* Body */}
            <div className="px-4 py-3.5">
              {/* Indigo concept card */}
              <div className="rounded-[9px] px-3.5 py-3 mb-2.5" style={{ background: 'rgba(99,102,241,0.05)', border: '0.5px solid rgba(99,102,241,0.15)' }}>
                <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-[0.05em] block mb-1.5">Concept</span>
                <p className="text-[13px] font-medium text-zinc-200 leading-[1.55]">{conceptText}</p>
              </div>
              {/* Tag pills */}
              <div className="flex gap-[5px] mb-3">
                <span className="text-[10px] bg-white/5 rounded-full px-2 py-px text-zinc-500">{platformTag}</span>
                <span className="text-[10px] bg-white/5 rounded-full px-2 py-px text-zinc-500">{durationTag}</span>
                <span className="text-[10px] bg-white/5 rounded-full px-2 py-px text-zinc-500">{formatTag}</span>
              </div>
              {/* Visualize It CTA */}
              {onVisualize && (
                <button
                  onClick={onVisualize}
                  disabled={format !== 'static'}
                  className="w-full flex items-center justify-center gap-2 rounded-[9px] py-2.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '0.5px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
                >
                  <Sparkles size={13} />
                  Visualize this concept → 1 credit
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Pacing & Retention — VIDEO ONLY, V1 insight-first layout */}
      {format === 'video' && centerSections.filter(s => /pacing|retention/i.test(s.title ?? '')).map((section, i) => {
        const SectionIcon = getIconForTitle(toSentenceCase(section.title!));
        const c = section.content;

        const avgScene = c.match(/Average scene length:\s*\*?\*?\s*([^\n*]+)/i)?.[1]?.trim();
        const pacing = c.match(/Overall pacing:\s*\*?\*?\s*([^\n*]+)/i)?.[1]?.trim();
        const retentionMatch = c.match(/Retention hooks?:\s*\*?\*?\s*([^\n]+(?:\n(?!\*\*|-\s)[^\n]+)*)/i);
        const retention = retentionMatch?.[1]?.trim();
        const dropOffMatch = c.match(/Drop.off risk.*?:\s*\*?\*?\s*([^\n]+(?:\n(?!\*\*|##)[^\n]+)*)/i);
        const dropOffText = dropOffMatch?.[1]?.trim();
        const dropOffs = dropOffText
          ? dropOffText.split('\n').filter(l => l.trim()).map(l => {
              const clean = l.replace(/^[-*]\s*/, '').trim();
              const tsMatch = clean.match(/^(\d+:\d+[–-]\d+:\d+|\d+:\d+s?)/);
              const ts = tsMatch?.[1] ?? 'Overall';
              const rest = clean.replace(tsMatch?.[0] ?? '', '').replace(/^[\s:—–-]+/, '').trim();
              const parts = rest.split(/[—–-]/).map(p => p.trim()).filter(Boolean);
              const isHigh = /drop|risk|scroll|lose|static|kill/i.test(rest);
              return { timestamp: ts, risk: parts[0] ?? rest, note: parts[1] ?? '', severity: isHigh ? 'high' : 'medium' };
            })
          : [];
        const pacingColor = /fast/i.test(pacing ?? '') ? '#10b981' : /slow/i.test(pacing ?? '') ? '#ef4444' : '#d97706';
        // Key insight: first non-label sentence
        const sentences = c.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('*') && !/^\*\*/.test(l));
        const keyInsight = sentences.find(s => s.length > 15 && s.length < 100)?.replace(/\*\*/g, '').trim() ?? '';

        return (
          <div key={`pacing-${i}`} className="rounded-xl border border-white/5 overflow-hidden mt-3" style={{ background: 'var(--surface, rgba(255,255,255,0.02))' }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              <SectionIcon size={14} className="text-zinc-500" />
              <span className="text-[13px] font-medium text-zinc-200">Pacing & retention</span>
              {pacing && (
                <span className="ml-auto text-[10px] font-medium rounded-full px-1.5 py-px"
                  style={{ color: pacingColor, background: `${pacingColor}15` }}>{pacing}</span>
              )}
            </div>

            {/* Key insight banner */}
            {keyInsight && (
              <div className="flex items-start gap-2.5 px-3.5 py-3" style={{ background: 'rgba(251,191,36,0.06)', borderBottom: '0.5px solid rgba(251,191,36,0.12)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.12)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.04em] block mb-1" style={{ color: '#d97706' }}>Key insight</span>
                  <p className="text-xs font-medium text-zinc-200 leading-[1.45]">{keyInsight}</p>
                </div>
              </div>
            )}

            <div className="px-4 py-3.5">
              {/* Meta tiles */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {avgScene && (
                  <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 12px' }}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Avg scene</span>
                    <span className="text-[13px] font-medium text-zinc-200">{avgScene}</span>
                  </div>
                )}
                {pacing && (
                  <div className="bg-white/[0.03] rounded-lg" style={{ padding: '9px 12px' }}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1">Pacing</span>
                    <span className="text-[13px] font-medium" style={{ color: pacingColor }}>{pacing}</span>
                  </div>
                )}
              </div>

              {/* Retention curve bar */}
              <div className="mb-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1.5">Retention curve</span>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full w-full" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #ef4444 10%, #10b981 25%, #10b981 55%, #d97706 70%, #ef4444 90%, #ef4444 100%)' }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-mono text-zinc-600">0s</span>
                  <span className="text-[9px] font-mono text-zinc-600">25%</span>
                  <span className="text-[9px] font-mono text-zinc-500">50% ★</span>
                  <span className="text-[9px] font-mono text-zinc-600">75%</span>
                  <span className="text-[9px] font-mono text-zinc-600">100%</span>
                </div>
              </div>

              {/* Retention hooks prose */}
              {retention && (
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">{retention}</p>
              )}

              {/* Drop-off risk rows */}
              {dropOffs.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-[0.04em] block mb-1.5">Drop-off risk moments</span>
                  <div className="flex flex-col gap-1">
                    {dropOffs.map((d, j) => {
                      const sevColor = d.severity === 'high' ? '#ef4444' : d.severity === 'medium' ? '#f59e0b' : 'rgba(161,161,170,0.2)';
                      return (
                        <div key={j} className="flex items-start gap-2.5 bg-white/[0.03] rounded-lg" style={{ padding: '8px 10px' }}>
                          <span className="text-[10px] font-medium font-mono min-w-[52px] shrink-0 mt-0.5" style={{ color: sevColor }}>{d.timestamp}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-zinc-200 block">{d.risk}</span>
                            {d.note && <span className="text-[11px] text-zinc-500 block mt-0.5">{d.note}</span>}
                          </div>
                          <span className="w-[7px] h-[7px] rounded-full shrink-0 mt-1.5" style={{ background: sevColor }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fallback */}
              {!avgScene && !pacing && !retention && dropOffs.length === 0 && renderSectionContent(section)}
            </div>
          </div>
        );
      })}

      {/* Second Eye Review — rendered via slot from PaidAdAnalyzer (video only) */}
      {secondEyeSlot}

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
