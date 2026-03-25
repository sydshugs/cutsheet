// DisplayResultPage.tsx — Premium Display Ad analyzer result page with mockup preview

import { 
  Eye, Download, RotateCcw, Sparkles, Lock, AlertTriangle, 
  CheckCircle, TrendingUp, ChevronDown
} from "lucide-react";
import { motion } from "framer-motion";
import type { DisplayResult } from "./DisplayScoreCard";
import type { DisplayFormat } from "../utils/displayAdUtils";
import { useState } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────

export interface DisplayResultPageProps {
  result: DisplayResult;
  format: DisplayFormat | null;
  mockupUrl: string | null;
  mockupLoading: boolean;
  dimensions: { width: number; height: number };
  isPro: boolean;
  onAnalyzeAnother: () => void;
  onVisualize: () => void;
  onUpgrade: (feature: string) => void;
}

// ─── SCORE ARC ──────────────────────────────────────────────────────────────

function ScoreArc({ score }: { score: number }) {
  const pct = score / 10;
  const r = 55;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct * 0.75);
  const color = score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle 
          cx={70} cy={70} r={r} fill="none" 
          stroke="rgba(255,255,255,0.06)" 
          strokeWidth={7}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} 
          strokeLinecap="round" 
          transform="rotate(135 70 70)" 
        />
        <circle 
          cx={70} cy={70} r={r} fill="none" 
          stroke={color} 
          strokeWidth={7}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} 
          strokeDashoffset={offset}
          strokeLinecap="round" 
          transform="rotate(135 70 70)" 
          style={{ transition: "stroke-dashoffset 0.8s ease" }} 
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 48, fontWeight: 700, color, fontFamily: "var(--font-mono, monospace)" }}>{score}</span>
        <span style={{ fontSize: 12, color: "#52525b" }}>/10</span>
      </div>
    </div>
  );
}

// ─── METRIC BAR ─────────────────────────────────────────────────────────────

function MetricBar({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: "#a1a1aa", width: 130, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${score * 10}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 13, color, fontFamily: "var(--font-mono, monospace)", width: 25, textAlign: "right", fontWeight: 600 }}>{score}</span>
    </div>
  );
}

// ─── IMPROVEMENT PILL ───────────────────────────────────────────────────────

function ImprovementPill({ 
  category, 
  text 
}: { 
  category: "HIGH VISUAL" | "MEDIUM LAYOUT" | "MEDIUM COPY" | "LOW HOOK" | "LOW VISUAL";
  text: string;
}) {
  const categoryColors: Record<typeof category, { bg: string; border: string; text: string }> = {
    "HIGH VISUAL": { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", text: "#ef4444" },
    "MEDIUM LAYOUT": { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "#f59e0b" },
    "MEDIUM COPY": { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "#f59e0b" },
    "LOW HOOK": { bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)", text: "#9ca3af" },
    "LOW VISUAL": { bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)", text: "#9ca3af" },
  };

  const colors = categoryColors[category];

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
      <span 
        style={{ 
          fontSize: 10, 
          fontWeight: 600, 
          padding: "2px 8px", 
          borderRadius: 6, 
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          color: colors.text,
          whiteSpace: "nowrap",
          marginTop: 1,
        }}
      >
        {category}
      </span>
      <span style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5, flex: 1 }}>{text}</span>
    </div>
  );
}

// ─── PERFORMANCE METRIC ─────────────────────────────────────────────────────

function PerformanceMetric({ 
  label, 
  value, 
  unit,
  badge,
}: { 
  label: string; 
  value: string; 
  unit?: string;
  badge?: { text: string; color: string };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 600, color: badge.color }}>· {badge.text}</span>
        )}
      </div>
      <span style={{ fontSize: 24, fontWeight: 700, color: "#f4f4f5", fontFamily: "var(--font-mono, monospace)" }}>
        {value}{unit && <span style={{ fontSize: 16, color: "#a1a1aa", marginLeft: 4 }}>{unit}</span>}
      </span>
    </div>
  );
}

// ─── EDITORIAL MOCKUP PREVIEW ───────────────────────────────────────────────

