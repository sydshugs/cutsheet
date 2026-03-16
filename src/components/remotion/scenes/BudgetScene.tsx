import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { TOKENS, STEP_LABEL_STYLE, CARD_STYLE, HEADING_STYLE } from '../tokens';
import { slideUp, fadeIn, easeOutExpo, sceneEnvelope, springPop } from '../helpers';
import { AppWindow } from '../AppWindow';

const BUDGET = {
  verdict: 'Boost It',
  platform: 'TikTok + Meta',
  daily: '$100–$200/day',
  duration: '7 days',
  reason: 'Strong hook and production quality signal high engagement potential across visual-first platforms.',
};

const HASHTAGS = ['#ForYou', '#AdCreative', '#MarketingTips', '#DigitalMarketing', '#AdStrategy'];

export function BudgetScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 150);

  // Card slides up
  const cardStyle = slideUp(frame, 0, 30, 25);

  // Confidence meter fills
  const meterWidth = interpolate(frame, [20, 80], [0, 85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  // Details stagger in
  const detailStyles = [
    slideUp(frame, 15, 14, 18),
    slideUp(frame, 22, 14, 18),
    slideUp(frame, 29, 14, 18),
    slideUp(frame, 36, 14, 18),
  ];

  // Final CTA
  const ctaOpacity = fadeIn(frame, 90, 20);

  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
      ...envelope,
    }}>
      <div style={STEP_LABEL_STYLE}>Step 6 — Budget</div>
      <AppWindow>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ width: 440, ...springPop(frame, 0) }}>
            {/* Budget card */}
            <div style={{ ...CARD_STYLE, overflow: 'hidden' }}>
              {/* Header with verdict */}
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${TOKENS.surfaceEl}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ ...HEADING_STYLE, fontSize: 14, margin: 0 }}>
                    Budget Recommendation
                  </p>
                  <p style={{ fontSize: 11, fontFamily: TOKENS.fontMono, color: TOKENS.inkFaint, margin: '4px 0 0' }}>
                    Based on creative analysis
                  </p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 20,
                  padding: '5px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: TOKENS.success,
                }}>
                  🚀 {BUDGET.verdict}
                </div>
              </div>

              {/* Details */}
              <div style={{ padding: '20px 24px' }}>
                {[
                  { label: 'Platform', value: BUDGET.platform },
                  { label: 'Daily Spend', value: BUDGET.daily },
                  { label: 'Duration', value: BUDGET.duration },
                ].map((item, i) => (
                  <div key={item.label} style={{
                    ...detailStyles[i],
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < 2 ? `1px solid ${TOKENS.surfaceEl}` : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: TOKENS.inkMuted }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: TOKENS.ink }}>{item.value}</span>
                  </div>
                ))}

                {/* Confidence meter */}
                <div style={{ ...detailStyles[3], marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: TOKENS.inkMuted }}>Confidence</span>
                    <span style={{ fontSize: 12, fontFamily: TOKENS.fontMono, fontWeight: 500, color: TOKENS.success }}>
                      {Math.round(meterWidth)}%
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
                      width: `${meterWidth}%`,
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${TOKENS.success}, #34D399)`,
                      boxShadow: `0 0 8px ${TOKENS.success}40`,
                    }} />
                  </div>
                </div>

                {/* Reason */}
                <p style={{
                  opacity: fadeIn(frame, 50, 20),
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: TOKENS.inkFaint,
                  marginTop: 16,
                  marginBottom: 0,
                }}>
                  {BUDGET.reason}
                </p>

                {/* Hashtag pills */}
                <div style={{ marginTop: 16, opacity: fadeIn(frame, 65, 15) }}>
                  <p style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em',
                    color: TOKENS.inkFaint,
                    margin: '0 0 8px',
                    fontFamily: TOKENS.fontMono,
                  }}>
                    Recommended Hashtags
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {HASHTAGS.map((tag, i) => (
                      <span key={tag} style={{
                        opacity: fadeIn(frame, 68 + i * 3, 10),
                        background: TOKENS.surfaceEl,
                        borderRadius: 20,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontFamily: TOKENS.fontMono,
                        color: TOKENS.inkMuted,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div style={{
              opacity: ctaOpacity,
              textAlign: 'center' as const,
              marginTop: 28,
            }}>
              <p style={{
                fontSize: 20,
                fontWeight: 600,
                color: TOKENS.ink,
                margin: 0,
              }}>
                Ready to score your next ad?
              </p>
              <p style={{
                fontSize: 13,
                color: TOKENS.accent,
                marginTop: 8,
              }}>
                cutsheet.xyz
              </p>
            </div>
          </div>
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
}
