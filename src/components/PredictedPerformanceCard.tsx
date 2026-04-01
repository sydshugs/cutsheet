// PredictedPerformanceCard — pixel-matched to Figma node 217:1893
import { useState } from 'react'
import { ChevronDown, Target, Clock, Activity } from 'lucide-react'
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

const CONFIDENCE_BADGE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  High:   { bg: 'rgba(0,188,125,0.10)', border: 'rgba(0,188,125,0.20)', text: '#00d492', label: 'High confidence' },
  Medium: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.20)', text: '#f59e0b', label: 'Medium confidence' },
  Low:    { bg: 'rgba(113,113,122,0.10)', border: 'rgba(113,113,122,0.20)', text: '#71717a', label: 'Low confidence' },
}

function RangeBar({ low, high, avg }: { low: number; high: number; avg: number }) {
  const MAX = 3.0
  const fillLeft = `${(low / MAX) * 100}%`
  const fillWidth = `${((high - low) / MAX) * 100}%`
  const avgLeft = `${(avg / MAX) * 100}%`

  return (
    <div className="relative pt-6 pb-1">
      {/* Labels */}
      <span className="absolute top-0 left-0 text-[11px] font-medium text-[#71717b]">0%</span>
      <span className="absolute top-0 right-0 text-[11px] font-medium text-[#71717b]">3%+</span>
      {/* Track */}
      <div className="relative h-[4px] w-full bg-[#27272a] rounded-full">
        {/* Avg marker */}
        <div
          className="absolute top-[-4px] w-[2px] h-[13px] bg-[#9f9fa9]"
          style={{ left: avgLeft }}
        />
        {/* Fill */}
        <motion.div
          className="absolute top-0 bottom-0 rounded-full bg-[#6366f1]"
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

  // Build insight string — highlight any numeric score mentions
  const aiInsight = prediction.confidenceReason || ''

  const hasDrivers = prediction.positiveSignals.length > 0 || prediction.negativeSignals.length > 0

  return (
    <div className="w-full bg-[#18181b] border border-white/[0.06] rounded-[17px] p-5 flex flex-col gap-5 font-['Geist',sans-serif] text-[#f4f4f5]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717b]">
          PREDICTED PERFORMANCE
        </span>
        <div
          className="px-[9px] py-[4px] rounded-[6px] border text-[12px] font-medium tracking-[0.025em] whitespace-nowrap"
          style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
        >
          {badge.label}
        </div>
      </div>

      {/* EST. CTR */}
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          {/* Left: label + value */}
          <div className="flex flex-col gap-[9px]">
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#71717b]">
              {primaryLabel}
            </span>
            <div className="flex items-baseline gap-0 leading-none">
              <span className="text-[35px] font-bold tracking-[-0.025em] text-[#f4f4f5]">
                {prediction.ctr.low}%
              </span>
              <span className="text-[26px] font-medium text-[#71717b] mx-2">–</span>
              <span className="text-[35px] font-bold tracking-[-0.025em] text-[#f4f4f5]">
                {prediction.ctr.high}%
              </span>
            </div>
          </div>
          {/* Right: avg label */}
          <span className="text-[13px] font-medium text-[#9f9fa9] self-end mb-1">
            {avgLabel}
          </span>
        </div>

        {/* Range bar */}
        <RangeBar low={prediction.ctr.low} high={prediction.ctr.high} avg={prediction.ctr.benchmark} />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-[17px]">
        {/* CVR Potential */}
        <div
          className="flex flex-col gap-[9px] p-[19px] rounded-[26px] border"
          style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-[7px] text-[#71717b]">
            <Target size={13} />
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] leading-tight">
              {secondaryLabel}
            </span>
          </div>
          <span className="text-[19.5px] font-semibold text-[#e4e4e7]">
            {prediction.cvr.low}% – {prediction.cvr.high}%
          </span>
        </div>

        {/* Creative Fatigue */}
        <div
          className="flex flex-col gap-[9px] p-[19px] rounded-[26px] border"
          style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-[7px] text-[#71717b]">
            <Clock size={13} />
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] leading-tight">
              Creative Fatigue
            </span>
          </div>
          <span className="text-[19.5px] font-semibold text-[#e4e4e7]">
            {fatigueDisplay}
          </span>
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <p className="text-[15px] text-[#9f9fa9] leading-[1.6]">
          {aiInsight}
        </p>
      )}

      {/* What's driving this */}
      {hasDrivers && (
        <div className="flex flex-col border-t border-white/[0.04] pt-[1px]">
          <button
            type="button"
            onClick={() => setDriversOpen(v => !v)}
            className="w-full flex items-center justify-between h-[48px] group focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
          >
            <div className="flex items-center gap-[9px]">
              <Activity size={17} className="text-[#6366f1]" />
              <span className="text-[15px] font-medium text-[#d4d4d8] group-hover:text-white transition-colors">
                What's driving this
              </span>
            </div>
            <ChevronDown
              size={17}
              className="text-[#71717b] transition-transform duration-200"
              style={{ transform: driversOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          <div
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: driversOpen ? 400 : 0 }}
          >
            <p className="text-[14px] text-[#9f9fa9] leading-[1.6] pb-3">
              {[...prediction.positiveSignals, ...prediction.negativeSignals].join(' ')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
