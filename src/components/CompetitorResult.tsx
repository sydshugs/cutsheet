// CompetitorResult.tsx — Full comparison result display

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Zap, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { CompetitorResult as CResult } from "../services/competitorService";
import { ScoreCard } from "./ScoreCard";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "..." : s;
}

function diffColor(diff: number) {
  if (diff > 0) return "#10b981";
  if (diff < 0) return "#ef4444";
  return "#71717a";
}

function diffLabel(diff: number) {
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

const IMPACT_COLORS = { high: "#10b981", medium: "#f59e0b", low: "#71717a" } as const;
const EFFORT_LABELS = { quick: "Quick win", medium: "Medium effort", heavy: "Heavy lift" } as const;

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export function CompetitorResultPanel({
  result,
  yourFileName,
  competitorFileName,
}: {
  result: CResult;
  yourFileName: string;
  competitorFileName: string;
}) {
  const { gap } = result;
  const [yourExpanded, setYourExpanded] = useState(false);
  const [compExpanded, setCompExpanded] = useState(false);

  const yourScores = result.your.scores!;
  const compScores = result.competitor.scores!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── VERDICT BANNER ──────────────────────────────────────────── */}
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          border: `1px solid ${gap.verdict === "winning" ? "rgba(16,185,129,0.2)" : gap.verdict === "losing" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
          background: gap.verdict === "winning" ? "rgba(16,185,129,0.06)" : gap.verdict === "losing" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {gap.verdict === "winning" && <TrendingUp size={20} color="#10b981" />}
          {gap.verdict === "losing" && <TrendingDown size={20} color="#ef4444" />}
          {gap.verdict === "tied" && <Minus size={20} color="#f59e0b" />}
          <span style={{
            fontSize: 18,
            fontWeight: 600,
            color: gap.verdict === "winning" ? "#10b981" : gap.verdict === "losing" ? "#ef4444" : "#f59e0b",
          }}>
            {gap.verdict === "winning" ? "You're winning" : gap.verdict === "losing" ? "Competitor is ahead" : "Evenly matched"}
          </span>
          {gap.scoreDiff !== 0 && (
            <span style={{
              fontSize: 14,
              color: gap.scoreDiff > 0 ? "#10b981" : "#ef4444",
            }}>
              {gap.scoreDiff > 0 ? `+${gap.scoreDiff} points ahead` : `${Math.abs(gap.scoreDiff)} points behind`}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 12,
            color: "#818cf8",
            background: "rgba(99,102,241,0.1)",
            borderRadius: 9999,
            padding: "3px 10px",
          }}>
            {gap.winProbability}% win probability
          </span>
        </div>
        <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.6, margin: 0 }}>{gap.summary}</p>
      </div>

      {/* ── SCORE COMPARISON TABLE ──────────────────────────────────── */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 60px 30px 60px 50px",
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <span style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase" }}>Metric</span>
          <span style={{ fontSize: 11, color: "#52525b", textAlign: "center" }}>{truncate(yourFileName, 12)}</span>
          <span />
          <span style={{ fontSize: 11, color: "#52525b", textAlign: "center" }}>{truncate(competitorFileName, 12)}</span>
          <span style={{ fontSize: 11, color: "#52525b", textAlign: "right" }}>Diff</span>
        </div>
        {/* Rows */}
        {(["overall", "hook", "clarity", "cta", "production"] as const).map((key) => {
          const labels: Record<string, string> = { overall: "Overall", hook: "Hook", clarity: "Clarity", cta: "CTA", production: "Production" };
          const yours = yourScores[key];
          const theirs = compScores[key];
          const diff = yours - theirs;
          return (
            <div
              key={key}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 30px 60px 50px",
                padding: "8px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, color: key === "overall" ? "#f4f4f5" : "#a1a1aa", fontWeight: key === "overall" ? 600 : 400 }}>
                {labels[key]}
              </span>
              <span style={{ fontSize: 14, fontFamily: "var(--font-mono, monospace)", textAlign: "center", color: diffColor(diff), fontWeight: 600 }}>
                {yours}
              </span>
              <span style={{ fontSize: 11, color: "#52525b", textAlign: "center" }}>vs</span>
              <span style={{ fontSize: 14, fontFamily: "var(--font-mono, monospace)", textAlign: "center", color: diffColor(-diff), fontWeight: 600 }}>
                {theirs}
              </span>
              <span style={{
                fontSize: 12,
                fontFamily: "var(--font-mono, monospace)",
                textAlign: "right",
                color: diffColor(diff),
                fontWeight: 500,
              }}>
                {diff !== 0 ? diffLabel(diff) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── STRENGTHS ──────────────────────────────────────────────── */}
      {gap.strengths.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <CheckCircle size={16} color="#10b981" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>Where you're winning</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gap.strengths.map((s, i) => (
              <div key={i} style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(16,185,129,0.04)",
                borderLeft: "2px solid #10b981",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#818cf8", background: "rgba(99,102,241,0.1)", borderRadius: 9999, padding: "2px 8px" }}>{s.metric}</span>
                  <span style={{ fontSize: 12, color: "#71717a" }}>{s.yourScore} vs {s.competitorScore}</span>
                </div>
                <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>{s.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── WEAKNESSES ─────────────────────────────────────────────── */}
      {gap.weaknesses.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <XCircle size={16} color="#ef4444" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>Where they're beating you</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gap.weaknesses.map((w, i) => (
              <div key={i} style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.04)",
                borderLeft: "2px solid #ef4444",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#818cf8", background: "rgba(99,102,241,0.1)", borderRadius: 9999, padding: "2px 8px" }}>{w.metric}</span>
                  <span style={{ fontSize: 12, color: "#71717a" }}>{w.yourScore} vs {w.competitorScore}</span>
                </div>
                <p style={{ fontSize: 13, color: "#a1a1aa", margin: 0, lineHeight: 1.5 }}>{w.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTION PLAN ────────────────────────────────────────────── */}
      {gap.actionPlan.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Zap size={16} color="#f4f4f5" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#f4f4f5" }}>Action plan to win</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gap.actionPlan.map((a, i) => {
              const priorityColors = { 1: "#6366f1", 2: "#f59e0b", 3: "#71717a" };
              const pColor = priorityColors[a.priority] ?? "#71717a";
              return (
                <div
                  key={i}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${a.priority === 1 ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
                    opacity: a.priority === 3 ? 0.8 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: pColor, background: `${pColor}15`, borderRadius: 9999, padding: "2px 8px" }}>
                      P{a.priority}
                    </span>
                    <span style={{ fontSize: 10, color: IMPACT_COLORS[a.impact], background: `${IMPACT_COLORS[a.impact]}15`, borderRadius: 9999, padding: "2px 8px" }}>
                      {a.impact === "high" ? "High impact" : a.impact === "medium" ? "Medium" : "Low"}
                    </span>
                    <span style={{ fontSize: 10, color: "#71717a", background: "rgba(255,255,255,0.04)", borderRadius: 9999, padding: "2px 8px" }}>
                      {EFFORT_LABELS[a.effort] ?? a.effort}
                    </span>
                    <span style={{ fontSize: 10, color: "#818cf8", background: "rgba(99,102,241,0.1)", borderRadius: 9999, padding: "2px 8px" }}>
                      {a.metric}
                    </span>
                  </div>
                  <p style={{ fontSize: a.priority === 1 ? 14 : 13, fontWeight: a.priority === 1 ? 600 : 400, color: "#f4f4f5", margin: 0, lineHeight: 1.5 }}>
                    {a.action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── INDIVIDUAL SCORECARDS (collapsible) ────────────────────── */}
      {[
        { label: "Your Ad", expanded: yourExpanded, toggle: () => setYourExpanded(!yourExpanded), data: result.your },
        { label: "Competitor Ad", expanded: compExpanded, toggle: () => setCompExpanded(!compExpanded), data: result.competitor },
      ].map(({ label, expanded, toggle, data }) => (
        <div key={label}>
          <button
            type="button"
            onClick={toggle}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: expanded ? "12px 12px 0 0" : 12,
              cursor: "pointer",
              color: "#a1a1aa",
              fontSize: 13,
              fontWeight: 500,
              transition: "all 150ms",
            }}
          >
            {label} — Full Scorecard
            <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
          </button>
          <AnimatePresence>
            {expanded && data.scores && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: "hidden", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", borderRadius: "0 0 12px 12px" }}
              >
                <ScoreCard
                  scores={data.scores}
                  improvements={data.improvements}
                  budget={data.budget}
                  hashtags={data.hashtags}
                  fileName={data.fileName}
                  isDark
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
