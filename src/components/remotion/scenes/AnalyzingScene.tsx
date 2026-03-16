import { AbsoluteFill, useCurrentFrame, Img, staticFile } from 'remotion';
import { TOKENS, STEP_LABEL_STYLE, CARD_STYLE } from '../tokens';
import { AppWindow } from '../AppWindow';
import { fadeIn, sceneEnvelope } from '../helpers';

const HINTS = [
  'Analyzing hook strength...',
  'Evaluating scene transitions...',
  'Scoring CTA clarity...',
  'Measuring emotional pull...',
];

const FILENAME = 'summer-campaign-v2.mp4';

export function AnalyzingScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 120);

  // Shimmer position cycles every 36 frames (1.2s at 30fps)
  const shimmerX = ((frame % 36) / 36) * 200 - 100; // -100% to 100%

  // Hint cycling: switch every 30 frames
  const hintIndex = Math.floor(frame / 30) % HINTS.length;

  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
      ...envelope,
    }}>
      <div style={STEP_LABEL_STYLE}>
        Step 2 — Analyze
      </div>
      <AppWindow>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}>
          <div style={{
            width: 400,
            ...CARD_STYLE,
            padding: 24,
          }}>
            {/* Image thumbnail, dimmed */}
            <Img
              src={staticFile('demos/variant-a.png')}
              style={{
                width: '100%',
                height: 140,
                objectFit: 'cover',
                borderRadius: 12,
                opacity: 0.4,
                marginBottom: 12,
              }}
            />

            {/* File info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <div>
                <span style={{
                  fontSize: 12,
                  fontFamily: TOKENS.fontMono,
                  color: TOKENS.inkMuted,
                }}>
                  {FILENAME}
                </span>
                <span style={{
                  fontSize: 11,
                  color: TOKENS.inkFaint,
                  marginLeft: 8,
                }}>
                  12.4 MB
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

            {/* Gemini badge bottom-right */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 16,
            }}>
              <span style={{
                fontSize: 10,
                fontFamily: TOKENS.fontMono,
                color: TOKENS.inkFaint,
                background: TOKENS.surfaceEl,
                padding: '3px 8px',
                borderRadius: 6,
              }}>
                Gemini 2.5 Flash
              </span>
            </div>
          </div>
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
}
