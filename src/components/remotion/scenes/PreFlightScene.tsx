import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { TOKENS, STEP_LABEL_STYLE, CARD_STYLE, HEADING_STYLE } from '../tokens';
import { slideUp, fadeIn, easeOutExpo, sceneEnvelope, springPop } from '../helpers';
import { AppWindow } from '../AppWindow';

const VARIANT_A = {
  label: 'Variant A',
  score: 8.5,
  verdict: '✓ Would Scale',
  verdictColor: TOKENS.success,
  strength: 'Bold, self-aware hook grabs attention',
  weakness: 'Static nature may struggle vs. dynamic content',
};

const VARIANT_B = {
  label: 'Variant B',
  score: 4.5,
  verdict: '✗ Don\'t Scale',
  verdictColor: TOKENS.error,
  strength: 'Pattern interrupt has potential',
  weakness: 'Buried CTA and dense body text kills retention',
};

function MockAdCard({ headline, body }: { headline: string; body: string }) {
  return (
    <div style={{
      width: '100%',
      height: 160,
      borderRadius: 8,
      marginBottom: 12,
      border: '1px solid rgba(255,255,255,0.10)',
      background: '#faf8f4',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 24px',
      textAlign: 'center' as const,
    }}>
      <p style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: 18,
        fontWeight: 700,
        color: '#1a1a1a',
        margin: 0,
        lineHeight: 1.3,
      }}>
        {headline}
      </p>
      <p style={{
        fontFamily: "'Geist', system-ui, sans-serif",
        fontSize: 11,
        color: '#666',
        margin: '8px 0 0',
        lineHeight: 1.4,
      }}>
        {body}
      </p>
    </div>
  );
}

