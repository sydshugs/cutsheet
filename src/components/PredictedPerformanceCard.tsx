// src/components/PredictedPerformanceCard.tsx — Predicted Performance (redesigned)
// Range bar, verdict header, fatigue callout, confidence footnote
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

// ─── VERDICT BADGE ───────────────────────────────────────────────────────────

const VERDICT_STYLES = {
  below: { label: 'Below average', bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
  at:    { label: 'On track',      bg: 'rgba(251,191,36,0.12)', color: '#d97706' },
  above: { label: 'Above average', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
} as const

// ─── CTR RANGE BAR ───────────────────────────────────────────────────────────

function CtrRangeBar({ low, high, nicheAvg }: { low: number; high: number; nicheAvg: number }) {
  const MAX_CTR = 3.0
  const fillLeft = Math.min((low / MAX_CTR) * 100, 100)
  const fillRight = Math.min((high / MAX_CTR) * 100, 100)
  const fillWidth = fillRight - fillLeft
  const avgPos = Math.min((nicheAvg / MAX_CTR) * 100, 100)

  return (
    <div style={{ marginTop: 12 }}>
      {/* Track */}
      <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, width: '100%' }}>
        {/* CTR range fill */}
        <div
          style={{
            position: 'absolute',
            left: `${fillLeft}%`,
            width: `${fillWidth}%`,
            height: '100%',
            background: '#6366f1',
            borderRadius: 99,
          }}
        />
        {/* Niche avg marker */}
        <div
          style={{
            position: 'absolute',
            left: `${avgPos}%`,
            top: -4,
            width: 1.5,
            height: 12,
            background: '#52525b',
            borderRadius: 1,
            transform: 'translateX(-50%)',
          }}
        />
      </div>
      {/* Labels below */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 9, color: '#3f3f46', fontFamily: 'var(--mono)' }}>0%</span>
        <span style={{ fontSize: 9, color: '#52525b', fontFamily: 'var(--mono)' }}>avg {nicheAvg}%</span>
        <span style={{ fontSize: 9, color: '#3f3f46', fontFamily: 'var(--mono)' }}>{MAX_CTR}%+</span>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function PredictedPerformanceCard({
  prediction,
  platform,
  niche,
}: PredictedPerformanceCardProps) {
  const [driversOpen, setDriversOpen] = useState(false)
  const verdict = VERDICT_STYLES[prediction.ctr.vsAvg]
  const platformLabel = platform ?? 'Meta'
  const nicheLabel = niche ?? 'general'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Verdict badge (outside card, in header context from CollapsibleSection) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: verdict.color,
            background: verdict.bg,
            borderRadius: 99,
            padding: '2px 8px',
            lineHeight: '16px',
          }}
        >
          {verdict.label}
        </span>
      </div>

      {/* Main metric card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '14px 16px',
        }}
      >
        {/* CTR range — primary metric */}
        <div>
          <span style={{ fontSize: 11, color: '#52525b' }}>Estimated CTR</span>
          <p style={{ fontSize: 26, fontWeight: 500, fontFamily: 'var(--mono)', color: '#e4e4e7', margin: '2px 0 0', lineHeight: 1.2 }}>
            {prediction.ctr.low}–{prediction.ctr.high}%
          </p>
          <span style={{ fontSize: 11, color: '#52525b' }}>
            Niche avg for {nicheLabel} on {platformLabel}: {prediction.ctr.benchmark}%
          </span>
        </div>

        {/* Range bar */}
        <CtrRangeBar low={prediction.ctr.low} high={prediction.ctr.high} nicheAvg={prediction.ctr.benchmark} />

        {/* Secondary metrics — 2 column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
            <span style={{ fontSize: 10, color: '#52525b' }}>Cvr potential</span>
            <p style={{ fontSize: 16, fontWeight: 500, fontFamily: 'var(--mono)', color: '#e4e4e7', margin: '2px 0 0' }}>
              {prediction.cvr.low}–{prediction.cvr.high}%
            </p>
            <span style={{ fontSize: 10, color: '#3f3f46' }}>If clicked</span>
          </div>
          {prediction.hookRetention && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
              <span style={{ fontSize: 10, color: '#52525b' }}>Hook retention</span>
              <p style={{ fontSize: 16, fontWeight: 500, fontFamily: 'var(--mono)', color: '#e4e4e7', margin: '2px 0 0' }}>
                {prediction.hookRetention.low}–{prediction.hookRetention.high}%
              </p>
              <span style={{ fontSize: 10, color: '#3f3f46' }}>Watch past 3s</span>
            </div>
          )}
          {!prediction.hookRetention && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
              <span style={{ fontSize: 10, color: '#52525b' }}>Conversion rate</span>
              <p style={{ fontSize: 16, fontWeight: 500, fontFamily: 'var(--mono)', color: '#e4e4e7', margin: '2px 0 0' }}>
                ~{(prediction.cvr.low + prediction.cvr.high) / 2}%
              </p>
              <span style={{ fontSize: 10, color: '#3f3f46' }}>{platformLabel} avg</span>
            </div>
          )}
        </div>
      </div>

      {/* Fatigue callout — separate from card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 8,
          padding: '8px 12px',
          marginTop: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#71717a' }}>Creative fatigue expected</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--mono)', color: '#e4e4e7' }}>
          ~{prediction.fatigueDays.low}–{prediction.fatigueDays.high} days
        </span>
      </div>

      {/* Confidence footnote — NOT a badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8, paddingLeft: 2 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0, marginTop: 4 }} />
        <span style={{ fontSize: 11, color: '#52525b', lineHeight: 1.5 }}>
          {prediction.confidence} confidence — {prediction.confidenceReason || 'estimates based on creative quality signals. Actual results depend on audience, budget, and landing page.'}
        </span>
      </div>

      {/* What's driving this — expandable */}
      {(prediction.positiveSignals.length > 0 || prediction.negativeSignals.length > 0) && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setDriversOpen(prev => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 2px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              color: '#71717a',
              fontFamily: 'var(--sans)',
            }}
          >
            <span>What's driving this</span>
            <ChevronDown
              size={14}
              style={{
                transform: driversOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms',
                color: '#3f3f46',
              }}
            />
          </button>

          <div
            style={{
              maxHeight: driversOpen ? 300 : 0,
              overflow: 'hidden',
              transition: 'max-height 200ms ease-in-out',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 2, paddingBottom: 4 }}>
              {prediction.positiveSignals.map((signal, i) => {
                const parts = signal.split(/[.–—]\s*/);
                const label = parts[0]?.trim() ?? signal;
                const note = parts.slice(1).join('. ').trim();
                return (
                  <div
                    key={`pos-${i}`}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0',
                      borderBottom: i < prediction.positiveSignals.length - 1 || prediction.negativeSignals.length > 0
                        ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#e4e4e7' }}>{label}</span>
                      {note && <span style={{ fontSize: 11, color: '#52525b', display: 'block', marginTop: 1 }}>{note}</span>}
                    </div>
                  </div>
                );
              })}
              {prediction.negativeSignals.map((signal, i) => {
                const parts = signal.split(/[.–—]\s*/);
                const label = parts[0]?.trim() ?? signal;
                const note = parts.slice(1).join('. ').trim();
                return (
                  <div
                    key={`neg-${i}`}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0',
                      borderBottom: i < prediction.negativeSignals.length - 1
                        ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="8" height="2" viewBox="0 0 8 2"><rect width="8" height="2" rx="1" fill="#f59e0b"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#e4e4e7' }}>{label}</span>
                      {note && <span style={{ fontSize: 11, color: '#52525b', display: 'block', marginTop: 1 }}>{note}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