function EditorialMockupPreview({ mockupUrl, format }: { mockupUrl: string | null; format: DisplayFormat | null }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}
    >
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Eye size={14} color="#71717a" />
        <span style={{ fontSize: 12, color: "#71717a", fontWeight: 500 }}>Real-life placement preview</span>
      </div>

      {/* Format badge */}
      {format && (
        <span style={{ 
          fontSize: 12, 
          color: "#6366f1", 
          background: "rgba(99,102,241,0.1)", 
          borderRadius: 8, 
          padding: "4px 12px",
          width: "fit-content",
          fontWeight: 500,
        }}>
          {format.key} · {format.name}
        </span>
      )}

      {/* Mockup card */}
      <div style={{ 
        flex: 1,
        borderRadius: 12, 
        border: "1px solid rgba(255,255,255,0.06)", 
        background: "#18181b",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
      }}>
        {mockupUrl ? (
          <img 
            src={mockupUrl} 
            alt="Editorial placement mockup" 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover",
              objectPosition: "center",
            }} 
          />
        ) : (
          <div style={{ textAlign: "center", color: "#52525b" }}>
            <div style={{ fontSize: 12 }}>Mockup preview generating...</div>
          </div>
        )}
      </div>

      {/* Download button */}
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          height: 44,
          borderRadius: 10,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#a1a1aa",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 150ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
          e.currentTarget.style.color = "#6366f1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "#a1a1aa";
        }}
      >
        <Download size={16} />
        Download mockup
      </button>

      {/* Footer note */}
      <p style={{ fontSize: 11, color: "#52525b", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
        Editorial content shown in gray. Real websites may look different.
      </p>
    </motion.div>
  );
}

// ─── PREDICTED PERFORMANCE SECTION ──────────────────────────────────────────

