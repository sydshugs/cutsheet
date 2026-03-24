// src/components/PlatformScoreCard.tsx
import { BarChart2, Music2, Camera, Youtube, CheckCircle, XCircle, ChevronRight, Facebook, Instagram, Pin, Sparkles, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { PlatformScore } from '../services/claudeService'

interface PlatformScoreCardProps {
  scores: PlatformScore[]
  loading: boolean
  platform: string  // OrganicAnalyzer Platform value: "all" | "TikTok" | "Instagram Reels" | "YouTube Shorts"
}

// Platform colors for visual distinction
const PLATFORM_COLORS: Record<string, { primary: string; bg: string; border: string }> = {
  tiktok:    { primary: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)' },
  reels:     { primary: '#e879f9', bg: 'rgba(232,121,249,0.08)', border: 'rgba(232,121,249,0.2)' },
  shorts:    { primary: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  meta:      { primary: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  instagram: { primary: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)' },
  pinterest: { primary: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)' },
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

function scoreLabel(score: number): string {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Fair'
  return 'Needs Work'
}

function ShimmerCard() {
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      border: '1px solid rgba(255,255,255,0.06)', 
      borderRadius: 16, 
      padding: 20,
      overflow: 'hidden',
    }}>
      {/* Header shimmer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }} />
          <div>
            <div style={{ width: 100, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ width: 60, height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ width: 48, height: 32, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
      </div>
      {/* Progress bar shimmer */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, marginBottom: 16 }} />
      {/* Verdict shimmer */}
      <div style={{ width: '90%', height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: '70%', height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 16 }} />
      {/* Recommendations shimmer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: '50%', marginTop: 5 }} />
            <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
          </div>
        ))}
      </div>
      {/* Shimmer animation overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: '-100%',
        width: '200%', height: '100%',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
        animation: 'shimmer 1.5s infinite',
      }} />
      <style>{`@keyframes shimmer { to { transform: translateX(50%) } }`}</style>
    </div>
  )
}

function PlatformCard({ score, index }: { score: PlatformScore; index: number }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const meta = PLATFORM_META[score.platform] ?? { label: score.platform, Icon: BarChart2 }
  const colors = PLATFORM_COLORS[score.platform] ?? { primary: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' }
  const Icon = meta.Icon
  const color = scoreColor(score.score)
  const label = scoreLabel(score.score)
  const progressPercent = (score.score / 10) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ 
        background: 'linear-gradient(135deg, rgba(24,24,27,0.95) 0%, rgba(24,24,27,0.8) 100%)',
        border: '1px solid rgba(255,255,255,0.06)', 
        borderRadius: 16, 
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Subtle top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${colors.primary}60 0%, ${colors.primary}20 100%)`,
      }} />

      {/* Header section */}
      <div 
        style={{ 
          padding: '20px 20px 16px',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Platform info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} color={colors.primary} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f4f4f5', margin: 0, marginBottom: 4 }}>
                {meta.label}
              </h3>
              <span style={{ 
                fontSize: 11, 
                color: color, 
                fontWeight: 500,
                padding: '2px 8px',
                background: `${color}15`,
                borderRadius: 4,
              }}>
                {label}
              </span>
            </div>
          </div>

          {/* Score badge */}
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 2,
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'var(--mono)' }}>
              {score.score}
            </span>
            <span style={{ fontSize: 12, color: '#52525b', fontWeight: 500 }}>/10</span>
          </div>
        </div>

        {/* Score progress bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{
            height: 4,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ delay: index * 0.12 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${color} 0%, ${color}90 100%)`,
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 20px' }}>
              {/* Verdict summary */}
              <div style={{
                padding: 14,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.04)',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Sparkles size={14} color="#818cf8" style={{ marginTop: 2, flexShrink: 0 }} />
                  <p style={{ 
                    fontSize: 13, 
                    color: '#d4d4d8', 
                    margin: 0, 
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                  }}>
                    {score.verdict}
                  </p>
                </div>
              </div>

              {/* Signals / Quick checks */}
              {(score.signals ?? []).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                  }}>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 600, 
                      color: '#71717a', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.08em' 
                    }}>
                      Quick Checks
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(score.signals ?? []).map((sig) => (
                      <span
                        key={sig.label}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11, padding: '5px 10px', borderRadius: 8,
                          background: sig.pass ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          color: sig.pass ? '#10b981' : '#ef4444',
                          border: `1px solid ${sig.pass ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                          fontWeight: 500,
                        }}
                      >
                        {sig.pass
                          ? <CheckCircle size={12} />
                          : <XCircle size={12} />
                        }
                        {sig.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {(score.improvements ?? []).length > 0 && (
                <div>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
                  }}>
                    <TrendingUp size={12} color="#818cf8" />
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 600, 
                      color: '#71717a', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.08em' 
                    }}>
                      Recommendations
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(score.improvements ?? []).map((imp, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.12 + 0.3 + (i * 0.05), duration: 0.25 }}
                        style={{ 
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <div style={{
                          width: 20, height: 20,
                          borderRadius: 6,
                          background: 'rgba(99,102,241,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 1,
                        }}>
                          <ChevronRight size={12} color="#818cf8" />
                        </div>
                        <span style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6 }}>{imp}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function PlatformScoreCard({ scores, loading, platform }: PlatformScoreCardProps) {
  const count = platform === 'all' ? 3 : 1
  if (!loading && scores.length === 0) return null

  return (
    <div style={{ margin: '0 16px 20px' }}>
      {/* Section header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 8,
          background: 'rgba(99,102,241,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart2 size={14} color="#818cf8" />
        </div>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#f4f4f5' }}>Platform Optimization</span>
          <p style={{ fontSize: 11, color: '#52525b', margin: '2px 0 0' }}>
            {loading ? 'Analyzing platform fit...' : `${scores.length} platform${scores.length !== 1 ? 's' : ''} analyzed`}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence mode="wait">
          {loading && scores.length === 0
            ? Array.from({ length: count }).map((_, i) => <ShimmerCard key={`shimmer-${i}`} />)
            : scores.map((s, i) => <PlatformCard key={s.platform} score={s} index={i} />)
          }
        </AnimatePresence>
      </div>
    </div>
  )
}
