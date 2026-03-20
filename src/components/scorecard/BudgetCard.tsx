// BudgetCard — engine-based budget recommendation display

import { AlertTriangle, AlertCircle, TrendingUp, ArrowUpRight } from "lucide-react";
import type { EngineBudgetRecommendation } from "../../services/budgetService";
import type { BudgetRecommendation } from "../../services/analyzerService";

interface BudgetCardProps {
  engineBudget?: EngineBudgetRecommendation | null;
  budget?: BudgetRecommendation | null;
  onNavigateSettings?: () => void;
}

export function BudgetCard({ engineBudget, budget, onNavigateSettings }: BudgetCardProps) {
  // Engine-based budget
  if (engineBudget) {
    const actionColor =
      engineBudget.action === "hold" ? "#ef4444" :
      engineBudget.action === "limited" ? "#f59e0b" : "#10b981";

    const actionBg =
      engineBudget.action === "hold" ? "rgba(239,68,68,0.06)" :
      engineBudget.action === "limited" ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)";

    const actionBorder =
      engineBudget.action === "hold" ? "rgba(239,68,68,0.2)" :
      engineBudget.action === "limited" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)";

    return (
      <div className="px-5 border-t border-white/5 mt-4 pt-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Budget Recommendation
        </p>

        {/* Main card */}
        <div style={{ padding: 12, borderRadius: 10, border: `1px solid ${actionBorder}`, background: actionBg }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {engineBudget.action === "hold" && <AlertTriangle size={16} color={actionColor} />}
            {engineBudget.action === "limited" && <AlertCircle size={16} color={actionColor} />}
            {engineBudget.action === "test" && <TrendingUp size={16} color={actionColor} />}
            <span style={{ fontSize: 13, fontWeight: 600, color: actionColor }}>
              {engineBudget.label}
              {engineBudget.dailyBudget && ` · $${engineBudget.dailyBudget.min}–$${engineBudget.dailyBudget.max}/day`}
            </span>
          </div>

          {/* Platform CPM */}
          {engineBudget.action !== "hold" && (
            <p style={{ fontSize: 11, color: "#71717a", marginTop: 6 }}>
              Platform CPM: {engineBudget.platformCPM}
            </p>
          )}

          {/* Advice */}
          <p style={{ fontSize: 12, color: "#a1a1aa", marginTop: 8, lineHeight: 1.5 }}>
            {engineBudget.advice}
          </p>

          {/* Scale signal */}
          {engineBudget.scaleSignal && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginTop: 8 }}>
              <ArrowUpRight size={12} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#818cf8", fontStyle: "italic", lineHeight: 1.4 }}>
                {engineBudget.scaleSignal}
              </span>
            </div>
          )}

          {/* Test duration + ROAS target */}
          {engineBudget.action !== "hold" && (
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "#52525b" }}>Test: {engineBudget.testDuration}</span>
              <span style={{ fontSize: 11, color: "#52525b" }}>ROAS: {engineBudget.roasTarget}</span>
            </div>
          )}
        </div>

        {/* Niche + platform pill */}
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#71717a", background: "rgba(255,255,255,0.04)", borderRadius: 9999, padding: "2px 8px" }}>
            {engineBudget.niche} · {engineBudget.platform === "all" ? "All platforms" : engineBudget.platform}
          </span>
        </div>

        {/* Missing profile hint */}
        {engineBudget.niche === "Other" && onNavigateSettings && (
          <button
            type="button"
            onClick={onNavigateSettings}
            style={{
              marginTop: 8, fontSize: 11, color: "#6366f1",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              textDecoration: "underline", textDecorationColor: "rgba(99,102,241,0.3)",
            }}
          >
            Set your niche in Settings for personalized budgets &rarr;
          </button>
        )}

        {/* Footnote */}
        {engineBudget.footnote && (
          <p style={{ fontSize: 11, color: "#52525b", marginTop: 8 }}>{engineBudget.footnote}</p>
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
