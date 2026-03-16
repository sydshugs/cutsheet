import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { TOKENS } from '../tokens';
import { slideUp, fadeIn, easeOutExpo, sceneEnvelope } from '../helpers';

const VARIANT_A = {
  label: 'Variant A',
  score: 8.5,
  verdict: '✓ Would Scale',
  verdictColor: TOKENS.success,
  strength: 'Bold, self-aware hook grabs attention instantly',
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

const H2H_CATEGORIES = [
  { label: 'Hook', winner: 'A wins' },
  { label: 'CTA', winner: 'A wins' },
  { label: 'Retention', winner: 'A wins' },
];

export function PreFlightScene() {
  const frame = useCurrentFrame();
  const envelope = sceneEnvelope(frame, 150);

  // 0–20f: Header fades + slides up
  const headerStyle = slideUp(frame, 0, 20, 20);

  // 20–50f: Cards animate in from sides
  const cardProgress = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
  const cardAX = interpolate(cardProgress, [0, 1], [-60, 0]);
  const cardBX = interpolate(cardProgress, [0, 1], [60, 0]);

  // 50–80f: Scores count up
  const scoreA = interpolate(frame, [50, 80], [0, VARIANT_A.score], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
  const scoreB = interpolate(frame, [50, 80], [0, VARIANT_B.score], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });

  // 80–95f: Verdicts fade in
  const verdictOpacity = fadeIn(frame, 80, 15);

  // 105–150f: Winner badge with spring scale
  const winnerScale = spring({
    frame: frame - 105,
    fps: 30,
    config: { damping: 12, stiffness: 200, mass: 0.8 },
  });
  const winnerOpacity = interpolate(frame, [105, 115], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Variant B dims when winner reveals
  const bDim = interpolate(frame, [105, 120], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // A gets indigo border glow at winner reveal
  const aGlow = interpolate(frame, [105, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // H2H row fades in with winner badge
  const h2hOpacity = fadeIn(frame, 105, 15);

  // Recommendation line
  const recOpacity = fadeIn(frame, 115, 15);

  const cardBg = '#18181b';
  const cardBorder = '#27272a';

  function renderCard(
    variant: { label: string; score: number; verdict: string; verdictColor: string; strength: string; weakness: string },
    score: number,
    xOffset: number,
    extraStyles: React.CSSProperties = {},
  ) {
    return (
      <div style={{
        width: 280,
        borderRadius: TOKENS.radiusLg,
        border: `1px solid ${cardBorder}`,
        background: cardBg,
        padding: 24,
        transform: `translateX(${xOffset}px)`,
        opacity: cardProgress,
        position: 'relative',
        ...extraStyles,
      }}>
        {/* Label */}
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          color: TOKENS.inkMuted,
          margin: 0,
          fontFamily: TOKENS.fontMono,
        }}>
          {variant.label}
        </p>

        {/* Score */}
        <div style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}>
          <span style={{
            fontSize: 42,
            fontWeight: 700,
            color: TOKENS.ink,
            lineHeight: 1,
          }}>
            {score.toFixed(1)}
          </span>
          <span style={{
            fontSize: 16,
            fontWeight: 500,
            color: TOKENS.inkFaint,
          }}>
            /10
          </span>
        </div>

        {/* Verdict badge */}
        <div style={{
          marginTop: 14,
          opacity: verdictOpacity,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: `${variant.verdictColor}18`,
          border: `1px solid ${variant.verdictColor}40`,
          borderRadius: 20,
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 600,
          color: variant.verdictColor,
        }}>
          {variant.verdict}
        </div>

        {/* Strength */}
        <div style={{ marginTop: 18 }}>
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
          <p style={{
            fontSize: 12,
            color: TOKENS.inkMuted,
            margin: '4px 0 0',
            lineHeight: 1.5,
          }}>
            {variant.strength}
          </p>
        </div>

        {/* Weakness */}
        <div style={{ marginTop: 12 }}>
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
          <p style={{
            fontSize: 12,
            color: TOKENS.inkMuted,
            margin: '4px 0 0',
            lineHeight: 1.5,
          }}>
            {variant.weakness}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AbsoluteFill style={{
      backgroundColor: '#09090b',
      fontFamily: TOKENS.fontSans,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      opacity: envelope,
    }}>
      {/* Scene label top-left */}
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
        Pre-Flight
      </div>

      {/* Header */}
      <div style={{
        textAlign: 'center' as const,
        marginBottom: 32,
        ...headerStyle,
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: TOKENS.ink,
          margin: 0,
        }}>
          Pre-Flight — A/B Testing
        </h2>
        <p style={{
          fontSize: 14,
          color: TOKENS.inkMuted,
          margin: '8px 0 0',
        }}>
          Test before you spend. Pick the winner before launch.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
        position: 'relative',
      }}>
        {/* Variant A — winner */}
        <div style={{ position: 'relative' }}>
          {renderCard(VARIANT_A, scoreA, cardAX, {
            borderColor: aGlow > 0
              ? `rgba(99, 102, 241, ${interpolate(aGlow, [0, 1], [0, 0.5])})`
              : cardBorder,
            boxShadow: aGlow > 0
              ? `0 0 ${interpolate(aGlow, [0, 1], [0, 24])}px rgba(99, 102, 241, ${interpolate(aGlow, [0, 1], [0, 0.2])})`
              : 'none',
          })}

          {/* Winner badge */}
          {frame >= 105 && (
            <div style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: `translateX(-50%) scale(${winnerScale})`,
              opacity: winnerOpacity,
              background: TOKENS.accent,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              padding: '5px 14px',
              borderRadius: 20,
              whiteSpace: 'nowrap' as const,
              boxShadow: `0 0 16px ${TOKENS.accent}50`,
            }}>
              PREDICTED WINNER
            </div>
          )}

          {/* Winner stat */}
          {frame >= 105 && (
            <div style={{
              opacity: winnerOpacity,
              textAlign: 'center' as const,
              marginTop: 10,
            }}>
              <p style={{
                fontSize: 11,
                color: TOKENS.success,
                fontWeight: 500,
                margin: 0,
                fontFamily: TOKENS.fontMono,
              }}>
                30–50% higher CTR · 20–40% higher CVR
              </p>
            </div>
          )}
        </div>

        {/* Variant B — dims on winner reveal */}
        <div style={{ opacity: bDim }}>
          {renderCard(VARIANT_B, scoreB, cardBX)}
        </div>
      </div>

      {/* Head-to-head row */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginTop: 20,
        opacity: h2hOpacity,
      }}>
        {H2H_CATEGORIES.map((cat) => (
          <div key={cat.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: `${TOKENS.success}18`,
            border: `1px solid ${TOKENS.success}30`,
            borderRadius: 20,
            padding: '4px 12px',
          }}>
            <span style={{
              fontSize: 11,
              color: TOKENS.inkMuted,
              fontWeight: 500,
            }}>
              {cat.label}:
            </span>
            <span style={{
              fontSize: 11,
              color: TOKENS.success,
              fontWeight: 600,
            }}>
              {cat.winner}
            </span>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <p style={{
        opacity: recOpacity,
        fontSize: 13,
        color: TOKENS.inkMuted,
        fontStyle: 'italic',
        marginTop: 20,
        marginBottom: 0,
      }}>
        Pause Variant B. Allocate all budget to Variant A.
      </p>
    </AbsoluteFill>
  );
}