export function PreFlightScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 150);

  // 0–20f: Header fades + slides up
  const headerStyle = slideUp(frame, 0, 20, 20);

  // 30–70f: Scores count up
  const scoreA = interpolate(frame, [20, 60], [0, VARIANT_A.score], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
  const scoreB = interpolate(frame, [20, 60], [0, VARIANT_B.score], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  // 75f: Verdict badges appear
  const verdictOpacity = fadeIn(frame, 65, 15);

  // 90f+: Winner badge springs in
  const winnerScale = spring({
    frame: Math.max(0, frame - 80),
    fps: 30,
    config: { damping: 12, stiffness: 200, mass: 0.8 },
  });
  const winnerOpacity = interpolate(frame, [80, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Variant B dims when winner reveals
  const bDim = interpolate(frame, [80, 95], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // H2H + winner card fade in
  const h2hOpacity = fadeIn(frame, 80, 15);

  return (
    <AbsoluteFill style={{
      backgroundColor: TOKENS.bg,
      fontFamily: TOKENS.fontSans,
      ...envelope,
    }}>
      <div style={STEP_LABEL_STYLE}>Pre-Flight</div>
      <AppWindow>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center' as const, marginBottom: 24, ...headerStyle }}>
            <h2 style={{ ...HEADING_STYLE, margin: 0 }}>Pre-Flight — A/B Testing</h2>
            <p style={{ fontSize: 13, color: TOKENS.inkMuted, margin: '6px 0 0' }}>
              Test before you spend. Pick the winner before launch.
            </p>
          </div>

          {/* Two columns */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Variant A */}
            <div style={{ width: 260, ...springPop(frame, 10), position: 'relative' }}>
              {/* Image thumbnail */}
              <MockAdCard
                headline="There's no creative."
                body="We made the ad invisible. The product speaks for itself."
              />
              {/* Label */}
              <p style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: TOKENS.inkMuted,
                fontFamily: TOKENS.fontMono,
                margin: 0,
              }}>
                {VARIANT_A.label}
              </p>
              {/* Score */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: TOKENS.ink, fontFamily: TOKENS.fontMono }}>
                  {scoreA.toFixed(1)}
                </span>
                <span style={{ fontSize: 14, color: TOKENS.inkFaint }}>/10</span>
              </div>
              {/* Would Scale badge */}
              <div style={{
                marginTop: 8,
                opacity: verdictOpacity,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: `${VARIANT_A.verdictColor}18`,
                border: `1px solid ${VARIANT_A.verdictColor}40`,
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: VARIANT_A.verdictColor,
              }}>
                {VARIANT_A.verdict}
              </div>
              {/* Strength */}
              <div style={{ marginTop: 12 }}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  color: TOKENS.success,
                  margin: 0,
                }}>
                  Strength
                </p>
                <p style={{ fontSize: 11, color: TOKENS.inkMuted, margin: '3px 0 0', lineHeight: 1.4 }}>
                  {VARIANT_A.strength}
                </p>
              </div>
              {/* Weakness */}
              <div style={{ marginTop: 8 }}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  color: TOKENS.error,
                  margin: 0,
                }}>
                  Weakness
                </p>
                <p style={{ fontSize: 11, color: TOKENS.inkMuted, margin: '3px 0 0', lineHeight: 1.4 }}>
                  {VARIANT_A.weakness}
                </p>
              </div>

              {/* Winner badge on top */}
              {frame >= 80 && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: `translateX(-50%) scale(${winnerScale})`,
                  opacity: winnerOpacity,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  padding: '4px 14px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap' as const,
                  boxShadow: '0 0 16px rgba(99,102,241,0.4)',
                }}>
                  🏆 PREDICTED WINNER
                </div>
              )}
            </div>

            {/* Variant B — dims at frame 90 */}
            <div style={{ width: 260, ...springPop(frame, 18), opacity: bDim }}>
              {/* Image thumbnail */}
              <MockAdCard
                headline="We skipped the ad."
                body="No flashy visuals. No bold CTA. Just vibes."
              />
              {/* Label */}
              <p style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: TOKENS.inkMuted,
                fontFamily: TOKENS.fontMono,
                margin: 0,
              }}>
                {VARIANT_B.label}
              </p>
              {/* Score */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: TOKENS.ink, fontFamily: TOKENS.fontMono }}>
                  {scoreB.toFixed(1)}
                </span>
                <span style={{ fontSize: 14, color: TOKENS.inkFaint }}>/10</span>
              </div>
              {/* Don't Scale badge */}
              <div style={{
                marginTop: 8,
                opacity: verdictOpacity,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: `${VARIANT_B.verdictColor}18`,
                border: `1px solid ${VARIANT_B.verdictColor}40`,
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: VARIANT_B.verdictColor,
              }}>
                {VARIANT_B.verdict}
              </div>
              {/* Strength */}
              <div style={{ marginTop: 12 }}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  color: TOKENS.success,
                  margin: 0,
                }}>
                  Strength
                </p>
                <p style={{ fontSize: 11, color: TOKENS.inkMuted, margin: '3px 0 0', lineHeight: 1.4 }}>
                  {VARIANT_B.strength}
                </p>
              </div>
              {/* Weakness */}
              <div style={{ marginTop: 8 }}>
                <p style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  color: TOKENS.error,
                  margin: 0,
                }}>
                  Weakness
                </p>
                <p style={{ fontSize: 11, color: TOKENS.inkMuted, margin: '3px 0 0', lineHeight: 1.4 }}>
                  {VARIANT_B.weakness}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom section: Winner card + Head-to-head */}
          {frame >= 80 && (
            <div style={{ marginTop: 16, width: '100%', maxWidth: 540, opacity: h2hOpacity }}>
              {/* Winner prediction card */}
              <div style={{
                ...CARD_STYLE,
                padding: '12px 16px',
                marginBottom: 10,
                borderTop: '2px solid',
                borderImage: 'linear-gradient(90deg, #6366F1, #8B5CF6) 1',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent }}>
                    Variant A dominates
                  </span>
                  <span style={{
                    background: `${TOKENS.success}20`,
                    border: `1px solid ${TOKENS.success}40`,
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    color: TOKENS.success,
                  }}>
                    HIGH CONFIDENCE
                  </span>
                </div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: TOKENS.success, fontWeight: 500 }}>
                    ↑ 15–25% higher CTR/CVR
                  </span>
                </div>
              </div>

              {/* Head-to-head pills */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {['Hook: A wins', 'CTA: A wins', 'Retention: A wins'].map((text) => (
                  <div key={text} style={{
                    background: `${TOKENS.success}12`,
                    border: `1px solid ${TOKENS.success}25`,
                    borderRadius: 20,
                    padding: '3px 10px',
                    fontSize: 10,
                    color: TOKENS.success,
                    fontWeight: 500,
                  }}>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppWindow>
    </AbsoluteFill>
  );
}
