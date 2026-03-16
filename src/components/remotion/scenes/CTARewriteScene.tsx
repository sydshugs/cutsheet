import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TOKENS } from '../tokens';
import { fadeIn, typewriter, scaleIn, sceneEnvelope } from '../helpers';

const BEFORE_CTA = 'Shop now.';
const AFTER_CTA = 'Get 50% off — today only. Tap to claim your deal.';

export function CTARewriteScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 120);

  // "Before" fades out over first 20 frames
  const beforeOpacity = 1 - fadeIn(frame, 5, 20);

  // "After" types in starting at frame 30
  const afterText = typewriter(AFTER_CTA, frame, 30, 0.6);
  const afterOpacity = fadeIn(frame, 25, 10);

  // Checkmark appears after typing completes (~frame 105)
  const checkStyle = scaleIn(frame, 105, 12);

  // Cursor blink for typewriter
  const cursorVisible = frame >= 30 && afterText.length < AFTER_CTA.length && Math.floor(frame / 8) % 2 === 0;

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
        Step 5 — Rewrite
      </div>
      <div style={{ width: 460 }}>
        {/* Header */}
        <div style={{ opacity: fadeIn(frame, 0, 12), marginBottom: 24, textAlign: 'center' as const }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: TOKENS.ink, margin: 0 }}>
            CTA Rewrite Suggestion
          </p>
        </div>

        {/* Before card */}
        <div style={{
          opacity: beforeOpacity,
          padding: '20px 24px',
          borderRadius: TOKENS.radiusSm,
          border: `1px solid rgba(239, 68, 68, 0.2)`,
          background: 'rgba(239, 68, 68, 0.05)',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {/* X icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TOKENS.error} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, color: TOKENS.error }}>
              Before
            </span>
          </div>
          <p style={{
            fontSize: 18,
            color: TOKENS.inkMuted,
            margin: 0,
            fontStyle: 'italic',
          }}>
            "{BEFORE_CTA}"
          </p>
        </div>

        {/* After card */}
        <div style={{
          opacity: afterOpacity,
          padding: '20px 24px',
          borderRadius: TOKENS.radiusSm,
          border: `1px solid rgba(16, 185, 129, 0.2)`,
          background: 'rgba(16, 185, 129, 0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {/* Check icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TOKENS.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, color: TOKENS.success }}>
              After
            </span>
          </div>
          <p style={{
            fontSize: 18,
            color: TOKENS.ink,
            margin: 0,
            fontWeight: 500,
          }}>
            "{afterText}
            {cursorVisible && <span style={{ color: TOKENS.accent }}>|</span>}
            "
          </p>
        </div>

        {/* Checkmark completion */}
        <div style={{
          ...checkStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 20,
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TOKENS.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span style={{ fontSize: 13, color: TOKENS.success, fontWeight: 500 }}>
            Stronger CTA ready
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
