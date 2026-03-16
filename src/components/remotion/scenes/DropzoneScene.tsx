import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TOKENS, STEP_LABEL_STYLE, CARD_STYLE } from '../tokens';
import { AppWindow } from '../AppWindow';
import { fadeIn, slideUp, sceneEnvelope, springPop } from '../helpers';

const FILENAME = 'summer-campaign-v2.mp4 · 12.4 MB';
const FORMATS = ['MP4', 'MOV', 'WEBM', 'WEBP', 'JPG', 'PNG'];

const RECENT_ANALYSES = [
  { filename: 'hero-spot-q4.mp4', score: 9.2, color: '#10B981' },
  { filename: 'retarget-carousel.mov', score: 6.8, color: '#6366F1' },
  { filename: 'launch-teaser-v3.mp4', score: 4.1, color: '#EF4444' },
];

export function DropzoneScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 150);

  // File label slides in at frame 30
  const labelStyle = slideUp(frame, 30, 16, 18);

  // Border transitions to indigo at frame 45
  const borderProgress = fadeIn(frame, 45, 20);
  const borderColor = `rgba(99, 102, 241, ${0.1 + borderProgress * 0.4})`;
  const bgColor = `rgba(99, 102, 241, ${borderProgress * 0.04})`;
  const containerScale = 1 + borderProgress * 0.01;

  // Card entrance spring
  const cardPop = springPop(frame, 10);

  // Upload icon bounce at frame 50
  const bounceY = frame >= 50 && frame < 70
    ? Math.sin((frame - 50) / 20 * Math.PI * 2) * -6 * Math.max(0, 1 - (frame - 50) / 20)
    : 0;

  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
      ...envelope,
    }}>
      <div style={STEP_LABEL_STYLE}>
        Step 1 — Upload
      </div>
      <AppWindow>
        <div style={{
          display: 'flex',
          flexDirection: 'row' as const,
          height: '100%',
        }}>
          {/* Left sidebar */}
          <div style={{
            width: 220,
            flexShrink: 0,
            borderRight: `1px solid ${TOKENS.border}`,
            padding: '20px 16px',
          }}>
            <div style={{
              fontSize: 10,
              fontFamily: TOKENS.fontMono,
              textTransform: 'uppercase' as const,
              color: TOKENS.inkFaint,
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}>
              Recent Analyses
            </div>
            {RECENT_ANALYSES.map((item, i) => {
              const itemAnim = slideUp(frame, 8 + i * 8, 12, 14);
              return (
                <div
                  key={item.filename}
                  style={{
                    display: 'flex',
                    flexDirection: 'row' as const,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: TOKENS.radiusSm,
                    background: i === 0 ? TOKENS.surfaceEl : 'transparent',
                    opacity: itemAnim.opacity,
                    transform: itemAnim.transform,
                  }}
                >
                  <span style={{
                    fontSize: 12,
                    color: TOKENS.ink,
                    fontWeight: 500,
                  }}>
                    {item.filename}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontFamily: TOKENS.fontMono,
                    fontWeight: 600,
                    color: item.color,
                  }}>
                    {item.score}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right main area */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 480,
              ...cardPop,
              transform: `${cardPop.transform} scale(${containerScale})`,
            }}>
              {/* Card wrapper */}
              <div style={{
                ...CARD_STYLE,
                padding: 32,
                position: 'relative',
              }}>
                {/* File label floating in */}
                <div style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: `translateX(-50%) translateY(${(1 - labelStyle.opacity) * 16}px)`,
                  opacity: labelStyle.opacity,
                  background: TOKENS.accent,
                  borderRadius: 8,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontFamily: TOKENS.fontMono,
                  fontWeight: 600,
                  color: 'white',
                  whiteSpace: 'nowrap' as const,
                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  zIndex: 10,
                }}>
                  {FILENAME}
                </div>

                {/* Drop area */}
                <div style={{
                  border: `2px dashed ${borderColor}`,
                  borderRadius: TOKENS.radius,
                  padding: '40px 24px',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: 16,
                  background: bgColor,
                }}>
                  {/* Upload icon */}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translateY(${bounceY}px)`,
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>

                  {/* Text */}
                  <div style={{ textAlign: 'center' as const }}>
                    <p style={{ fontSize: 18, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>
                      Drop your creative here
                    </p>
                    <p style={{ fontSize: 13, color: TOKENS.inkMuted, marginTop: 4 }}>
                      video or static — any ad format
                    </p>
                  </div>

                  {/* Format pills */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                    {FORMATS.map((f) => (
                      <span key={f} style={{
                        background: TOKENS.surfaceEl,
                        borderRadius: 20,
                        padding: '4px 12px',
                        fontSize: 11,
                        fontFamily: TOKENS.fontMono,
                        color: TOKENS.inkFaint,
                      }}>
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Browse button */}
                  <button style={{
                    background: TOKENS.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}>
                    Browse Files
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
}
