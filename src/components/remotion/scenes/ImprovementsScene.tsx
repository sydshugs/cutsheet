import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TOKENS } from '../tokens';
import { slideUp, fadeIn, sceneEnvelope, springPop } from '../helpers';

const IMPROVEMENTS = [
  'Add a text overlay reinforcing the offer at the 3-second mark',
  'Hook is strong — consider a faster cut at 0:04 to maintain momentum',
  'Include a direct CTA in the final 2 seconds with urgency copy',
];

export function ImprovementsScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 120);

  const headerStyle = slideUp(frame, 0, 16, 18);

  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: envelope,
    }}>
      <div style={{
        position: 'absolute',
        top: 28,
        left: 36,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.12em',
        color: '#818cf8',
        fontFamily: TOKENS.fontMono,
        opacity: envelope,
      }}>
        Step 4 — Improve
      </div>

      <div style={{ width: 440 }}>
        {/* Header */}
        <div style={{
          ...headerStyle,
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>
            How to Improve
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
    </AbsoluteFill>
  );
}
