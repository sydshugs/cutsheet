// BudgetCard — engine-based budget recommendation display (redesigned)

import type { EngineBudgetRecommendation } from "../../services/budgetService";
import type { BudgetRecommendation } from "../../services/analyzerService";

const TIER_STYLES = {
  hold:    { dot: '#ef4444', label: 'Fix First' },
  limited: { dot: '#f59e0b', label: 'Limited test' },
  test:    { dot: '#10b981', label: 'Ready to scale' },
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

    return (
      <div>
        {/* Header — tier dot + label + daily range */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {/* Tier dot */}
            <span
              className="block w-[7px] h-[7px] rounded-full shrink-0"
              style={{ background: tier.dot }}
            />
            <span className="text-[13px] font-medium text-zinc-200">
              {tier.label}
            </span>
          </div>
          {engineBudget.dailyBudget && (
            <span className="text-[13px] font-mono font-medium text-zinc-300">
              ${engineBudget.dailyBudget.min}–${engineBudget.dailyBudget.max}/day
            </span>
          )}
        </div>

        {/* Platform CPM sub-header */}
        {engineBudget.action !== "hold" && (
          <p className="text-[10px] text-zinc-500 mt-2">
            Platform CPM: {engineBudget.platformCPM} · {engineBudget.platform === "all" ? "All platforms" : engineBudget.platform}
          </p>
        )}

        {/* Body */}
        <div className="mt-3 space-y-3">
          {/* Fix note — indigo block at TOP */}
          {engineBudget.scaleSignal && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '0.5px solid rgba(99,102,241,0.18)',
              }}
            >
              <span className="text-indigo-400 mt-px shrink-0">↗</span>
              <p className="text-xs font-medium text-zinc-200 leading-snug">
                {engineBudget.scaleSignal}
              </p>
            </div>
          )}

          {/* Advice text */}
          <p className="text-xs text-zinc-400 leading-relaxed">
            {engineBudget.advice}
          </p>

          {/* Pills row */}
          {engineBudget.action !== "hold" && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-zinc-500 bg-white/5 rounded-full px-2 py-px">
                Test: {engineBudget.testDuration}
              </span>
              <span className="text-[10px] text-zinc-500 bg-white/5 rounded-full px-2 py-px">
                ROAS: {engineBudget.roasTarget}
              </span>
              <span
                className="text-[10px] rounded-full px-2 py-px"
                style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}
              >
                {engineBudget.niche} · {engineBudget.platform === "all" ? "All platforms" : engineBudget.platform}
              </span>
            </div>
          )}
        </div>

        {/* Missing profile hint */}
        {engineBudget.niche === "Other" && onNavigateSettings && (
          <button
            type="button"
            onClick={onNavigateSettings}
            className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 bg-transparent border-none cursor-pointer p-0 transition-colors"
          >
            Set your niche in Settings for personalized budgets →
          </button>
        )}

        {/* Footnote */}
        {engineBudget.footnote && (
          <p className="text-[11px] text-zinc-600 mt-2">{engineBudget.footnote}</p>
        )}
      </div>
    );
  }

  // Legacy budget fallback
  if (budget) {
    const legacyTier = budget.verdict === "Boost It" ? TIER_STYLES.test :
                       budget.verdict === "Test It" ? TIER_STYLES.limited : TIER_STYLES.hold;
    return (
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <span className="block w-[7px] h-[7px] rounded-full" style={{ background: legacyTier.dot }} />
          <span className="text-[13px] font-medium text-zinc-200">{budget.verdict}</span>
          {budget.daily && (
            <span className="text-[12px] font-mono text-zinc-400 ml-auto">{budget.daily}/day</span>
          )}
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed mt-3">
          {budget.reason}
        </p>
      </div>
    );
  }

  return null;
}
