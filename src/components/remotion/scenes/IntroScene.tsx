import { AbsoluteFill, useCurrentFrame, interpolate, spring, Img, staticFile } from 'remotion';
import { TOKENS } from '../tokens';
import { sceneEnvelope, slideUp } from '../helpers';

const PILLS = [
  { label: 'Hook Strength Score', startFrame: 40 },
  { label: 'Scene-by-Scene Analysis', startFrame: 58 },
  { label: 'CTA Rewrite', startFrame: 76 },
  { label: 'Budget Recommendation', startFrame: 94 },
  { label: 'Pre-Flight A/B Testing', startFrame: 112 },
];

export function IntroScene() {
  const frame = useCurrentFrame();

  // 0–40f: Logo reveal — spring scale from 0.85 → 1.0
  const logoScale = spring({
    frame,
    fps: 30,
    config: { damping: 14, stiffness: 180, mass: 0.8 },
  });
  const logoScaleMapped = interpolate(logoScale, [0, 1], [0.85, 1]);
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tagline fades in slightly after logo
  const taglineOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scene-level fade-in + fade-out envelope with scale
  const envelope = sceneEnvelope(frame, 150, 12);

  return (
    <AbsoluteFill style={{
      backgroundColor: '#09090B',
      fontFamily: TOKENS.fontSans,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      ...envelope,
    }}>
      {/* Logo icon + Wordmark — positioned at ~35% from top */}
      <div style={{
        marginTop: 0,
        textAlign: 'center' as const,
        transform: `scale(${logoScaleMapped})`,
        opacity: logoOpacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <Img
          src={staticFile('cutsheet-logo.png')}
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
          }}
        />
        <h1 style={{
          fontFamily: "'TBJ Interval', sans-serif",
          fontSize: 56,
          fontWeight: 400,
          margin: 0,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}>
          cutsheet
        </h1>
      </div>

      <p style={{
        opacity: taglineOpacity,
        fontSize: 18,
        color: '#a1a1aa',
        marginTop: 16,
        fontWeight: 400,
        letterSpacing: '-0.01em',
      }}>
        AI made your ad. But will it convert?
      </p>

      {/* Feature pills — start at ~60% from top */}
      <div style={{
        marginTop: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        {PILLS.map((pill) => {
          if (frame < pill.startFrame) return null;

          const pillStyle = slideUp(frame, pill.startFrame, 16, 18);

          return (
            <div
              key={pill.label}
              style={{
                ...pillStyle,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 9999,
                padding: '8px 18px',
              }}
            >
              {/* Accent dot */}
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: TOKENS.accent,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 14,
                fontWeight: 500,
                color: TOKENS.ink,
                whiteSpace: 'nowrap' as const,
              }}>
                {pill.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
