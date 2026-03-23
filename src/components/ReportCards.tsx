import type React from "react";
import { useMemo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { sanitizeFileName } from "../utils/sanitize";
import {
  Copy, FileDown, Share2, Anchor, MessageSquare, MousePointerClick,
  Clapperboard, DollarSign, Hash, Eye, Lightbulb, BarChart3, Heart,
  Layout, Target, Palette, FileText, Upload, Wand2, Image, ShieldCheck,
  Zap, Film, AlignLeft, AlertCircle, Sparkles, ChevronRight, TrendingUp,
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
  platform, hashtags,
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
    <div className="flex flex-col gap-4">
      {/* Media preview — cleaner card */}
      {file && fileUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-black/20">
          {isImage ? (
            <div className="flex justify-center p-4">
              <img
                src={fileUrl}
                alt={sanitizeFileName(file.name)}
                className="max-w-full max-h-[420px] object-contain rounded-xl"
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={fileUrl}
              poster={thumbnailDataUrl ?? undefined}
              controls
              className="w-full max-h-[360px] object-contain"
            />
          )}
          {/* File info bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.05] bg-white/[0.02]">
            <p className="text-xs text-zinc-500 font-mono truncate" title={file.name}>
              {(() => { const n = sanitizeFileName(file.name); return n.length > 35 ? n.slice(0, 32) + "…" : n; })()} 
            </p>
            <span className="text-xs text-zinc-600">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>
      )}

      {/* Upload another — cleaner button style */}
      {onReset && onFileSelect && (
        <button
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
          className="flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-white/[0.08] hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all cursor-pointer"
        >
          <Upload size={14} className="text-indigo-400" />
          <span className="text-xs text-zinc-400">Analyze another creative</span>
        </button>
      )}

      {/* Verdict banner moved to right panel */}

      {/* ─── AI Tools Section — prominent interactive tools ─── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      {(onFixIt || onVisualize || onCheckPolicies || onCompare) && (() => {
        const tools = [
          { 
            key: 'fix', 
            icon: Wand2, 
            name: 'AI Rewrite', 
            description: 'Get AI-powered copy suggestions to improve your messaging and hooks',
            credit: 'Free', 
            iconColor: '#818cf8', 
            gradientFrom: 'from-indigo-500/20',
            gradientTo: 'to-violet-500/10',
            borderColor: 'border-indigo-500/20',
            hoverBorder: 'hover:border-indigo-500/40',
            onClick: onFixIt, 
            loading: fixItLoading 
          },
          { 
            key: 'visualize', 
            icon: Image, 
            name: 'Visualize', 
            description: 'Transform your static ad into an animated motion concept',
            credit: '1 credit', 
            iconColor: '#10b981', 
            gradientFrom: 'from-emerald-500/20',
            gradientTo: 'to-teal-500/10',
            borderColor: 'border-emerald-500/20',
            hoverBorder: 'hover:border-emerald-500/40',
            onClick: onVisualize, 
            disabled: format !== 'static' 
          },
          { 
            key: 'policy', 
            icon: ShieldCheck, 
            name: 'Policy Check', 
            description: 'Scan for potential ad policy violations before you publish',
            credit: 'Free', 
            iconColor: '#f59e0b', 
            gradientFrom: 'from-amber-500/20',
            gradientTo: 'to-orange-500/10',
            borderColor: 'border-amber-500/20',
            hoverBorder: 'hover:border-amber-500/40',
            onClick: onCheckPolicies, 
            loading: policyLoading 
          },
        ];
        return (
          <div className="mt-6">
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">AI Tools</span>
              <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
            </div>
            
            {/* Tools grid */}
            <div className="grid grid-cols-1 gap-3">
              {tools.map((t) => {
                const Icon = t.icon;
                const isDisabled = !!t.disabled;
                const isLoading = !!t.loading;
                return (
                  <button
                    key={t.key}
                    onClick={() => !isDisabled && !isLoading && t.onClick?.()}
                    disabled={isDisabled || isLoading}
                    title={isDisabled ? 'Only available for static ads' : undefined}
                    className={`group relative flex items-start gap-4 p-4 rounded-2xl border ${t.borderColor} bg-gradient-to-br ${t.gradientFrom} ${t.gradientTo} transition-all ${t.hoverBorder} hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer text-left overflow-hidden`}
                  >
                    {/* Glow effect on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{ 
                        background: `radial-gradient(circle at 30% 50%, ${t.iconColor}10, transparent 50%)` 
                      }}
                    />
                    
                    {/* Icon */}
                    <div 
                      className="relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: `${t.iconColor}20`, boxShadow: `0 0 20px ${t.iconColor}15` }}
                    >
                      {isLoading ? (
                        <div 
                          className="w-5 h-5 border-2 rounded-full animate-spin" 
                          style={{ borderColor: `${t.iconColor}40`, borderTopColor: t.iconColor }} 
                        />
                      ) : (
                        <Icon size={20} style={{ color: t.iconColor }} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="relative flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-zinc-100">{t.name}</span>
                        <span 
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ 
                            background: t.credit === 'Free' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                            color: t.credit === 'Free' ? '#10b981' : '#a78bfa'
                          }}
                        >
                          {t.credit}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed pr-4">{t.description}</p>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="relative flex items-center self-center">
                      <ChevronRight 
                        size={16} 
                        className="text-zinc-600 transition-all group-hover:text-zinc-400 group-hover:translate-x-0.5" 
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}
      </motion.div>

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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.06 }}>
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

      </motion.div>

      {/* ─── Emotional Impact — redesigned (DE-1) ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.12 }}>
      {(() => {
        const emotionSections = centerSections.filter(s => /emotion.*(?:impact|arc)|emotion\s*arc/i.test(s.title ?? ''));
        const section = emotionSections[0];
        if (!section) return null;
        const c = section.content;

        // Parse emotions - look for capitalized emotion words after "Primary:" or similar
        const primaryMatch = c.match(/(?:Primary|Main|Dominant)\s*(?:emotion|feeling)?:?\s*\*?\*?\s*([A-Z][a-z]+(?:\s*\/\s*[A-Z][a-z]+)?)/i);
        const primary = primaryMatch?.[1]?.trim() ?? 'Trust';
        
        // Try arrow chain for video arc (e.g., "Curiosity → Aspiration → Relief")
        const chain = c.match(/([A-Z][a-z]+(?:\s*→\s*[A-Z][a-z]+)+)/);
        const arcEmotions = chain ? chain[1].split(/\s*→\s*/) : [];
        const secondary = arcEmotions[1] ?? c.match(/(?:Secondary|second)\s*(?:emotion)?:?\s*\*?\*?\s*([A-Z][a-z]+)/i)?.[1]?.trim() ?? 'Aspiration';
        const tertiary = arcEmotions[2] ?? c.match(/(?:Tertiary|third)\s*(?:emotion)?:?\s*\*?\*?\s*([A-Z][a-z]+)/i)?.[1]?.trim() ?? 'Relief';

        // Parse tone
        const toneMatch = c.match(/(?:Tone|style):?\s*\*?\*?\s*([^\n]+)/i);
        const tones = toneMatch ? toneMatch[1].replace(/\*\*/g, '').split(/[,\/·]/).map(t => t.trim()).filter(Boolean) : ['Professional'];

        // Parse CTA mismatch
        const hasMismatch = /no\s*(clear\s*)?(cta|call.to.action)|mismatch|nowhere to go|no.*path.*act/i.test(c);
        const mismatchNote = hasMismatch ? (c.match(/(?:mismatch|no.*cta)[^.]*\.\s*([^.]+)/i)?.[1]?.trim() ?? 'Consider adding a clear call-to-action to convert this emotional engagement') : undefined;

        // Emotion intensity scoring (mock based on word analysis)
        const intensityMap: Record<string, number> = {
          'Trust': 75, 'Aspiration': 85, 'Relief': 60, 'Excitement': 90, 'Curiosity': 80,
          'Fear': 70, 'Joy': 88, 'Confidence': 78, 'Urgency': 82, 'Comfort': 65
        };
        const primaryIntensity = intensityMap[primary] ?? 75;
        const secondaryIntensity = intensityMap[secondary] ?? 70;

        return (
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden mt-4 bg-white/[0.015]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <Heart size={14} className="text-pink-400" />
                </div>
                <span className="text-sm font-medium text-zinc-200">Emotional Impact</span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Viewer Response</span>
            </div>
            
            {/* Body */}
            <div className="p-5">
              {/* Primary emotion card */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-500/[0.08] to-transparent border border-indigo-500/10 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-indigo-400">Primary Emotion</span>
                  <span className="text-xs font-mono text-indigo-300">{primaryIntensity}%</span>
                </div>
                <p className="text-lg font-semibold text-zinc-100 mb-1">{primary}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  This is the dominant feeling viewers experience within the first 2 seconds
                </p>
                {/* Intensity bar */}
                <div className="mt-3 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400" 
                    style={{ width: `${primaryIntensity}%` }} 
                  />
                </div>
              </div>

              {/* Secondary emotions row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-400 block mb-1">Secondary</span>
                  <p className="text-sm font-medium text-zinc-200">{secondary}</p>
                  <div className="mt-2 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${secondaryIntensity}%` }} />
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-violet-400 block mb-1">Tertiary</span>
                  <p className="text-sm font-medium text-zinc-200">{tertiary}</p>
                  <div className="mt-2 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: '55%' }} />
                  </div>
                </div>
              </div>

              {/* Emotional journey visualization */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 mb-4">
                <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 block mb-3">Emotional Journey</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-xs font-medium text-zinc-300">{primary}</span>
                  </div>
                  <div className="flex-1 mx-3 h-px bg-gradient-to-r from-indigo-500 via-emerald-500 to-violet-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-300">{secondary}</span>
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 mx-3 h-px bg-gradient-to-r from-emerald-500 to-violet-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-300">{tertiary}</span>
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                  </div>
                </div>
              </div>

              {/* Tone tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wide">Tone:</span>
                {tones.map(t => (
                  <span key={t} className="text-[11px] font-medium bg-white/[0.04] rounded-lg px-2.5 py-1 text-zinc-400 border border-white/[0.04]">{t}</span>
                ))}
              </div>

              {/* CTA mismatch warning */}
              {hasMismatch && (
                <div className="flex items-start gap-3 rounded-xl p-4 mt-4 bg-amber-500/[0.06] border border-amber-500/15">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle size={12} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-300 mb-0.5">Missed Conversion Opportunity</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{mismatchNote}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      </motion.div>

      {/* ─── Motion Test Idea — redesigned with visual timeline ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.18 }}>
      {centerSections.filter(s => /motion.*(?:test|idea)/i.test(s.title ?? '')).map((section, i) => {
        const conceptText = section.content
          .replace(/^MOTION TEST IDEA:\s*/i, '')
          .replace(/^-\s*Primary emotion.*$/gim, '')
          .replace(/^-\s*Tone:.*$/gim, '')
          .replace(/^-\s*Does the emotion.*$/gim, '')
          .replace(/\*\*/g, '')
          .replace(/[-\s]+$/, '')
          .trim();
        
        // Parse concept into phases for timeline
        const phases = conceptText.split(/,\s*then\s+|,\s*ending\s+with\s+|,\s*followed\s+by\s+/i).filter(Boolean);
        const phaseLabels = ['Opening', 'Transition', 'Close'];
        const phaseColors = ['#818cf8', '#10b981', '#f59e0b'];
        
        // Infer tags from context
        const platformTag = platform ?? 'Meta';
        const durationTag = '6–8s loop';
        const formatTag = format === 'static' ? 'Static → motion' : 'Video remix';
        
        return (
          <div key={`motion-${i}`} className="rounded-2xl border border-white/[0.06] overflow-hidden mt-4 bg-white/[0.015]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Film size={14} className="text-violet-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-zinc-200 block">Motion Test Idea</span>
                  <span className="text-[10px] text-zinc-600">Transform your static into motion</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[platformTag, durationTag].map(tag => (
                  <span key={tag} className="text-[10px] font-medium bg-white/[0.04] rounded-lg px-2 py-1 text-zinc-500 border border-white/[0.04]">{tag}</span>
                ))}
              </div>
            </div>
            
            {/* Body */}
            <div className="p-5">
              {/* Storyboard Timeline */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Storyboard</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-[10px] text-zinc-600">{formatTag}</span>
                </div>
                
                {/* Timeline phases */}
                <div className="relative">
                  {/* Progress bar background */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/[0.06] rounded-full" />
                  {/* Animated gradient progress */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />
                  
                  <div className="grid grid-cols-3 gap-3">
                    {phases.slice(0, 3).map((phase, pi) => (
                      <div key={pi} className="relative">
                        {/* Timeline dot */}
                        <div 
                          className="w-3 h-3 rounded-full border-2 border-zinc-900 mx-auto mb-3 relative z-10"
                          style={{ backgroundColor: phaseColors[pi] }}
                        />
                        {/* Phase card */}
                        <div 
                          className="rounded-xl p-3.5 border transition-all hover:border-opacity-30"
                          style={{ 
                            background: `linear-gradient(135deg, ${phaseColors[pi]}08, transparent)`,
                            borderColor: `${phaseColors[pi]}15`
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-2">
                            <span 
                              className="text-[9px] font-bold uppercase tracking-wider"
                              style={{ color: phaseColors[pi] }}
                            >
                              {phaseLabels[pi]}
                            </span>
                            <span className="text-[9px] text-zinc-600">{pi === 0 ? '0-2s' : pi === 1 ? '2-5s' : '5-8s'}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed capitalize">
                            {phase.trim().replace(/^product and cta$/i, 'Product reveal with clear CTA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Why this works */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp size={12} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-300 mb-1">Why this works</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Motion increases engagement by 2-3x on {platformTag}. This sequence creates visual intrigue, builds emotional connection, then drives action.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Visualize CTA */}
              {onVisualize && (
                <button
                  onClick={onVisualize}
                  disabled={format !== 'static'}
                  className="group w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-medium transition-all bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-violet-300 hover:from-violet-500/15 hover:to-indigo-500/15 hover:border-violet-500/30 hover:text-violet-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles size={15} className="group-hover:animate-pulse" />
                  Visualize This Concept
                </button>
              )}
            </div>
          </div>
        );
      })}

      </motion.div>

      {/* Pacing & Retention — VIDEO ONLY, V1 insight-first layout */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.24 }}>
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
          <div key={`pacing-${i}`} className="rounded-2xl border border-white/[0.06] overflow-hidden mt-4 bg-white/[0.015]">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.05]">
              <SectionIcon size={14} className="text-zinc-500" />
              <span className="text-xs font-medium text-zinc-300">Pacing & Retention</span>
              {pacing && (
                <span className="ml-auto text-[10px] font-medium rounded-md px-2 py-0.5"
                  style={{ color: pacingColor, background: `${pacingColor}15` }}>{pacing}</span>
              )}
            </div>

            {/* Key insight banner */}
            {keyInsight && (
              <div className="flex items-start gap-3 px-5 py-4 bg-amber-500/[0.04] border-b border-amber-500/10">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wide block mb-1.5 text-amber-500">Key insight</span>
                  <p className="text-[13px] font-medium text-zinc-200 leading-relaxed">{keyInsight}</p>
                </div>
              </div>
            )}

            <div className="p-5">
              {/* Meta tiles */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {avgScene && (
                  <div className="rounded-xl bg-white/[0.03] p-3.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1.5">Avg scene</span>
                    <span className="text-[13px] font-medium text-zinc-200">{avgScene}</span>
                  </div>
                )}
                {pacing && (
                  <div className="rounded-xl bg-white/[0.03] p-3.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1.5">Pacing</span>
                    <span className="text-[13px] font-medium" style={{ color: pacingColor }}>{pacing}</span>
                  </div>
                )}
              </div>

              {/* Retention curve bar */}
              <div className="mb-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-2">Retention curve</span>
                <div className="h-1 rounded-full overflow-hidden bg-white/[0.06]">
                  <div className="h-full rounded-full w-full" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #ef4444 10%, #10b981 25%, #10b981 55%, #d97706 70%, #ef4444 90%, #ef4444 100%)' }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] font-mono text-zinc-600">0s</span>
                  <span className="text-[9px] font-mono text-zinc-600">25%</span>
                  <span className="text-[9px] font-mono text-zinc-500">50%</span>
                  <span className="text-[9px] font-mono text-zinc-600">75%</span>
                  <span className="text-[9px] font-mono text-zinc-600">100%</span>
                </div>
              </div>

              {/* Retention hooks prose */}
              {retention && (
                <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">{retention}</p>
              )}

              {/* Drop-off risk rows */}
              {dropOffs.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-2">Drop-off risk</span>
                  <div className="flex flex-col gap-2">
                    {dropOffs.map((d, j) => {
                      const sevColor = d.severity === 'high' ? '#ef4444' : d.severity === 'medium' ? '#f59e0b' : 'rgba(161,161,170,0.3)';
                      return (
                        <div key={j} className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
                          <span className="text-[10px] font-medium font-mono min-w-[50px] shrink-0 mt-0.5" style={{ color: sevColor }}>{d.timestamp}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium text-zinc-200 block">{d.risk}</span>
                            {d.note && <span className="text-xs text-zinc-500 block mt-1">{d.note}</span>}
                          </div>
                          <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: sevColor }} />
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

      </motion.div>

      {/* Second Eye Review — rendered via slot from PaidAdAnalyzer (video only) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.3 }}>
      {secondEyeSlot}
      </motion.div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/[0.05] px-5 md:px-6 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] md:pb-3.5 flex items-center gap-3 mt-8 -mx-4 md:-mx-8 -mb-6">
        <button
          onClick={onCopy}
          className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium rounded-xl px-4 py-2.5 transition-colors border border-white/[0.05]"
        >
          <Copy size={14} />
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={onExportPdf}
          disabled
          title="PDF export coming soon"
          className="flex items-center gap-2 bg-white/[0.04] text-zinc-500 text-xs font-medium rounded-xl px-4 py-2.5 opacity-50 cursor-not-allowed select-none border border-white/[0.05]"
        >
          <FileDown size={14} />
          PDF
        </button>
        <button
          onClick={onShare}
          disabled={shareLoading}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium rounded-xl px-5 py-2.5 transition-all disabled:opacity-50 ml-auto shadow-lg shadow-indigo-500/20"
        >
          <Share2 size={14} />
          {shareLoading ? "Sharing..." : "Share"}
        </button>
      </div>
    </div>
  );
}
