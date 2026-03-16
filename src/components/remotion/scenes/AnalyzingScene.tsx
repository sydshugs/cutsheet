import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TOKENS } from '../tokens';
import { fadeIn, sceneEnvelope } from '../helpers';

const HINTS = [
  'Detecting hook pattern...',
  'Evaluating CTA placement...',
  'Measuring production quality...',
  'Calculating overall score...',
];

const FILENAME = 'summer-campaign-v2.mp4';

export function AnalyzingScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 120);

  // Shimmer position cycles every 36 frames (1.2s at 30fps)
  const shimmerX = ((frame % 36) / 36) * 200 - 100; // -100% to 100%

  // Hint cycling: switch every 30 frames
  const hintIndex = Math.floor(frame / 30) % HINTS.length;

  // Thumbnail pulse
  const pulseOpacity = 0.03 + Math.sin(frame / 15 * Math.PI) * 0.02;

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
        Step 2 — Analyze
      </div>
      <div style={{
        width: 400,
        borderRadius: TOKENS.radius,
        border: `1px solid ${TOKENS.border}`,
        background: TOKENS.surface,
        padding: 24,
      }}>
        {/* Thumbnail placeholder */}
        <div style={{
          height: 140,
          width: '100%',
          borderRadius: 12,
          background: `rgba(255,255,255,${pulseOpacity})`,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span style={{ fontSize: 12, fontFamily: TOKENS.fontMono, color: 'rgba(255,255,255,0.15)' }}>
              {FILENAME}
            </span>
          </div>
        </div>

        {/* Analyzing text */}
        <p style={{
          fontSize: 15,
          fontWeight: 600,
          color: TOKENS.ink,
          margin: '0 0 12px 0',
        }}>
          Analyzing your creative...
        </p>

        {/* Shimmer progress bar */}
        <div style={{
          height: 6,
          width: '100%',
          borderRadius: 3,
          background: TOKENS.surfaceEl,
          overflow: 'hidden',
          position: 'relative' as const,
          marginBottom: 16,
        }}>
          <div style={{
            position: 'absolute' as const,
            inset: 0,
            borderRadius: 3,
            background: `linear-gradient(90deg, transparent, ${TOKENS.accent}, transparent)`,
            transform: `translateX(${shimmerX}%)`,
          }} />
        </div>

        {/* Cycling hint */}
        <p style={{
          fontSize: 12,
          fontFamily: TOKENS.fontMono,
          color: TOKENS.inkFaint,
          margin: 0,
        }}>
          {HINTS[hintIndex]}
        </p>
      </div>
    </AbsoluteFill>
  );
}
