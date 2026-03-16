import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { TOKENS, STEP_LABEL_STYLE, CARD_STYLE, HEADING_STYLE, getScoreColor, getScoreLabel } from '../tokens';
import { AppWindow } from '../AppWindow';
import { fadeIn, easeOutExpo, sceneEnvelope, springPop } from '../helpers';

const METRICS = [
  { label: 'Hook Strength', score: 9 },
  { label: 'Message Clarity', score: 8 },
  { label: 'CTA Effectiveness', score: 3 },
  { label: 'Production Quality', score: 9 },
];

const OVERALL = 8;
const ARC_LENGTH = 157; // semicircle circumference

export function ScorecardScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 150);

  // Arc fills over first 60 frames
  const arcProgress = interpolate(frame, [0, 60], [0, (OVERALL / 10) * ARC_LENGTH], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  // Score number fades in
  const scoreOpacity = fadeIn(frame, 20, 20);

  // Each bar starts 9 frames apart, fills over 45 frames
  const barWidths = METRICS.map((m, i) => {
    const start = 40 + i * 9;
    return interpolate(frame, [start, start + 45], [0, (m.score / 10) * 100], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeOutExpo,
    });
  });

  // Badge fades in after bars
  const badgeOpacity = fadeIn(frame, 85, 15);

  const overallColor = getScoreColor(OVERALL);
  const overallLabel = getScoreLabel(OVERALL);

  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
      ...envelope,
    }}>
      <div style={STEP_LABEL_STYLE}>
        Step 3 — Score
      </div>
      <AppWindow>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}>
          <div style={{
            width: 380,
            ...CARD_STYLE,
            overflow: 'hidden',
            ...springPop(frame, 5),
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${TOKENS.surfaceEl}`,
            }}>
              <p style={{ ...HEADING_STYLE, fontSize: 14, margin: 0 }}>
                Score Overview
              </p>
              <p style={{ fontSize: 11, fontFamily: TOKENS.fontMono, color: TOKENS.inkFaint, margin: '4px 0 0' }}>
                Gemini 2.5 Flash
              </p>
            </div>

            {/* Arc gauge */}
            <div style={{ padding: '24px 24px 8px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
              <svg width="160" height="90" viewBox="0 0 120 70">
                {/* Background arc */}
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Filled arc with glow */}
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none"
                  stroke={overallColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${arcProgress} ${ARC_LENGTH}`}
                  style={{ filter: `drop-shadow(0 0 8px ${overallColor}60)` }}
                />
              </svg>

              {/* Score number */}
              <div style={{ marginTop: -20, textAlign: 'center' as const, opacity: scoreOpacity }}>
                <span style={{
                  fontSize: 44,
                  fontWeight: 700,
                  fontFamily: TOKENS.fontMono,
                  color: TOKENS.ink,
                }}>
                  {OVERALL}
                </span>
                <span style={{
                  fontSize: 20,
                  fontFamily: TOKENS.fontMono,
                  color: TOKENS.inkFaint,
                }}>
                  /10
                </span>
              </div>

              {/* Badge */}
              <div style={{
                marginTop: 12,
                opacity: badgeOpacity,
                background: `${overallColor}1a`,
                border: `1px solid ${overallColor}40`,
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: TOKENS.fontMono,
                color: overallColor,
              }}>
                {overallLabel}
              </div>
            </div>

            {/* Metric bars */}
            <div style={{ padding: '20px 24px 24px' }}>
              {METRICS.map((m, i) => {
                const color = getScoreColor(m.score);
                return (
                  <div key={m.label}>
                    <div style={{ marginBottom: i < METRICS.length - 1 ? 14 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: TOKENS.inkMuted }}>{m.label}</span>
                        <span style={{ fontSize: 12, fontFamily: TOKENS.fontMono, fontWeight: 500, color: TOKENS.ink }}>
                          {m.score}/10
                        </span>
                      </div>
                      <div style={{
                        height: 6,
                        width: '100%',
                        borderRadius: 3,
                        background: TOKENS.surfaceEl,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${barWidths[i]}%`,
                          borderRadius: 3,
                          background: color,
                          boxShadow: `0 0 6px ${color}40`,
                        }} />
                      </div>
                    </div>
                    {/* Rewrite CTA hint for low CTA score */}
                    {m.label === 'CTA Effectiveness' && frame > 70 && (
                      <div style={{
                        opacity: fadeIn(frame, 70, 15),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 6,
                        marginLeft: 2,
                      }}>
                        <span style={{ fontSize: 11, color: TOKENS.accent, fontWeight: 500 }}>✦ Rewrite CTA</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
}
