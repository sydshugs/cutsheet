// DisplayScoreCard.tsx — Display ad scorecard matching PaidAdAnalyzer ScoreCard layout

import { useState, useMemo } from "react";
import {
  AlertTriangle, CheckCircle, XCircle, AlertCircle, Copy, CheckCircle as CheckCircle2,
  ChevronRight, Layers, Type, Layout, Contrast, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreHero } from "./ScoreHero";
import type { DisplayFormat } from "../utils/displayAdUtils";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface DisplayResult {
  overallScore: number;
  scores: {
    hierarchy: number;
    ctaVisibility: number;
    brandClarity: number;
    messageClarity: number;
    visualContrast: number;
  };
  textToImageRatio: string;
  textRatioFlag: boolean;
  improvements: { fix: string; category: string; severity: string }[];
  formatNotes: string;
  verdict: string;
  placementRisk: "low" | "medium" | "high";
  placementRiskNote: string;
}

// ─── STYLES (matching CreativeAnalysis.tsx) ─────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; bgActive: string; color: string; dot: string; icon: typeof Layout; label: string }> = {
  hierarchy: { bg: 'rgba(129,140,248,0.06)', bgActive: 'rgba(129,140,248,0.12)', color: '#818cf8', dot: '#818cf8', icon: Layers, label: 'Hierarchy' },
  typography: { bg: 'rgba(245,158,11,0.06)', bgActive: 'rgba(245,158,11,0.12)', color: '#f59e0b', dot: '#f59e0b', icon: Type, label: 'Typography' },
  layout: { bg: 'rgba(16,185,129,0.06)', bgActive: 'rgba(16,185,129,0.12)', color: '#10b981', dot: '#10b981', icon: Layout, label: 'Layout' },
  contrast: { bg: 'rgba(239,68,68,0.06)', bgActive: 'rgba(239,68,68,0.12)', color: '#ef4444', dot: '#ef4444', icon: Contrast, label: 'Contrast' },
  visual: { bg: 'rgba(168,85,247,0.06)', bgActive: 'rgba(168,85,247,0.12)', color: '#c084fc', dot: '#a855f7', icon: Sparkles, label: 'Visual' },
};

