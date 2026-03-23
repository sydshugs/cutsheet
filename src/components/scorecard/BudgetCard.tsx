// BudgetCard — engine-based budget recommendation display

import { AlertTriangle, AlertCircle, TrendingUp, ArrowUpRight } from "lucide-react";
import type { EngineBudgetRecommendation } from "../../services/budgetService";
import type { BudgetRecommendation } from "../../services/analyzerService";

interface BudgetCardProps {
  engineBudget?: EngineBudgetRecommendation | null;
  budget?: BudgetRecommendation | null;
  onNavigateSettings?: () => void;
}

const ACTION_STYLE = {
  hold:    { color: "var(--error)",   bg: "var(--score-weak-bg)",    border: "var(--score-weak-border)" },
  limited: { color: "var(--warn)",    bg: "var(--score-average-bg)", border: "var(--score-average-border)" },
  test:    { color: "var(--success)", bg: "var(--score-excellent-bg)", border: "var(--score-excellent-border)" },
} as const;

function getActionStyle(action: string) {
  return ACTION_STYLE[action as keyof typeof ACTION_STYLE] ?? ACTION_STYLE.test;
}

function getActionLabel(budget: EngineBudgetRecommendation): string {
  if (budget.action === "hold") return "Hold — fix creative first";
  if (budget.dailyBudget) {
    const range = `$${budget.dailyBudget.min}–$${budget.dailyBudget.max}/day`;
    return budget.action === "test" ? `Test at ${range}` : `Scale at ${range}`;
  }
  return budget.label;
}

export function BudgetCard({ engineBudget, budget, onNavigateSettings }: BudgetCardProps) {
  // Engine-based budget
  if (engineBudget) {
    const style = getActionStyle(engineBudget.action);

    return (
      <div className="px-5 border-t border-white/5 mt-4 pt-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Budget Recommendation
        </p>

        {/* Main card */}
        <div style={{ padding: 12, borderRadius: 10, border: `1px solid ${style.border}`, background: style.bg }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {engineBudget.action === "hold"    && <AlertTriangle size={16} color={style.color} />}
            {engineBudget.action === "limited" && <AlertCircle   size={16} color={style.color} />}
            {engineBudget.action === "test"    && <TrendingUp    size={16} color={style.color} />}
            <span style={{ fontSize: 13, fontWeight: 600, color: style.color }}>
              {getActionLabel(engineBudget)}
            </span>
          </div>

          {/* Platform CPM */}
          {engineBudget.action !== "hold" && (
            <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 6 }}>
              Platform CPM: {engineBudget.platformCPM}
            </p>
          )}

          {/* Advice */}
          <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 8, lineHeight: 1.5 }}>
            {engineBudget.advice}
          </p>

          {/* Scale signal */}
          {engineBudget.scaleSignal && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 8 }}>
              <ArrowUpRight size={12} color="var(--accent-text)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--accent-text)", fontStyle: "italic", lineHeight: 1.4 }}>
                {engineBudget.scaleSignal}
              </span>
            </div>
          )}

          {/* Test duration + ROAS target */}
          {engineBudget.action !== "hold" && (
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Test: {engineBudget.testDuration}</span>
              <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>ROAS: {engineBudget.roasTarget}</span>
            </div>
          )}
        </div>

        {/* Niche + platform pill */}
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--ink-faint)", background: "var(--surface)", borderRadius: "var(--radius-full)", padding: "2px 8px" }}>
            {engineBudget.niche} · {engineBudget.platform === "all" ? "All platforms" : engineBudget.platform}
          </span>
        </div>

        {/* Missing profile hint */}
        {engineBudget.niche === "Other" && onNavigateSettings && (
          <button
            type="button"
            onClick={onNavigateSettings}
            style={{
              marginTop: 8, fontSize: 11, color: "var(--accent)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              textDecoration: "underline", textDecorationColor: "var(--accent-border)",
            }}
          >
            Set your niche in Settings for personalized budgets &rarr;
          </button>
        )}

        {/* Footnote */}
        {engineBudget.footnote && (
          <p style={{ fontSize: 11, color: "var(--ink-tertiary)", marginTop: 8 }}>{engineBudget.footnote}</p>
        )}
      </div>
    );
  }

  // Legacy budget fallback
  if (budget) {
    return (
      <div className="px-5 border-t border-white/5 mt-4 pt-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Budget Recommendation
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {budget.reason || `${budget.verdict} — ${budget.daily}/day`}
        </p>
      </div>
    );
  }

  return null;
}
