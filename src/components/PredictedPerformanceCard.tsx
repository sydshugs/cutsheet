// src/components/PredictedPerformanceCard.tsx — Predicted Performance (Tailwind refactor)
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
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
}

interface PredictedPerformanceCardProps {
  prediction: PredictionResult
  platform?: string
  niche?: string
}

const VERDICT_STYLES = {
  below: { label: 'Below average', bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  at:    { label: 'On track',      bg: 'rgba(251,191,36,0.12)', color: '#d97706' },
  above: { label: 'Above average', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
} as const

function CtrRangeBar({ low, high, nicheAvg }: { low: number; high: number; nicheAvg: number }) {
  const MAX_CTR = 3.0
  const fillLeft = Math.min((low / MAX_CTR) * 100, 100)
  const fillRight = Math.min((high / MAX_CTR) * 100, 100)
  const fillWidth = fillRight - fillLeft
  const avgPos = Math.min((nicheAvg / MAX_CTR) * 100, 100)

  return (
    <div className="mt-3">
      <div className="relative h-1 bg-white/[0.06] rounded-full w-full">
        <div className="absolute h-full bg-indigo-500 rounded-full" style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }} />
        <div className="absolute w-px h-3 bg-zinc-600 rounded-sm -top-1" style={{ left: `${avgPos}%`, transform: 'translateX(-50%)' }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-zinc-700">0%</span>
        <span className="text-[9px] font-mono text-zinc-600">avg {nicheAvg}%</span>
        <span className="text-[9px] font-mono text-zinc-700">{MAX_CTR}%+</span>
      </div>
    </div>
  )
}

export default function PredictedPerformanceCard({ prediction, platform, niche }: PredictedPerformanceCardProps) {
  const [driversOpen, setDriversOpen] = useState(false)
  const verdict = VERDICT_STYLES[prediction.ctr.vsAvg]
  const platformLabel = platform ?? 'Meta'
  const nicheLabel = niche ?? 'general'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Verdict badge */}
      <div className="flex justify-end mb-2">
        <span className="text-[10px] font-medium rounded-full px-2 py-px leading-4" style={{ color: verdict.color, background: verdict.bg }}>
          {verdict.label}
        </span>
      </div>

      {/* Main metric card */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <span className="text-[11px] text-zinc-600">Estimated CTR</span>
        <p className="text-[26px] font-medium font-mono text-zinc-200 mt-0.5 leading-tight">
          {prediction.ctr.low}–{prediction.ctr.high}%
        </p>
        <span className="text-[11px] text-zinc-600">
          Niche avg for {nicheLabel} on {platformLabel}: {prediction.ctr.benchmark}%
        </span>
        <CtrRangeBar low={prediction.ctr.low} high={prediction.ctr.high} nicheAvg={prediction.ctr.benchmark} />

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-white/[0.03] rounded-lg p-3">
            <span className="text-[10px] text-zinc-600 block">Cvr potential</span>
            <p className="text-base font-medium font-mono text-zinc-200 mt-0.5">{prediction.cvr.low}–{prediction.cvr.high}%</p>
            <span className="text-[10px] text-zinc-700">If clicked</span>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3">
            <span className="text-[10px] text-zinc-600 block">{prediction.hookRetention ? 'Hook retention' : 'Conversion rate'}</span>
            <p className="text-base font-medium font-mono text-zinc-200 mt-0.5">
              {prediction.hookRetention ? `${prediction.hookRetention.low}–${prediction.hookRetention.high}%` : `~${((prediction.cvr.low + prediction.cvr.high) / 2).toFixed(1)}%`}
            </p>
            <span className="text-[10px] text-zinc-700">{prediction.hookRetention ? 'Watch past 3s' : `${platformLabel} avg`}</span>
          </div>
        </div>
      </div>

      {/* Fatigue callout */}
      <div className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-xs text-zinc-500">Creative fatigue expected</span>
        </div>
        <span className="text-[13px] font-medium font-mono text-zinc-200">~{prediction.fatigueDays.low}–{prediction.fatigueDays.high} days</span>
      </div>

      {/* Confidence footnote */}
      <div className="flex items-start gap-1.5 mt-2 pl-0.5">
        <span className="w-1 h-1 rounded-full bg-white/15 shrink-0 mt-1.5" />
        <span className="text-[11px] text-zinc-600 leading-relaxed">
          {prediction.confidence} confidence — {prediction.confidenceReason || 'estimates based on creative quality signals.'}
        </span>
      </div>

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
