// BudgetCard — engine-based budget recommendation display (redesigned)

import { AlertCircle, TrendingUp, Pause } from "lucide-react";
import type { EngineBudgetRecommendation } from "../../services/budgetService";
import type { BudgetRecommendation } from "../../services/analyzerService";

const TIER_STYLES = {
  hold:    { color: '#ef4444', label: 'Fix First', icon: Pause },
  limited: { color: '#f59e0b', label: 'Test Budget', icon: AlertCircle },
  test:    { color: '#10b981', label: 'Ready to Scale', icon: TrendingUp },
} as const;

interface BudgetCardProps {
  engineBudget?: EngineBudgetRecommendation | null;
  budget?: BudgetRecommendation | null;
  onNavigateSettings?: () => void;
}

export function BudgetCard({ engineBudget, budget, onNavigateSettings }: BudgetCardProps) {
  // Engine-based budget
  if (engineBudget) {
    const tier = TIER_STYLES[engineBudget.action];
    const TierIcon = tier.icon;

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: `${tier.color}15` }}
            >
              <TierIcon size={12} style={{ color: tier.color }} />
            </div>
            <span className="text-sm font-medium text-zinc-200">{tier.label}</span>
          </div>
          {engineBudget.dailyBudget && (
            <span className="text-sm font-mono font-medium text-zinc-300">
              ${engineBudget.dailyBudget.min}–${engineBudget.dailyBudget.max}/day
            </span>
          )}
        </div>

        {/* Main recommendation card */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          {/* Scale signal */}
          {engineBudget.scaleSignal && (
            <div className="flex items-start gap-2.5 mb-3 pb-3 border-b border-white/[0.05]">
              <TrendingUp size={14} className="text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-[13px] font-medium text-zinc-200 leading-relaxed">
                {engineBudget.scaleSignal}
              </p>
            </div>
          )}

          {/* Advice */}
          <p className="text-xs text-zinc-400 leading-relaxed">
            {engineBudget.advice}
          </p>

          {/* Meta pills */}
          {engineBudget.action !== "hold" && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] text-zinc-500 bg-white/[0.04] rounded-md px-2 py-1">
                {engineBudget.testDuration}
              </span>
              <span className="text-[10px] text-zinc-500 bg-white/[0.04] rounded-md px-2 py-1">
                ROAS {engineBudget.roasTarget}
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded-md px-2 py-1">
                {engineBudget.niche}
              </span>
            </div>
          )}
        </div>

        {/* Footnote */}
        {engineBudget.footnote && (
          <p className="text-[10px] text-zinc-600 mt-3">{engineBudget.footnote}</p>
        )}

        {/* Settings hint */}
        {engineBudget.niche === "Other" && onNavigateSettings && (
          <button
            type="button"
            onClick={onNavigateSettings}
            className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 bg-transparent border-none cursor-pointer p-0 transition-colors"
          >
            Set niche for personalized budgets →
          </button>
        )}
      </div>
    );
  }

  // Legacy budget fallback
  if (budget) {
    const legacyTier = budget.verdict === "Boost It" ? TIER_STYLES.test :
                       budget.verdict === "Test It" ? TIER_STYLES.limited : TIER_STYLES.hold;
    const LegacyIcon = legacyTier.icon;
    return (
      <div>
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.05]">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${legacyTier.color}15` }}>
            <LegacyIcon size={12} style={{ color: legacyTier.color }} />
          </div>
          <span className="text-[13px] font-medium text-zinc-200">{budget.verdict}</span>
          {budget.daily && (
            <span className="text-xs font-mono text-zinc-400 ml-auto">{budget.daily}/day</span>
          )}
        </div>
        <p className="text-[13px] text-zinc-400 leading-relaxed mt-3">
          {budget.reason}
        </p>
      </div>
    );
  }

  return null;
}
