import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TOKENS, STEP_LABEL_STYLE, HEADING_STYLE, CARD_STYLE } from '../tokens';
import { slideUp, fadeIn, sceneEnvelope, springPop } from '../helpers';
import { AppWindow } from '../AppWindow';

const IMPROVEMENTS = [
  'Strengthen the CTA — make it action-oriented and urgent',
  'Add motion to the first 2 seconds to improve scroll-stop',
  'Include social proof (ratings, reviews) to boost credibility',
];

export function ImprovementsScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 120);

  const headerStyle = slideUp(frame, 0, 16, 18);

  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
      ...envelope,
    }}>
      <div style={STEP_LABEL_STYLE}>Step 4 — Improve</div>

      <AppWindow>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ width: 440 }}>
            {/* Header */}
            <div style={{
              ...headerStyle,
              marginBottom: 20,
            }}>
              <p style={{ ...HEADING_STYLE, margin: 0 }}>
                Improve This Ad
              </p>
              <p style={{ fontSize: 12, color: TOKENS.inkMuted, marginTop: 4 }}>
                AI-generated suggestions based on your score
              </p>
            </div>

            {/* Improvement items */}
            {IMPROVEMENTS.map((text, i) => {
              const start = 15 + i * 9;
              const pop = springPop(frame, start);
              return (
                <div key={i} style={{
                  ...pop,
                  display: 'flex',
                  gap: 14,
                  padding: '14px 18px',
                  marginBottom: 10,
                  borderRadius: TOKENS.radiusSm,
                  border: `1px solid ${TOKENS.border}`,
                  background: TOKENS.surface,
                }}>
                  {/* Lightbulb icon */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(245, 158, 11, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18h6" />
                      <path d="M10 22h4" />
                      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                    </svg>
                  </div>

                  <p style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: TOKENS.inkMuted,
                    margin: 0,
                  }}>
                    {text}
                  </p>
                </div>
              );
            })}

            {/* Subtle label */}
            <p style={{
              opacity: fadeIn(frame, 50, 15),
              fontSize: 11,
              fontFamily: TOKENS.fontMono,
              color: TOKENS.inkFaint,
              marginTop: 16,
              textAlign: 'center' as const,
            }}>
              3 actionable suggestions
            </p>
          </div>
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
}
