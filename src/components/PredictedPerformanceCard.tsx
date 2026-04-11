// PredictedPerformanceCard — pixel-matched to Figma node 217:1893
import { useState } from 'react'
import { ChevronDown, Activity } from 'lucide-react'
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
  prediction: PredictionResult | null
  platform?: string
  niche?: string
  isOrganic?: boolean
  format?: 'video' | 'static'
  loading?: boolean
}

const CONFIDENCE_BADGE: Record<string, { className: string; label: string }> = {
  High:   { className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'High confidence' },
  Medium: { className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',       label: 'Medium confidence' },
  Low:    { className: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',           label: 'Low confidence' },
}

function RangeBar({ low, high, avg }: { low: number; high: number; avg: number }) {
  const MAX = 3.0
  const fillLeft = `${(low / MAX) * 100}%`
  const fillWidth = `${((high - low) / MAX) * 100}%`
  const avgLeft = `${(avg / MAX) * 100}%`

  return (
    <div className="w-full mt-1 mb-4">
      {/* Scale labels */}
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-zinc-600">0%</span>
        <span className="text-[10px] text-zinc-600">3%+</span>
      </div>
      {/* Track */}
      <div className="relative h-[4px] w-full bg-zinc-800 rounded-full">
        {/* Avg marker */}
        <div
          className="absolute w-[2px] h-[12px] bg-zinc-400 top-[-4px]"
          style={{ left: avgLeft }}
        />
        {/* Fill */}
        <motion.div
          className="absolute top-0 bottom-0 rounded-full bg-indigo-500"
          initial={{ left: fillLeft, width: 0 }}
          animate={{ left: fillLeft, width: fillWidth }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function PredictedPerformanceCard({ prediction, platform, niche: _niche, isOrganic, loading }: PredictedPerformanceCardProps) {
  const [driversOpen, setDriversOpen] = useState(false)

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[17px] p-5 flex flex-col gap-5 font-['Geist',sans-serif]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717b]">PREDICTED PERFORMANCE</span>
          <div className="h-[30px] w-[130px] rounded-[6px] bg-white/[0.04] animate-pulse" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-[12px] w-[80px] rounded bg-white/[0.04] animate-pulse" />
          <div className="h-[42px] w-[180px] rounded bg-white/[0.04] animate-pulse" />
          <div className="h-[4px] w-full rounded-full bg-white/[0.04] animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 gap-[17px]">
          <div className="h-[80px] rounded-[26px] bg-white/[0.03] animate-pulse" />
          <div className="h-[80px] rounded-[26px] bg-white/[0.03] animate-pulse" />
        </div>
      </div>
    )
  }

  // No data — component should not be rendered (gated by parent)
  if (!prediction) return null;

  const organic = isOrganic || prediction.isOrganic
  const badge = CONFIDENCE_BADGE[prediction.confidence] ?? CONFIDENCE_BADGE.Medium
  const platformLabel = platform ?? 'Meta'

  const primaryLabel = organic ? 'Est. Save Rate' : 'Est. CTR'
  const secondaryLabel = organic ? 'Share / DM Potential' : 'CVR Potential'

  const fatigueDisplay = organic && prediction.organicMetrics?.longevity
    ? `~${prediction.organicMetrics.longevity.days}d`
    : `~${Math.round((prediction.fatigueDays.low + prediction.fatigueDays.high) / 2)} days`

  const avgLabel = `${platformLabel} avg · ${prediction.ctr.benchmark}%`

  const aiInsight = prediction.confidenceReason || ''

  const hasDrivers = prediction.positiveSignals.length > 0 || prediction.negativeSignals.length > 0

  return (
    <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[17px] p-5 flex flex-col font-['Geist',sans-serif] text-[#f4f4f5]">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          PREDICTED PERFORMANCE
        </span>
        <span
          className={`text-[10px] font-medium rounded-full px-3 py-1 whitespace-nowrap ${badge.className}`}
          title="Prediction reliability based on benchmark data and signal clarity — not a quality rating"
        >
          {badge.label}
        </span>
      </div>

      {/* EST. CTR */}
      <div className="mb-1">
        <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          {primaryLabel}
        </span>
        {/* Range */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[28px] font-bold text-white leading-none">
            {prediction.ctr.low}%
          </span>
          <span className="text-[20px] text-zinc-500 leading-none">—</span>
          <span className="text-[28px] font-bold text-white leading-none">
            {prediction.ctr.high}%
          </span>
        </div>
        {/* Avg label — own line below range */}
        <span className="block text-[11px] text-zinc-500 mb-3">
          {avgLabel}
        </span>
        {/* Range bar */}
        <RangeBar low={prediction.ctr.low} high={prediction.ctr.high} avg={prediction.ctr.benchmark} />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* CVR / Save Rate */}
        <div className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 mb-2">{secondaryLabel}</span>
          <span className="text-[16px] font-semibold text-white leading-snug">
            {prediction.cvr.low}%&nbsp;–&nbsp;{prediction.cvr.high}%
          </span>
        </div>
        {/* Creative Fatigue */}
        <div className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 mb-2">Creative Fatigue</span>
          <span className="text-[16px] font-semibold text-white leading-snug">
            {fatigueDisplay}
          </span>
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <p className="text-[12px] text-zinc-400 leading-[1.6] mb-4">
          {aiInsight}
        </p>
      )}

      {/* What's driving this */}
      {hasDrivers && (
        <div className="flex flex-col border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setDriversOpen(v => !v)}
            className="w-full flex items-center justify-between py-3 group focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
          >
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-indigo-400" />
              <span className="text-[13px] font-medium text-zinc-300 group-hover:text-white transition-colors duration-150">
                What's driving this
              </span>
            </div>
            <ChevronDown
              size={14}
              className="text-zinc-500 transition-transform duration-200"
              style={{ transform: driversOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          <div
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: driversOpen ? 400 : 0 }}
          >
            <p className="text-[12px] text-zinc-400 leading-[1.6] pb-3">
              {[...prediction.positiveSignals, ...prediction.negativeSignals].join(' ')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
