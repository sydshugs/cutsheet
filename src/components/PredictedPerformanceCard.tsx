// src/components/PredictedPerformanceCard.tsx — Predicted Performance (redesigned)
import { useState } from 'react'
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
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
}

const VERDICT_STYLES = {
  below: { label: 'Below avg', color: '#ef4444', icon: TrendingDown },
  at:    { label: 'On track', color: '#f59e0b', icon: Minus },
  above: { label: 'Above avg', color: '#10b981', icon: TrendingUp },
} as const

function CtrRangeBar({ low, high, nicheAvg }: { low: number; high: number; nicheAvg: number }) {
  const MAX_CTR = 3.0
  const fillLeft = Math.min((low / MAX_CTR) * 100, 100)
  const fillRight = Math.min((high / MAX_CTR) * 100, 100)
  const fillWidth = fillRight - fillLeft
  const avgPos = Math.min((nicheAvg / MAX_CTR) * 100, 100)

  return (
    <div className="mt-4">
      <div className="relative h-1.5 bg-white/[0.04] rounded-full w-full">
        <div className="absolute h-full bg-indigo-500/80 rounded-full" style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }} />
        <div 
          className="absolute w-0.5 h-3 bg-zinc-500 rounded-full" 
          style={{ left: `${avgPos}%`, transform: 'translateX(-50%)', top: '-3px' }} 
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] font-mono text-zinc-600">0%</span>
        <span className="text-[10px] font-mono text-zinc-500">avg {nicheAvg}%</span>
        <span className="text-[10px] font-mono text-zinc-600">{MAX_CTR}%+</span>
      </div>
    </div>
  )
}

export default function PredictedPerformanceCard({ prediction, platform, niche, isOrganic }: PredictedPerformanceCardProps) {
  const [driversOpen, setDriversOpen] = useState(false)
  const organic = isOrganic || prediction.isOrganic
  const verdict = VERDICT_STYLES[prediction.ctr.vsAvg]
  const VerdictIcon = verdict.icon
  const platformLabel = platform ?? 'Meta'
  const nicheLabel = niche ?? 'general'

  // Labels swap for organic
  const primaryLabel = organic ? 'Save Rate' : 'Est. CTR'
  const secondaryLabel = organic ? 'Share / DM Potential' : 'CVR Potential'
  const tertiaryLabel = organic
    ? 'Scroll-Stop Score'
    : (prediction.hookRetention ? 'Hook Retention' : 'Conv. Rate')
  const fatigueLabel = organic ? 'Post longevity' : 'Creative fatigue'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header with verdict */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Predicted Performance</span>
        <div className="flex items-center gap-1.5" style={{ color: verdict.color }}>
          <VerdictIcon size={12} />
          <span className="text-[11px] font-medium">{verdict.label}</span>
        </div>
      </div>

      {/* Main CTR metric */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wide">{primaryLabel}</span>
            <p className="text-2xl font-medium font-mono text-zinc-100 mt-1 tracking-tight">
              {prediction.ctr.low}–{prediction.ctr.high}%
            </p>
          </div>
          <span className="text-[11px] text-zinc-500 text-right">
            {nicheLabel} avg<br/>{prediction.ctr.benchmark}%
          </span>
        </div>
        <CtrRangeBar low={prediction.ctr.low} high={prediction.ctr.high} nicheAvg={prediction.ctr.benchmark} />
      </div>

      {/* Secondary metrics grid */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">{secondaryLabel}</span>
          <p className="text-lg font-medium font-mono text-zinc-200">{prediction.cvr.low}–{prediction.cvr.high}%</p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">
            {tertiaryLabel}
          </span>
          <p className="text-lg font-medium font-mono text-zinc-200">
            {prediction.hookRetention ? `${prediction.hookRetention.low}–${prediction.hookRetention.high}%` : `~${((prediction.cvr.low + prediction.cvr.high) / 2).toFixed(1)}%`}
          </p>
        </div>
      </div>

      {/* Fatigue indicator */}
      <div className="flex items-center justify-between mt-3 py-2.5 px-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/10">
        <span className="text-xs text-zinc-400">{fatigueLabel}</span>
        <span className="text-sm font-medium font-mono text-amber-400">
          {organic && prediction.organicMetrics?.longevity
            ? `~${prediction.organicMetrics.longevity.days}d · ${prediction.organicMetrics.longevity.label}`
            : `~${prediction.fatigueDays.low}–${prediction.fatigueDays.high}d`}
        </span>
      </div>

      {/* Confidence note */}
      <p className="text-[11px] text-zinc-600 mt-3 leading-relaxed">
        {prediction.confidence} confidence · {prediction.confidenceReason || 'Based on creative quality signals.'}
      </p>

      {/* What's driving this */}
      {(prediction.positiveSignals.length > 0 || prediction.negativeSignals.length > 0) && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setDriversOpen(prev => !prev)}
            aria-expanded={driversOpen}
            aria-label={`${driversOpen ? 'Collapse' : 'Expand'} driving factors`}
            className="w-full flex items-center justify-between py-1.5 px-0.5 bg-transparent border-none cursor-pointer text-xs font-medium text-zinc-500 font-sans focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none rounded"
          >
            <span>What's driving this</span>
            <ChevronDown size={14} className="text-zinc-700 transition-transform duration-200" style={{ transform: driversOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
          <div className="overflow-hidden transition-all duration-200" style={{ maxHeight: driversOpen ? 300 : 0 }}>
            <div className="flex flex-col pt-0.5 pb-1">
              {prediction.positiveSignals.map((signal, i) => {
                const parts = signal.split(/[.–—]\s*/)
                const label = parts[0]?.trim() ?? signal
                const note = parts.slice(1).join('. ').trim()
                return (
                  <div key={`pos-${i}`} className="flex items-start gap-2.5 py-[7px]" style={{ borderBottom: i < prediction.positiveSignals.length - 1 || prediction.negativeSignals.length > 0 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div className="w-4 h-4 rounded-full shrink-0 mt-px flex items-center justify-center bg-emerald-500/10">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium text-zinc-200">{label}</span>
                      {note && <span className="text-[11px] text-zinc-600 block mt-px">{note}</span>}
                    </div>
                  </div>
                )
              })}
              {prediction.negativeSignals.map((signal, i) => {
                const parts = signal.split(/[.–—]\s*/)
                const label = parts[0]?.trim() ?? signal
                const note = parts.slice(1).join('. ').trim()
                return (
                  <div key={`neg-${i}`} className="flex items-start gap-2.5 py-[7px]" style={{ borderBottom: i < prediction.negativeSignals.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div className="w-4 h-4 rounded-full shrink-0 mt-px flex items-center justify-center bg-amber-500/10">
                      <svg width="8" height="2" viewBox="0 0 8 2"><rect width="8" height="2" rx="1" fill="#f59e0b"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium text-zinc-200">{label}</span>
                      {note && <span className="text-[11px] text-zinc-600 block mt-px">{note}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
