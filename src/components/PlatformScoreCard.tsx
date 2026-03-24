// src/components/PlatformScoreCard.tsx
import { BarChart2, Music2, Camera, Youtube, CheckCircle, XCircle, ArrowRight, Facebook, Instagram, Pin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PlatformScore } from '../services/claudeService'

interface PlatformScoreCardProps {
  scores: PlatformScore[]
  loading: boolean
  platform: string  // OrganicAnalyzer Platform value: "all" | "TikTok" | "Instagram Reels" | "YouTube Shorts"
}

const PLATFORM_META: Record<string, { label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }> = {
  tiktok:    { label: 'TikTok',           Icon: Music2    },
  reels:     { label: 'Instagram Reels',  Icon: Camera    },
  shorts:    { label: 'YouTube Shorts',   Icon: Youtube   },
  meta:      { label: 'Meta Feed',        Icon: Facebook  },
  instagram: { label: 'Instagram Feed',   Icon: Instagram },
  pinterest: { label: 'Pinterest',        Icon: Pin       },
}

function scoreColor(score: number): string {
  if (score >= 8) return '#10b981'
  if (score >= 5) return '#f59e0b'
  return '#ef4444'
}

function ShimmerCard() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ width: 100, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        <div style={{ width: 32, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
      </div>
      <div style={{ width: '80%', height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 60, height: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 9999 }} />
        ))}
      </div>
    </div>
  )
}

function PlatformCard({ score, index }: { score: PlatformScore; index: number }) {
  const meta = PLATFORM_META[score.platform] ?? { label: score.platform, Icon: BarChart2 }
  const Icon = meta.Icon
  const color = scoreColor(score.score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={14} color="#f4f4f5" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>{meta.label}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score.score}/10</span>
      </div>

      {/* Signals */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 10px' }}>
        {(score.signals ?? []).map((sig) => (
          <span
            key={sig.label}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 10, padding: '2px 8px', borderRadius: 9999,
              background: sig.pass ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: sig.pass ? '#10b981' : '#ef4444',
              border: `1px solid ${sig.pass ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            {sig.pass
              ? <CheckCircle size={10} />
              : <XCircle size={10} />
            }
            {sig.label}
          </span>
        ))}
      </div>

      {/* Verdict */}
      <p style={{ fontSize: 13, color: '#a1a1aa', fontStyle: 'italic', margin: '0 0 12px' }}>
        {score.verdict}
      </p>

      {/* Improvements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(score.improvements ?? []).map((imp, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <ArrowRight size={10} color="#6366f1" style={{ marginTop: 3, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>{imp}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function PlatformScoreCard({ scores, loading, platform }: PlatformScoreCardProps) {
  const count = platform === 'all' ? 3 : 1
  if (!loading && scores.length === 0) return null

  return (
    <div style={{ margin: '0 16px 16px' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <BarChart2 size={14} color="#71717a" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>Platform Optimization</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {loading && scores.length === 0
            ? Array.from({ length: count }).map((_, i) => <ShimmerCard key={i} />)
            : scores.map((s, i) => <PlatformCard key={s.platform} score={s} index={i} />)
          }
        </AnimatePresence>
      </div>
    </div>
  )
}
