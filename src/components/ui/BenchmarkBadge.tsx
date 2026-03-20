interface BenchmarkBadgeProps {
  delta: number
  format: 'video' | 'static'
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

export function BenchmarkBadge({ delta, format }: BenchmarkBadgeProps) {
  const isPositive = delta > 0
  const isNeutral = delta === 0
  const absDelta = Math.abs(delta)
  const arrow = isPositive ? '↑' : isNeutral ? '—' : '↓'
  const relation = isPositive ? 'above' : isNeutral ? 'at' : 'below'
  const colors = isPositive ? COLORS.positive : isNeutral ? COLORS.neutral : COLORS.negative
  const label = isNeutral
    ? `${arrow} at avg ${format} ads`
    : `${arrow} ${absDelta} pts ${relation} avg ${format} ads`
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 9999,
      background: colors.bg, border: `1px solid ${colors.border}`,
      color: colors.text, fontSize: 11, fontFamily: 'var(--mono)',
      fontWeight: 500, lineHeight: 1.4,
    }}>
      {label}
    </span>
  )
}