const SEVERITY_STYLES: Record<string, { color: string; bg: string; label: string; priority: number }> = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'HIGH PRIORITY', priority: 1 },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'MEDIUM', priority: 2 },
  low: { color: '#71717a', bg: 'rgba(113,113,122,0.12)', label: 'OPTIONAL', priority: 3 },
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export function DisplayScoreCard({
  result,
  format,
  network,
  dimensions,
}: {
  result: DisplayResult;
  format: DisplayFormat | null;
  network: string;
  mockupUrl: string | null;
  mockupLoading: boolean;
  dimensions: { width: number; height: number };
}) {
  const { scores } = result;
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedFix, setExpandedFix] = useState<number | null>(null);

  const sortedFixes = useMemo(() => {
    return [...result.improvements].sort((a, b) => {
      const aPriority = SEVERITY_STYLES[a.severity]?.priority ?? 3;
      const bPriority = SEVERITY_STYLES[b.severity]?.priority ?? 3;
      return aPriority - bPriority;
    });
  }, [result.improvements]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: result.improvements.length };
    for (const f of result.improvements) counts[f.category] = (counts[f.category] ?? 0) + 1;
    return counts;
  }, [result.improvements]);

  const categories = useMemo(() => {
    const cats = [{ key: 'all', label: `All ${result.improvements.length}`, icon: null as typeof Layout | null }];
    for (const cat of ['hierarchy', 'typography', 'layout', 'contrast']) {
      if (categoryCounts[cat]) {
        const style = CATEGORY_STYLES[cat];
        cats.push({ key: cat, label: style.label, icon: style.icon });
      }
    }
    return cats;
  }, [categoryCounts, result.improvements.length]);

  const filteredFixes = activeFilter === 'all'
    ? sortedFixes
    : sortedFixes.filter(f => f.category === activeFilter);

  const handleCopy = async () => {
    const lines: string[] = [];
    lines.push(`--- CUTSHEET DISPLAY ANALYSIS ---`);
    lines.push(`Overall Score: ${result.overallScore}/10`);
    lines.push("");
    lines.push(`Visual Hierarchy: ${scores.hierarchy}/10`);
    lines.push(`CTA Visibility: ${scores.ctaVisibility}/10`);
    lines.push(`Brand Clarity: ${scores.brandClarity}/10`);
    lines.push(`Message Clarity: ${scores.messageClarity}/10`);
    lines.push(`Visual Contrast: ${scores.visualContrast}/10`);
    lines.push("");
    lines.push(`Text Ratio: ${result.textToImageRatio}`);
    lines.push(`Placement Risk: ${result.placementRisk}`);
    if (result.improvements.length > 0) {
      lines.push("");
      lines.push("IMPROVEMENTS:");
      result.improvements.forEach((imp) => lines.push(`• [${imp.severity.toUpperCase()}] ${imp.fix}`));
    }
    lines.push("");
    lines.push("Scored by Cutsheet — cutsheet.xyz");

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = lines.join("\n");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const heroVerdict = result.overallScore >= 8 ? "Strong" : result.overallScore >= 4 ? "Average" : "Needs Work";

  return (
    <div className="flex flex-col">
      {/* Header — matching ScoreCard */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.05]">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-300">Score Overview</span>
        </div>
        <div className="flex items-center gap-2">
          {format ? (
            <span className="text-[11px] text-cyan-400 bg-cyan-500/10 rounded-full px-2.5 py-0.5">
              {format.key} · {format.name}
            </span>
          ) : (
            <span className="text-[11px] text-amber-400 bg-amber-500/10 rounded-full px-2.5 py-0.5">
              {dimensions.width}×{dimensions.height} · Custom
            </span>
          )}
          <button
            onClick={handleCopy}
            aria-label="Copy scores to clipboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all hover:bg-white/[0.06] px-2.5 py-1.5"
            style={{ background: 'transparent', color: copied ? '#10b981' : '#71717a' }}
          >
            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Main content card — matching ScoreCard */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.015]">
        {/* ScoreHero — score number + benchmark + dimension grid */}
        <ScoreHero
          score={result.overallScore}
          verdict={heroVerdict}
          benchmark={6.5}
          platform="Google Display"
          dimensions={[
            { name: "Hierarchy", score: scores.hierarchy },
            { name: "CTA",      score: scores.ctaVisibility },
            { name: "Brand",    score: scores.brandClarity },
            { name: "Message",  score: scores.messageClarity },
            { name: "Contrast", score: scores.visualContrast },
          ]}
        />
      </div>

      {/* Verdict text */}
      <p className="text-xs text-zinc-500 text-center leading-relaxed mx-6 mt-3 mb-1">{result.verdict}</p>

      {/* Display-specific sections */}
      <div className="px-4 mt-3 flex flex-col gap-3">
        {/* Text-to-image ratio */}
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{
            background: result.textRatioFlag ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)",
            border: `1px solid ${result.textRatioFlag ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
          }}
        >
          {result.textRatioFlag
            ? <AlertTriangle size={14} color="#f59e0b" />
            : <CheckCircle size={14} color="#10b981" />
          }
          <span className="text-xs" style={{ color: result.textRatioFlag ? "#f59e0b" : "#10b981" }}>
            {result.textToImageRatio} text {result.textRatioFlag ? "— Google recommends under 30%" : "— within policy"}
          </span>
        </div>

        {/* Placement risk */}
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{
            background: result.placementRisk === "high" ? "rgba(239,68,68,0.06)" : result.placementRisk === "medium" ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)",
            border: `1px solid ${result.placementRisk === "high" ? "rgba(239,68,68,0.2)" : result.placementRisk === "medium" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {result.placementRisk === "high" && <XCircle size={14} color="#ef4444" />}
            {result.placementRisk === "medium" && <AlertCircle size={14} color="#f59e0b" />}
            {result.placementRisk === "low" && <CheckCircle size={14} color="#10b981" />}
            <span className="text-xs font-medium" style={{
              color: result.placementRisk === "high" ? "#ef4444" : result.placementRisk === "medium" ? "#f59e0b" : "#10b981",
            }}>
              {result.placementRisk === "high" ? "High" : result.placementRisk === "medium" ? "Medium" : "Low"} placement risk
            </span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed m-0">{result.placementRiskNote}</p>
        </div>

        {/* Improvements — filter tabs + styled issue rows (matching CreativeAnalysis) */}
        {result.improvements.length > 0 && (
          <div>

            {/* Category filter tabs */}
            {categories.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {categories.map(cat => {
                  const isActive = activeFilter === cat.key;
                  const catStyle = CATEGORY_STYLES[cat.key];
                  const CatIcon = cat.icon;
                  const count = cat.key === 'all' ? result.improvements.length : categoryCounts[cat.key];
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveFilter(cat.key)}
                      aria-label={`Filter by ${cat.label}`}
                      aria-pressed={isActive}
                      className="flex items-center gap-1.5 cursor-pointer transition-all text-[11px] font-medium px-3 py-1.5 rounded-lg"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.04)',
                        color: isActive ? '#f4f4f5' : '#71717a',
                      }}
                    >
                      {CatIcon && (
                        <CatIcon size={12} style={{ color: isActive ? (catStyle?.color ?? '#f4f4f5') : '#52525b' }} />
                      )}
                      <span>{cat.key === 'all' ? 'All' : cat.label}</span>
                      <span
                        className="text-[10px] font-medium ml-0.5 px-1.5 py-0.5 rounded"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                          color: isActive ? (catStyle?.color ?? '#f4f4f5') : '#52525b',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Issue rows */}
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {filteredFixes.slice(0, 6).map((fix, i) => {
                  const catStyle = CATEGORY_STYLES[fix.category] ?? {
                    bg: 'rgba(161,161,170,0.06)', bgActive: 'rgba(161,161,170,0.1)',
                    color: '#a1a1aa', dot: '#71717a', icon: Layout, label: fix.category,
                  };
                  const severityStyle = SEVERITY_STYLES[fix.severity] ?? SEVERITY_STYLES.low;
                  const CatIcon = catStyle.icon;
                  const isExpanded = expandedFix === i;
                  const isHighPriority = fix.severity === 'high';

                  return (
                    <motion.div
                      key={`${fix.fix}-${i}`}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => setExpandedFix(isExpanded ? null : i)}
                      className="group relative rounded-lg border cursor-pointer transition-all hover:border-white/[0.08]"
                      style={{
                        background: isHighPriority
                          ? 'linear-gradient(135deg, rgba(239,68,68,0.03) 0%, rgba(255,255,255,0.015) 100%)'
                          : 'rgba(255,255,255,0.015)',
                        borderColor: isHighPriority ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <div className="flex items-start gap-3 p-3">
                        {/* Category icon */}
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors"
                          style={{ background: catStyle.bg }}
                        >
                          <CatIcon size={13} style={{ color: catStyle.color }} />
                        </div>

                        {/* Fix content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: severityStyle.bg, color: severityStyle.color }}
                            >
                              {severityStyle.label}
                            </span>
                            <span
                              className="text-[9px] font-medium uppercase tracking-wide"
                              style={{ color: catStyle.color, opacity: 0.8 }}
                            >
                              {catStyle.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-zinc-300 leading-relaxed">{fix.fix}</p>
                        </div>

                        {/* Expand indicator */}
                        <ChevronRight
                          size={14}
                          className="text-zinc-600 shrink-0 transition-transform group-hover:text-zinc-500"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        />
                      </div>

                      {/* Expanded state */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-0 ml-10">
                              <div className="text-[11px] text-zinc-500 leading-relaxed border-t border-white/[0.04] pt-2">
                                <span className="text-zinc-400">Why it matters:</span> This improvement will help increase visual clarity and conversion potential.
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Show more indicator */}
            {filteredFixes.length > 6 && (
              <div className="mt-3 pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] text-zinc-500">
                  +{filteredFixes.length - 6} more suggestions available
                </span>
              </div>
            )}
          </div>
        )}

        {/* Format notes */}
        {result.formatNotes && (
          <div className="bg-white/[0.02] rounded-xl px-3.5 py-2.5">
            <p className="text-xs text-zinc-500 italic leading-relaxed m-0">{result.formatNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
