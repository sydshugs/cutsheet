// src/components/PredictedPerformanceCard.tsx
import { useState } from 'react'
import { TrendingUp, Activity, Clock, Zap, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/src/lib/utils'

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

const VS_AVG_CONFIG = {
  above: { label: 'Above Average', bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  at:    { label: 'Average',       bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  below: { label: 'Below Average', bg: 'rgba(239,68,68,0.12)',  text: '#ef4444' },
} as const

const CONFIDENCE_CONFIG = {
  Low:    { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  Medium: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1' },
  High:   { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
} as const

function AnimatedPercent({ value, suffix = '%' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {value}
      </motion.span>
      {suffix}
    </motion.span>
  )
}

function MetricCell({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
      }}
      className="p-3"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} className="text-zinc-500" />
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      </div>
      {children}
    </div>
  )
}

export default function PredictedPerformanceCard({
  prediction,
  platform,
  niche,
}: PredictedPerformanceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)

  const vsAvg = VS_AVG_CONFIG[prediction.ctr.vsAvg]
  const conf = CONFIDENCE_CONFIG[prediction.confidence]
  const platformLabel = platform ?? 'Meta'
  const nicheLabel = niche ?? 'general'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header — toggles card open/closed */}
      <button
        type="button"
        onClick={() => setCardOpen((prev) => !prev)}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
          borderBottom: cardOpen ? '1px solid var(--border)' : 'none',
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
        className="px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Performance Forecast
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: 'var(--ink-muted)', fontFamily: 'var(--mono)' }}>
            {prediction.ctr.low}–{prediction.ctr.high}% CTR
          </span>
          <motion.span animate={{ rotate: cardOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: '#52525b' }}>
            <ChevronDown size={14} />
          </motion.span>
        </div>
      </button>

      {/* Metric grid body — animated collapse */}
      <AnimatePresence initial={false}>
        {cardOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="p-4">
              <div className={cn(
                'grid gap-3',
                prediction.hookRetention ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
              )}>
                {/* CTR Range */}
                <MetricCell label="CTR Range" icon={Activity}>
                  <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                    <AnimatedPercent value={prediction.ctr.low} /> – <AnimatedPercent value={prediction.ctr.high} />
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Avg: {prediction.ctr.benchmark}% in {nicheLabel}/{platformLabel}
                  </p>
                </MetricCell>

                {/* CVR Potential */}
                <MetricCell label="CVR Potential" icon={Zap}>
                  <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                    <AnimatedPercent value={prediction.cvr.low} /> – <AnimatedPercent value={prediction.cvr.high} />
                  </p>
                </MetricCell>

                {/* Hook Retention (video only) */}
                {prediction.hookRetention && (
                  <MetricCell label="Hook Retention" icon={Activity}>
                    <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                      <AnimatedPercent value={prediction.hookRetention.low} /> – <AnimatedPercent value={prediction.hookRetention.high} />
                    </p>
                    <p className="text-[11px] text-zinc-500">watch past 3s</p>
                  </MetricCell>
                )}

                {/* Fatigue Timeline */}
                <MetricCell label="Fatigue Timeline" icon={Clock}>
                  <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                    ~{prediction.fatigueDays.low}–{prediction.fatigueDays.high} days
                  </p>
                  <p className="text-[11px] text-zinc-500">at $400/day</p>
                </MetricCell>
              </div>

              {/* Confidence pill */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: vsAvg.bg, color: vsAvg.text }}
                >
                  {vsAvg.label}
                </span>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 cursor-default"
                  style={{ background: conf.bg, color: conf.text }}
                  title={prediction.confidenceReason}
                >
                  <Info size={10} />
                  {prediction.confidence} Confidence
                </span>
              </div>

              {/* Expandable signals section */}
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-3 w-full flex items-center justify-between px-1 py-1.5 text-[12px] font-medium cursor-pointer rounded hover:bg-white/[0.03] transition-colors"
                style={{ color: 'var(--ink-muted)' }}
              >
                <span>What's driving this</span>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 space-y-2 px-1"
                >
                  {/* Positive signals */}
                  {prediction.positiveSignals.map((signal, i) => (
                    <div key={`pos-${i}`} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[12px]" style={{ color: '#10b981' }}>&#10003;</span>
                      <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>{signal}</span>
                    </div>
                  ))}
                  {/* Negative signals */}
                  {prediction.negativeSignals.map((signal, i) => (
                    <div key={`neg-${i}`} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[12px]" style={{ color: '#f59e0b' }}>&#9888;</span>
                      <span className="text-[12px]" style={{ color: 'var(--ink-muted)' }}>{signal}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Disclaimer */}
              <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
                Predictions are estimates based on creative quality signals. Actual performance depends on audience, budget, landing page, and market conditions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
