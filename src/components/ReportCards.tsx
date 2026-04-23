import type React from "react";
import { memo, useMemo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { sanitizeFileName } from "../utils/sanitize";
import {
  Anchor, MessageSquare, MousePointerClick,
  Clapperboard, DollarSign, Hash, Eye, Lightbulb, BarChart3,
  Layout, Target, Palette, FileText, Upload, Wand2, Image, ShieldCheck,
  Zap, Film, AlignLeft, AlertCircle, Sparkles, ChevronRight, TrendingUp,
  Heart, Shield, type LucideIcon,
} from "lucide-react";
import type { Verdict, StructuredImprovement } from "../services/analyzerService";
import type { SecondEyeResult, PlatformScore as OrganicPlatformScore } from "../services/claudeService";
import { CreativeAnalysis } from "./CreativeAnalysis";
import { CreativeVerdictAndSecondEye } from "./CreativeVerdictAndSecondEye";
import { DesignReviewCard } from "./DesignReviewCard";
import { MotionTestIdeaCard } from "./MotionTestIdeaCard";
import PlatformScoreCard from "./PlatformScoreCard";
import { PlatformOptimizationCard } from "./organic/PlatformOptimizationCard";
import { toPlatformOptimizationEntries } from "./organic/platformOptimizationAdapter";

interface ReportCardsProps {
  file: File | null;
  markdown: string;
  thumbnailDataUrl?: string;
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
  onMotionPreview?: () => void;
  motionVideoUrl?: string | null;
  motionLoading?: boolean;
  motionError?: string | null;
  onCheckPolicies?: () => void;
  onSafeZone?: () => void;
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
  isOrganic?: boolean;
  // Platform optimization scores for organic content
  platformScores?: { platform: string; score: number; verdict: string; signals?: { label: string; pass: boolean }[]; improvements?: string[] }[];
  platformScoresLoading?: boolean;
  niche?: string;
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
      const color = isStrong ? '#10b981' : isWeak ? '#ef4444' : '#f59e0b';
      const bg = isStrong ? 'rgba(16,185,129,0.1)' : isWeak ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
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
        color: isStrong ? '#10b981' : isWeak ? '#ef4444' : '#f59e0b',
        bg: isStrong ? 'rgba(16,185,129,0.1)' : isWeak ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
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

export const ReportCards = memo(function ReportCards({
  file, markdown, thumbnailDataUrl,
  onReset, onFileSelect,
  verdict, structuredImprovements, improvements, scores, format,
  platform, hashtags,
  onFixIt, onVisualize, onMotionPreview, motionVideoUrl, motionLoading, motionError,
  onCheckPolicies, onSafeZone, onCompare, onGenerateBrief,
  fixItLoading, fixItResult, policyLoading, policyResult, visualizeLoading, visualizeResult,
  designReviewSlot, secondEyeSlot,
  designReviewData,
  secondEyeResult: secondEyeData, secondEyeLoading: secondEyeDataLoading,
  isOrganic,
  platformScores,
  platformScoresLoading,
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
    <div className="text-[11px] text-zinc-400 leading-relaxed [&_strong]:text-zinc-300 [&_strong]:font-medium [&_ul]:pl-3.5 [&_li]:mb-1 [&_code]:bg-white/[0.03] [&_code]:rounded [&_code]:px-1 [&_ol]:pl-3.5 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_h3]:text-[10px] [&_h3]:font-medium [&_h3]:text-zinc-400 [&_h3]:mt-3 [&_h3]:mb-1.5 [&_em]:text-zinc-400">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{section.content}</ReactMarkdown>
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
        <div className="w-full h-[55vh] max-h-[420px] relative flex flex-col shrink-0 rounded-2xl border border-white/[0.06] bg-black/20">
          <div className="flex-1 w-full relative flex items-center justify-center rounded-t-2xl overflow-hidden bg-zinc-900">
            {isImage ? (
              <img
                src={fileUrl}
                alt={sanitizeFileName(file.name)}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={fileUrl}
                poster={thumbnailDataUrl ?? undefined}
                controls
                preload="auto"
                playsInline
                className="w-full h-full object-contain"
                onLoadedData={(e) => {
                  if (!thumbnailDataUrl) {
                    const v = e.currentTarget;
                    if (v.readyState >= 2) {
                      v.currentTime = Math.min(1.0, (v.duration || 10) * 0.1);
                    }
                  }
                }}
                onSeeked={(e) => {
                  const v = e.currentTarget;
                  v.style.opacity = '0.99';
                  requestAnimationFrame(() => { v.style.opacity = ''; });
                }}
              />
            )}
          </div>
          {/* File info bar */}
          <div className="w-full flex items-center justify-between border-t border-white/[0.05] px-4 py-3 shrink-0">
            <span className="font-mono text-xs text-zinc-500 truncate" title={file.name}>
              {(() => { const n = sanitizeFileName(file.name); return n.length > 35 ? n.slice(0, 32) + "…" : n; })()}
            </span>
            <span className="text-xs text-zinc-500">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
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

      {/* ─── AI Tools Section — glassmorphism cards ─── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      {(onFixIt || onVisualize || onCheckPolicies || onSafeZone || onCompare) && (() => {
        const tools = [
          {
            key: 'fix',
            icon: Wand2,
            name: 'AI Rewrite',
            description: 'AI-powered copy suggestions',
            credit: 'Free',
            iconColor: '#818cf8',
            onClick: onFixIt,
            loading: fixItLoading
          },
          ...(format === 'static' ? [{
            key: 'visualize',
            icon: Image,
            name: 'Visualize',
            description: 'Static to motion concept',
            credit: '1 credit',
            iconColor: '#10b981',
            onClick: onVisualize,
          }] : []),
          {
            key: 'policy',
            icon: ShieldCheck,
            name: 'Policy Check',
            description: 'Scan for violations',
            credit: 'Free',
            iconColor: '#f59e0b',
            onClick: onCheckPolicies,
            loading: policyLoading
          },
          ...(onSafeZone ? [{
            key: 'safe_zone',
            icon: Shield,
            name: 'Safe Zone',
            description: 'Check platform UI margins',
            credit: 'Free',
            iconColor: '#38bdf8',
            onClick: onSafeZone,
            loading: false,
          }] : []),
        ];
        const colClass = tools.length === 4 ? 'grid-cols-4' : 'grid-cols-3';
        return (
          <div className="w-full">
            <div className={`grid ${colClass} gap-[12px]`}>
              {tools.map((t) => {
                const Icon = t.icon;
                const isLoading = !!t.loading;
                return (
                  <button
                    key={t.key}
                    onClick={() => !isLoading && t.onClick?.()}
                    disabled={isLoading}
                    className="group rounded-[17px] border border-white/[0.06] bg-[rgba(24,24,27,0.5)] py-[23px] px-1 flex flex-col items-center gap-[13px] hover:bg-[rgba(30,30,34,0.7)] hover:border-white/[0.12] transition-colors w-full active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer h-[125px]"
                  >
                    <div
                      className="w-[44px] h-[44px] rounded-[26px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: `${t.iconColor}26` }}
                    >
                      {isLoading ? (
                        <div
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: `${t.iconColor}30`, borderTopColor: t.iconColor }}
                        />
                      ) : (
                        <Icon size={17} style={{ color: t.iconColor }} />
                      )}
                    </div>
                    <span className="text-[15px] font-medium text-[#e4e4e7] text-center leading-tight">{t.name}</span>
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

      {/* ─── Creative Analysis / Verdict + Second Eye ──�� */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.06 }}>
      {(() => {
        const verdictSection = centerSections.find(s => /verdict/i.test(s.title ?? ''));
        const sentences = verdictSection?.content?.trim().split(/(?<=[.!])\s+/).filter(s => s.trim()) ?? [];
        const oneLiner = effectiveVerdict?.headline ?? sentences[0] ?? 'Analysis complete';
        const vState = (effectiveVerdict?.state ?? (scores?.overall && scores.overall >= 8 ? 'ready' : scores?.overall && scores.overall >= 5 ? 'needs_work' : 'not_ready')) as 'not_ready' | 'needs_work' | 'ready';
        const detail = sentences.slice(1, 3).join(' ');

        // Video: always use CreativeVerdictAndSecondEye (Figma node 229:2054)
        if (format === 'video') {
          return (
            <CreativeVerdictAndSecondEye
              verdictState={vState}
              verdictOneLiner={oneLiner}
              verdictDetail={detail}
              secondEyeResult={secondEyeData as SecondEyeResult | null | undefined}
              secondEyeLoading={secondEyeDataLoading}
            />
          );
        }

        // Static: use DesignReviewCard with designReview flags
        if (designReviewData?.flags?.length) {
          const staticFlags = designReviewData.flags.map(f => ({
            category: f.area,
            severity: (f.severity === 'critical' ? 'critical' : f.severity === 'warning' ? 'warning' : 'info') as 'critical' | 'warning' | 'info',
            issue: f.issue,
            fix: f.fix,
          }));
          const topFix2 = designReviewData.flags.find(f => f.severity === 'critical') ?? designReviewData.flags[0];
          return (
            <DesignReviewCard
              verdictState={vState}
              verdictHeadline={designReviewData.overallDesignVerdict ?? oneLiner}
              priorityFix={topFix2?.fix}
              flags={staticFlags}
              onFixWithAI={onFixIt}
            />
          );
        }

        // Fallback for static without design review data
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

      {/* ─── Platform Optimization (organic only) ─── */}
      {/* Static organic: new PlatformOptimizationCard (Figma 493:1439). */}
      {/* Video organic: legacy PlatformScoreCard (unchanged). */}
      {isOrganic && format === 'static' && (platformScores?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.12 }}
          className="mx-4 mb-4"
        >
          <PlatformOptimizationCard
            entries={toPlatformOptimizationEntries(
              (platformScores ?? []) as OrganicPlatformScore[],
            )}
          />
        </motion.div>
      )}
      {isOrganic && format !== 'static' && (platformScores?.length || platformScoresLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.12 }}
        >
          <PlatformScoreCard
            scores={(platformScores ?? []) as OrganicPlatformScore[]}
            loading={platformScoresLoading ?? false}
            platform={platform ?? "all"}
          />
        </motion.div>
      )}


      {/* ─── Motion Test Idea — matches Figma node 217:2401 ─── */}
      {!isOrganic && (() => {
        const motionSection = centerSections.find(s => /motion.*(?:test|idea)/i.test(s.title ?? ''));
        if (!motionSection) return null;
        // Parse AI-derived phase descriptions (comma-separated clauses)
        const conceptText = motionSection.content
          .replace(/^MOTION TEST IDEA:\s*/i, '')
          .replace(/\*\*/g, '').trim();
        const rawPhases = conceptText.split(/,\s*then\s+|,\s*ending\s+with\s+|,\s*followed\s+by\s+/i).filter(Boolean);
        const phaseDescs: [string, string, string] = [
          rawPhases[0]?.trim() || 'Fast-paced jump cuts. High contrast visual hook.',
          rawPhases[1]?.trim() || 'Quick UI zoom. Satisfying synchronized audio cue.',
          rawPhases[2]?.trim() || 'Pulsing CTA button. Instant offer presentation.',
        ];
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.18 }}>
            <MotionTestIdeaCard
              platform={platform ?? undefined}
              phaseDescs={phaseDescs}
              onGenerate={!motionVideoUrl && !motionLoading ? onMotionPreview : undefined}
              isGenerating={!!motionLoading}
              videoUrl={motionVideoUrl}
              error={motionError}
            />
          </motion.div>
        );
      })()}


      {/* Pacing & Retention — VIDEO ONLY, redesigned to match branding */}
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
        const pacingColor = /fast/i.test(pacing ?? '') ? '#10b981' : /slow/i.test(pacing ?? '') ? '#ef4444' : '#f59e0b';
        const pacingBg = /fast/i.test(pacing ?? '') ? 'rgba(16,185,129,0.1)' : /slow/i.test(pacing ?? '') ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
        // Key insight: first non-label sentence
        const sentences = c.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('*') && !/^\*\*/.test(l));
        const keyInsight = sentences.find(s => s.length > 15 && s.length < 100)?.replace(/\*\*/g, '').trim() ?? '';

        return (
          <div key={`pacing-${i}`} className="rounded-2xl border border-white/[0.06] overflow-hidden mt-5 bg-white/[0.015]">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <SectionIcon size={16} className="text-indigo-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-200">Pacing & Retention</span>
              {pacing && (
                <span className="ml-auto text-xs font-semibold rounded-lg px-3 py-1.5"
                  style={{ color: pacingColor, background: pacingBg }}>{pacing}</span>
              )}
            </div>

            <div className="p-5">
              {/* Meta tiles */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {avgScene && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-2">Avg Scene</span>
                    <span className="text-[14px] font-medium text-zinc-100 leading-snug">{avgScene}</span>
                  </div>
                )}
                {pacing && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-2">Pacing</span>
                    <span className="text-[14px] font-semibold" style={{ color: pacingColor }}>{pacing}</span>
                  </div>
                )}
              </div>

              {/* Retention curve bar */}
              <div className="mb-5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-3">Retention Curve</span>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full w-full" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 20%, #10b981 40%, #10b981 60%, #f59e0b 80%, #ef4444 100%)' }} />
                </div>
                <div className="flex justify-between mt-2.5">
                  {['0s', '25%', '50%', '75%', '100%'].map((label, idx) => (
                    <span key={idx} className="text-[10px] font-mono text-zinc-500">{label}</span>
                  ))}
                </div>
              </div>

              {/* Retention hooks prose */}
              {retention && (
                <p className="text-[13px] text-zinc-400 leading-[1.7] mb-5">{retention}</p>
              )}

              {/* Drop-off risk rows */}
              {dropOffs.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-3">Drop-off Risk</span>
                  <div className="flex flex-col gap-2.5">
                    {dropOffs.map((d, j) => {
                      const sevColor = d.severity === 'high' ? '#ef4444' : d.severity === 'medium' ? '#f59e0b' : 'rgba(161,161,170,0.4)';
                      const sevBg = d.severity === 'high' ? 'rgba(239,68,68,0.08)' : d.severity === 'medium' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)';
                      const sevBorder = d.severity === 'high' ? 'rgba(239,68,68,0.15)' : d.severity === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)';
                      return (
                        <div key={j} className="flex items-start gap-3.5 rounded-xl p-4" style={{ background: sevBg, border: `1px solid ${sevBorder}` }}>
                          <span 
                            className="text-[11px] font-semibold font-mono px-2.5 py-1 rounded-md shrink-0"
                            style={{ color: sevColor, background: `${sevColor}15` }}
                          >
                            {d.timestamp}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium text-zinc-200 block leading-snug">{d.risk}</span>
                            {d.note && <span className="text-xs text-zinc-500 block mt-1.5">{d.note}</span>}
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: sevColor }} />
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
    </div>
  );
});
