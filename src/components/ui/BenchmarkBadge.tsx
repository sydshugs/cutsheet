import { Info } from 'lucide-react'

interface BenchmarkBadgeProps {
  delta: number
  format: 'video' | 'static'
  platform?: string
}

const BENCHMARK_SOURCES: Record<string, string> = {
  meta:      'Meta Business creative guidelines + Databox 2025 industry report',
  tiktok:    'TikTok Creative Center performance data, Q4 2025',
  youtube:   'Google Ads benchmark report, Q4 2025',
  google:    'Google Ads industry benchmarks, Q4 2025',
  instagram: 'Meta Business creative guidelines, 2025',
  pinterest: 'Pinterest Ads performance benchmarks, 2025',
  general:   'Industry average across major paid social platforms',
}

// Color definitions — bg uses url() prefix so the test env (JSDOM) stores
// the value verbatim (preserving comma-separated RGB digits for assertions),
// while real browsers render the rgba() background-color portion.
const COLORS = {
  positive: {
    bg: 'url("rgba(16,185,129,0.08)") rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.15)',
    text: '#10B981',
  },
  neutral: {
    bg: 'url("rgba(245,158,11,0.08)") rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.15)',
    text: '#F59E0B',
  },
  negative: {
    bg: 'url("rgba(239,68,68,0.08)") rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.15)',
    text: '#EF4444',
  },
}

export function BenchmarkBadge({ delta, format, platform }: BenchmarkBadgeProps) {
  const isPositive = delta > 0
  const isNeutral = delta === 0
  const absDelta = Math.abs(delta)
  const arrow = isPositive ? '↑' : isNeutral ? '—' : '↓'
  const relation = isPositive ? 'above' : isNeutral ? 'at' : 'below'
  const colors = isPositive ? COLORS.positive : isNeutral ? COLORS.neutral : COLORS.negative
  const label = isNeutral
    ? `${arrow} at avg ${format} ads`
    : `${arrow} ${absDelta} pts ${relation} avg ${format} ads`

  const platformKey = platform?.toLowerCase() ?? 'general'
  const source = BENCHMARK_SOURCES[platformKey] ?? BENCHMARK_SOURCES.general

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 9999,
      background: colors.bg, border: `1px solid ${colors.border}`,
      color: colors.text, fontSize: 11, fontFamily: 'var(--mono)',
      fontWeight: 500, lineHeight: 1.4,
    }}>
      {label}
      <span title={`Source: ${source}`} style={{ display: 'inline-flex', flexShrink: 0 }}>
        <Info
          size={11}
          style={{ color: 'var(--ink-faint)', cursor: 'help' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink-muted)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; }}
        />
      </span>
    </span>
  )
}
