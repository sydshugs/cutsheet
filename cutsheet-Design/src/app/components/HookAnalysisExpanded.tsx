import { Lightbulb, Zap, Eye, Clock, TrendingUp } from 'lucide-react';

// ── Shared score helpers (mirrors ScoreCard) ─────────────────────────
function scoreColor(score: number): string {
  if (score >= 7) return '#10b981';  // emerald
  if (score >= 5) return '#f59e0b';  // amber
  return '#ef4444';                  // red
}

function scoreBorderColor(score: number): string {
  if (score >= 7) return 'rgba(16,185,129,0.25)';
  if (score >= 5) return 'rgba(245,158,11,0.25)';
  return 'rgba(239,68,68,0.25)';
}

function scoreBg(score: number): string {
  if (score >= 7) return 'rgba(16,185,129,0.08)';
  if (score >= 5) return 'rgba(245,158,11,0.08)';
  return 'rgba(239,68,68,0.08)';
}

function verdictLabel(score: number): string {
  if (score >= 7) return 'Strong';
  if (score >= 5) return 'Fair';
  return 'Weak';
}

// ── Circular progress ring ────────────────────────────────────────────
function RingProgress({ score, size = 88 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 10) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="#27272a"
        strokeWidth={5}
      />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={circumference * 0.25} /* start at top */
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Score label */}
      <text
        x={cx} y={cy - 4}
        textAnchor="middle"
        dominantBaseline="auto"
        fill={color}
        fontSize={18}
        fontWeight={700}
        fontFamily="Geist, Inter, sans-serif"
      >
        {score.toFixed(1)}
      </text>
      <text
        x={cx} y={cy + 12}
        textAnchor="middle"
        dominantBaseline="auto"
        fill="#52525b"
        fontSize={10}
        fontFamily="Geist, Inter, sans-serif"
      >
        /10
      </text>
    </svg>
  );
}

// ── Sub-score bar row ─────────────────────────────────────────────────
function SubScoreRow({
  icon,
  label,
  score,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  description: string;
}) {
  const color = scoreColor(score);
  const pct = `${(score / 10) * 100}%`;

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', color: '#71717a' }}>
          {icon}
        </span>
        <span style={{ fontSize: 13, color: '#d4d4d8', fontWeight: 500, flex: 1 }}>
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>
          {score.toFixed(1)}
        </span>
      </div>
      {/* Bar */}
      <div style={{ height: 4, background: '#27272a', borderRadius: 9999, marginBottom: 8, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: pct,
            background: color,
            borderRadius: 9999,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
      {/* Description */}
      <p style={{ fontSize: 12, color: '#71717a', lineHeight: 1.5, margin: 0 }}>
        {description}
      </p>
    </div>
  );
}

// ── Insight pill ──────────────────────────────────────────────────────
function InsightPill({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 9999,
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.2)',
      }}
    >
      <TrendingUp size={11} color="#10b981" />
      <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>{text}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────
interface HookAnalysisExpandedProps {
  hookScore?: number;
}

export function HookAnalysisExpanded({ hookScore = 9.1 }: HookAnalysisExpandedProps) {
  const color = scoreColor(hookScore);
  const verdict = verdictLabel(hookScore);
  const verdictBg = scoreBg(hookScore);
  const verdictBorder = scoreBorderColor(hookScore);

  const subScores = [
    {
      icon: <Zap size={14} />,
      label: 'Pattern Interrupt',
      score: 9.4,
      description: 'Opens with high-contrast motion and unexpected audio sting — grabs attention before the skip window.',
    },
    {
      icon: <Eye size={14} />,
      label: 'First Frame',
      score: 9.0,
      description: 'Face-forward framing with direct eye contact. Thumbnail quality is scroll-stopping.',
    },
    {
      icon: <Lightbulb size={14} />,
      label: 'Emotional Pull',
      score: 8.8,
      description: 'Curiosity gap established in the first 1.5s. Viewer needs to stay to resolve the tension.',
    },
    {
      icon: <Clock size={14} />,
      label: 'Pacing',
      score: 9.2,
      description: 'Cut rhythm matches TikTok native content. No dead air in the first 3 seconds.',
    },
  ];

  return (
    <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header card */}
      <div
        style={{
          padding: '20px 20px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Ring */}
        <RingProgress score={hookScore} size={88} />

        {/* Right side */}
        <div style={{ flex: 1 }}>
          {/* Section label */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#71717a',
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              marginBottom: 6,
            }}
          >
            Hook Analysis
          </div>

          {/* Verdict badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 9999,
              background: verdictBg,
              border: `1px solid ${verdictBorder}`,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, color, fontWeight: 600 }}>
              {verdict}
            </span>
          </div>

          {/* Insight pill */}
          <div>
            <InsightPill text="Top 8% on TikTok" />
          </div>
        </div>
      </div>

      {/* Sub-score cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {subScores.map((s) => (
          <SubScoreRow key={s.label} {...s} />
        ))}
      </div>

      {/* Recommendation card */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            marginBottom: 8,
          }}
        >
          What's Working
        </div>
        <p style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.6, margin: 0 }}>
          Your opening 3 seconds are performing exceptionally. The combination of direct eye contact, motion, and audio cue triggers all three attention signals TikTok's algorithm rewards. Maintain this pattern across creatives.
        </p>
      </div>

    </div>
  );
}
