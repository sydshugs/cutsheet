// MetricBars — 4 score bars (hook, clarity, cta, production) with CTA rewrite

/** Token-based score color using CSS custom properties */
function getScoreTokenColor(score: number): string {
  if (score >= 9) return "var(--score-excellent)";
  if (score >= 7) return "var(--score-good)";
  if (score >= 5) return "var(--score-average)";
  return "var(--score-weak)";
}

interface Scores {
  hook: number;
  clarity: number;
  cta: number;
  production: number;
  overall: number;
}

const SCORE_LABELS: Record<string, string> = {
  hook: "Hook Strength",
  clarity: "Message Clarity",
  cta: "CTA Effectiveness",
  production: "Production Quality",
};

const SCORE_TOOLTIPS: Record<string, string> = {
  hook: "How effectively the first 3 seconds grab attention and stop the scroll",
  clarity: "How clearly the core message and value proposition come through",
  cta: "How compelling and clear the call-to-action is",
  production: "Visual quality, pacing, audio mix, and overall polish",
};

function getScoreQualityText(score: number): string {
  if (score >= 9) return "Exceptional";
  if (score >= 8) return "Strong";
  if (score >= 6) return "Average";
  if (score >= 4) return "Below avg";
  return "Needs work";
}

const scoreKeys = ["hook", "clarity", "cta", "production"] as const;

interface MetricBarsProps {
  scores: Scores;
  mounted: boolean;
  onCTARewrite?: () => void;
  ctaRewrites?: string[] | null;
  ctaLoading?: boolean;
}

export function MetricBars({ scores, mounted, onCTARewrite, ctaRewrites, ctaLoading }: MetricBarsProps) {
  return (
    <div className="px-5 py-5 flex flex-col gap-4">
      {scoreKeys.map((key) => {
        const value = scores[key];
        const pct = value <= 0 ? 2 : Math.min(100, (value / 10) * 100);
        const barColor = getScoreTokenColor(value);
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-zinc-400" title={SCORE_TOOLTIPS[key]} style={{ cursor: "help" }}>{SCORE_LABELS[key]}</span>
              <span className="font-mono" style={{ color: barColor }}>{value} <span style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, opacity: 0.8 }}>— {getScoreQualityText(value)}</span></span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={10} aria-label={`${SCORE_LABELS[key]}: ${value} out of 10, ${getScoreQualityText(value)}`}>
              <div
                className="h-full rounded-full"
                style={{
                  "--bar-width": `${pct}%`,
                  width: mounted ? `${pct}%` : "0%",
                  background: barColor,
                  animation: mounted ? "barFill 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                } as React.CSSProperties}
              />
            </div>
            {/* CTA rewrite button — only when CTA score ≤ 5 */}
            {key === "cta" && value <= 5 && onCTARewrite && (
              <div className="mt-1.5">
                {!ctaRewrites ? (
                  <button
                    onClick={onCTARewrite}
                    disabled={ctaLoading}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-colors disabled:opacity-50"
                  >
                    {ctaLoading ? "Rewriting..." : "✦ Rewrite CTA"}
                  </button>
                ) : (
                  <div className="flex flex-col gap-1 mt-1">
                    {ctaRewrites.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 bg-indigo-500/5 rounded-lg px-2.5 py-1.5">
                        <span className="text-[10px] text-indigo-400 font-mono">{i + 1}.</span>
                        <span className="text-xs text-zinc-300">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
