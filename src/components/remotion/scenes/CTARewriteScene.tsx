import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TOKENS, STEP_LABEL_STYLE, HEADING_STYLE } from '../tokens';
import { fadeIn, typewriter, scaleIn, sceneEnvelope, slideUp } from '../helpers';
import { AppWindow } from '../AppWindow';

const BEFORE_CTA = 'Shop Now';
const AFTER_CTA = 'Get 50% off — today only. Tap to claim 🎯';

export function CTARewriteScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 120);

  // Phase 1 (20-40): Before card fades IN
  const beforeOpacity = fadeIn(frame, 20, 20);

  // Phase 2 (40-60): Rewrite button pulses
  const buttonPulse = frame >= 40 && frame <= 60;
  const buttonScale = buttonPulse
    ? 1 + Math.sin((frame - 40) / 20 * Math.PI) * 0.06
    : 1;
  const buttonGlow = buttonPulse
    ? `0 0 ${12 + Math.sin((frame - 40) / 20 * Math.PI) * 8}px rgba(99, 102, 241, 0.4)`
    : 'none';

  // Phase 3 (60-90): After card slides in from below
  const afterSlide = slideUp(frame, 60, 24, 30);

  // Phase 4 (70+): Typewriter starts after card is visible
  const afterText = typewriter(AFTER_CTA, frame, 70, 0.8);
  const cursorVisible = frame >= 70 && afterText.length < AFTER_CTA.length && Math.floor(frame / 8) % 2 === 0;

  // Checkmark at end
  const checkStyle = scaleIn(frame, 105, 12);

  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
      ...envelope,
    }}>
      <div style={STEP_LABEL_STYLE}>Step 5 — Rewrite</div>

      <AppWindow>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ width: 460 }}>
            {/* Header */}
            <div style={{ opacity: fadeIn(frame, 0, 12), marginBottom: 24, textAlign: 'center' as const }}>
              <p style={{ ...HEADING_STYLE, margin: 0 }}>
                CTA Rewrite
              </p>
            </div>

            {/* Rewrite button */}
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 20,
              opacity: fadeIn(frame, 35, 10),
            }}>
              <div style={{
                background: TOKENS.accent,
                color: 'white',
                borderRadius: 10,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                transform: `scale(${buttonScale})`,
                boxShadow: buttonGlow,
              }}>
                ✦ Rewrite CTA
              </div>
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
              ...afterSlide,
              padding: '20px 24px',
              borderRadius: TOKENS.radiusSm,
              border: '1px solid rgba(16, 185, 129, 0.2)',
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

            {/* Gemini attribution */}
            <p style={{
              opacity: fadeIn(frame, 108, 10),
              fontSize: 10,
              fontFamily: TOKENS.fontMono,
              color: TOKENS.inkFaint,
              textAlign: 'center' as const,
              marginTop: 16,
            }}>
              Powered by Gemini 2.5 Flash
            </p>
          </div>
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
}