function PredictedPerformance({ result }: { result: DisplayResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      style={{
        padding: 16,
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Predicted Performance
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981" }}>· Above avg</span>
      </div>

      {/* EST. CTR */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase" }}>Est. CTR</span>
          <span style={{ fontSize: 11, color: "#71717a" }}>Google Display Network avg · 0.46%</span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#f4f4f5", fontFamily: "var(--font-mono, monospace)" }}>0.35–0.60%</span>
        
        {/* Slider bar */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "#52525b" }}>0%</span>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "60%", background: "#6366f1", borderRadius: 2 }} />
            <div style={{ position: "absolute", left: "35%", top: "50%", transform: "translate(-50%, -50%)", width: 10, height: 10, borderRadius: "50%", background: "#6366f1", border: "2px solid #09090b" }} />
          </div>
          <span style={{ fontSize: 10, color: "#71717a", whiteSpace: "nowrap" }}>avg 0.46%</span>
          <span style={{ fontSize: 10, color: "#52525b" }}>1%+</span>
        </div>
      </div>

      {/* Two-column metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <PerformanceMetric label="Viewability" value="50–75%" />
        <PerformanceMetric label="CPM Range" value="$0.50–$12" />
      </div>

      {/* Creative fatigue */}
      <div style={{
        padding: 10,
        borderRadius: 10,
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, color: "#a1a1aa" }}>Creative fatigue</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", fontFamily: "var(--font-mono, monospace)" }}>~5–14d</span>
      </div>

      {/* Body text */}
      <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
        Your ad has strong hook potential and clear call-to-action. However, high text density may impact viewability on smaller placements. Consider placement on sites with lower editorial density.
      </p>

      {/* Expandable section */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "#6366f1",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 500,
          padding: 0,
        }}
      >
        What's driving this
        <ChevronDown 
          size={14} 
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} 
        />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            padding: "12px 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12,
            color: "#71717a",
            lineHeight: 1.6,
          }}
        >
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Strong visual hierarchy makes your offer stand out</li>
            <li>CTA button is prominent and easy to find</li>
            <li>Text-heavy design may reduce viewability on mobile</li>
            <li>Brand presence is clear and reinforces trust</li>
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function DisplayResultPage({
  result,
  format,
  mockupUrl,
  mockupLoading,
  dimensions,
  isPro,
  onAnalyzeAnother,
  onVisualize,
  onUpgrade,
}: DisplayResultPageProps) {
  const { scores } = result;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 440px",
      gap: 24,
      height: "100vh",
      padding: 24,
      background: "#09090b",
      overflow: "hidden",
    }}>
      {/* LEFT COLUMN — Mockup Preview */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflow: "auto",
        paddingRight: 12,
      }}>
        <EditorialMockupPreview mockupUrl={mockupUrl} format={format} />
      </div>

      {/* RIGHT COLUMN — Scrollable scores and details */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflow: "auto",
        paddingRight: 12,
      }}>
        {/* CARD 1 — Score Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          style={{
            padding: 20,
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>Score Overview</span>
            {format && (
              <span style={{ fontSize: 11, color: "#6366f1", background: "rgba(99,102,241,0.1)", borderRadius: 6, padding: "2px 8px" }}>
                {format.key} · {format.name}
              </span>
            )}
          </div>

          {/* Network */}
          <span style={{ fontSize: 11, color: "#71717a" }}>Google Display Network</span>

          {/* Score arc */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ScoreArc score={result.overallScore} />
          </div>

          {/* Verdict */}
          <p style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
            {result.verdict}
          </p>

          {/* Metric bars */}
          <div>
            <MetricBar label="Visual Hierarchy" score={scores.hierarchy} />
            <MetricBar label="CTA Visibility" score={scores.ctaVisibility} />
            <MetricBar label="Brand Clarity" score={scores.brandClarity} />
            <MetricBar label="Message Clarity" score={scores.messageClarity} />
            <MetricBar label="Visual Contrast" score={scores.visualContrast} />
          </div>
        </motion.div>

        {/* Warning Pills */}
        {result.textRatioFlag && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{
              padding: "8px 12px",
              borderRadius: 10,
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <AlertTriangle size={14} color="#f59e0b" />
              <span style={{ fontSize: 12, color: "#f59e0b" }}>~60% text — Google recommends under 30%</span>
            </div>

            <div style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>Medium placement risk</span>
              <p style={{ fontSize: 12, color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>
                {result.placementRiskNote}
              </p>
            </div>
          </motion.div>
        )}

        {/* CARD 2 — Improvements */}
        {result.improvements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              padding: 16,
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Improvements
            </span>
            <div>
              {result.improvements.map((imp, i) => (
                <ImprovementPill 
                  key={i}
                  category={
                    i === 0 ? "HIGH VISUAL" :
                    i === 1 ? "MEDIUM LAYOUT" :
                    i === 2 ? "MEDIUM COPY" :
                    i === 3 ? "LOW HOOK" : "LOW VISUAL"
                  }
                  text={imp}
                />
              ))}
            </div>
            {result.formatNotes && (
              <p style={{ fontSize: 11, color: "#71717a", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
                {result.formatNotes}
              </p>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <button
            type="button"
            onClick={onAnalyzeAnother}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: "100%",
              height: 40,
              borderRadius: 10,
              background: "transparent",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#6366f1",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
              e.currentTarget.style.background = "rgba(99,102,241,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <RotateCcw size={14} />
            Analyze another display ad
          </button>

          {isPro ? (
            <button
              type="button"
              onClick={onVisualize}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                width: "100%",
                height: 44,
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#6366f1",
                cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))";
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))";
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
                <Sparkles size={14} />
                Visualize It
              </div>
              <span style={{ fontSize: 10, color: "#818cf8", opacity: 0.8 }}>See your improved ad</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onUpgrade("visualize")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                width: "100%",
                height: 44,
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#52525b",
                cursor: "pointer",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
                <Lock size={14} />
                Visualize It
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>PRO</span>
              </div>
              <span style={{ fontSize: 10, color: "#71717a" }}>Upgrade to see improved ad</span>
            </button>
          )}

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              width: "100%",
              height: 40,
              borderRadius: 10,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              color: "#f59e0b",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245,158,11,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(245,158,11,0.08)";
            }}
          >
            <AlertTriangle size={14} />
            Check Policies
          </button>
        </motion.div>

        {/* CARD 3 — Predicted Performance */}
        <PredictedPerformance result={result} />
      </div>
    </div>
  );
}
