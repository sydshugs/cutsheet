// src/components/PredictedPerformanceCard.tsx — Predicted Performance card (redesigned to match Figma)
import { useState } from 'react'
import { ChevronRight, Target, Clock, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

export interface PredictionResult {
  ctr: { low: number; high: number; benchmark: number; vsAvg: 'above' | 'at' | 'below' }
  cvr: { low: number; high: number }
  hookRetention: { low: number; high: number } | null
  fatigueDays: { low: number; high: number }
  confidence: 'Low' | 'Medium' | 'High'
  confidenceReason: string
  positiveSignals: string[]
  negativeSignals: string[]
  isOrganic?: boolean
  organicMetrics?: {
    saveRate?: { low: number; high: number; label: string }
    sharePotential?: { low: number; high: number; label: string }
    scrollStop?: number
    longevity?: { label: string; days: number }
  }
}

interface PredictedPerformanceCardProps {
  prediction: PredictionResult
  platform?: string
  niche?: string
  isOrganic?: boolean
  format?: 'video' | 'static'
}

const CONFIDENCE_STYLES = {
  High:   { label: 'High confidence',   badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  Medium: { label: 'Medium confidence', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  Low:    { label: 'Low confidence',    badge: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400' },
} as const

function CtrRangeBar({ low, high, nicheAvg }: { low: number; high: number; nicheAvg: number }) {
  const MAX_CTR = 3.0
  const fillLeft = Math.min((low / MAX_CTR) * 100, 100)
  const fillWidth = Math.min((high / MAX_CTR) * 100, 100) - fillLeft
  const avgPos = Math.min((nicheAvg / MAX_CTR) * 100, 100)

  return (
    <div className="relative pt-6 pb-2 mt-1">
      <div className="absolute top-0 left-0 text-[10px] text-zinc-500 font-medium">0%</div>
      <div className="absolute top-0 right-0 text-[10px] text-zinc-500 font-medium">{MAX_CTR}%+</div>
      <div className="relative h-1 w-full bg-[#27272a] rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-zinc-400 z-10"
          style={{ left: `${avgPos}%` }}
        />
        <motion.div
          initial={{ left: `${fillLeft}%`, width: 0 }}
          animate={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute top-0 bottom-0 bg-[#6366f1] rounded-full"
        />
      </div>
    </div>
  )
}

export default function PredictedPerformanceCard({ prediction, platform, niche, isOrganic, format }: PredictedPerformanceCardProps) {
  const [driversOpen, setDriversOpen] = useState(false)
  const organic = isOrganic || prediction.isOrganic
  const confidence = CONFIDENCE_STYLES[prediction.confidence]
  const platformLabel = platform ?? 'Meta'

  // Primary metric labels
  const primaryLabel = organic ? 'Est. Save Rate' : 'Est. CTR'
  const secondaryLabel = organic ? 'Share / DM Potential' : 'CVR Potential'

  // Fatigue display
  const fatigueDisplay = organic && prediction.organicMetrics?.longevity
    ? `~${prediction.organicMetrics.longevity.days}d · ${prediction.organicMetrics.longevity.label}`
    : `~${prediction.fatigueDays.low}–${prediction.fatigueDays.high} days`

  // Avg label
  const avgLabel = `${platformLabel} avg · ${prediction.ctr.benchmark}%`

  // AI insight — build from confidence reason + top signal
  const topPositive = prediction.positiveSignals[0] ?? null
  const topNegative = prediction.negativeSignals[0] ?? null
  const aiInsight = prediction.confidenceReason
    || [topPositive, topNegative].filter(Boolean).join(' ')

  return (
    <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[16px] p-5 flex flex-col gap-5 font-['Geist',sans-serif] text-[#f4f4f5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PREDICTED PERFORMANCE
        </span>
        <div className={`px-2 py-1 rounded-md border text-[11px] font-medium tracking-wide ${confidence.badge}`}>
          {confidence.label}
        </div>
      </div>

      {/* EST. CTR Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {primaryLabel}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[32px] font-bold leading-none tracking-tight text-[#f4f4f5]">
                {prediction.ctr.low}% <span className="text-zinc-500 font-medium text-[24px] mx-0.5">–</span> {prediction.ctr.high}%
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 mb-1">
            <span className="text-[12px] font-medium text-zinc-400">{avgLabel}</span>
          </div>
        </div>

        {/* Range Bar */}
        <CtrRangeBar low={prediction.ctr.low} high={prediction.ctr.high} nicheAvg={prediction.ctr.benchmark} />
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Target className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.10em]">{secondaryLabel}</span>
          </div>
          <span className="text-[18px] font-semibold text-zinc-200">
            {prediction.cvr.low}% – {prediction.cvr.high}%
          </span>
        </div>

        <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.10em]">Creative Fatigue</span>
          </div>
          <span className="text-[18px] font-semibold text-zinc-200">
            {fatigueDisplay}
          </span>
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <p className="text-[14px] text-zinc-400 leading-[1.6]">
          {aiInsight}
        </p>
      )}

      {/* Deep Dive Row */}
      {(prediction.positiveSignals.length > 0 || prediction.negativeSignals.length > 0) && (
        <div className="flex flex-col mt-2 border-t border-white/[0.04]">
          <button
            type="button"
            onClick={() => setDriversOpen(v => !v)}
            aria-expanded={driversOpen}
            className="flex items-center justify-between h-[44px] group focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#6366f1]" />
              <span className="text-[14px] font-medium text-zinc-300 group-hover:text-white transition-colors">
                What's driving this
              </span>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${driversOpen ? 'rotate-90' : ''}`}
            />
          </button>
          {driversOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
              className="pb-4 text-[13px] text-zinc-400 leading-[1.6]"
            >
              {prediction.positiveSignals.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {prediction.positiveSignals.map((s, i) => (
                    <div key={`pos-${i}`} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full shrink-0 mt-px flex items-center justify-center bg-emerald-500/10">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {prediction.negativeSignals.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {prediction.negativeSignals.map((s, i) => (
                    <div key={`neg-${i}`} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full shrink-0 mt-px flex items-center justify-center bg-amber-500/10">
                        <svg width="8" height="2" viewBox="0 0 8 2"><rect width="8" height="2" rx="1" fill="#f59e0b"/></svg>
                      </div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
