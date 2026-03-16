import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TOKENS } from '../tokens';
import { fadeIn, slideUp, sceneEnvelope, springPop } from '../helpers';

const FILENAME = 'summer-campaign-v2.mp4';
const FORMATS = ['MP4', 'MOV', 'WEBM', 'JPG', 'PNG'];

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
        Step 1 — Upload
      </div>
      <div style={{
        width: 420,
        ...cardPop,
        transform: `${cardPop.transform} scale(${containerScale})`,
      }}>
        {/* Card wrapper */}
        <div style={{
          background: 'rgba(24, 24, 27, 0.5)',
          borderRadius: TOKENS.radiusXl,
          border: '1px solid rgba(255,255,255,0.05)',
          padding: 32,
          backdropFilter: 'blur(20px)',
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
    </AbsoluteFill>
  );
}
