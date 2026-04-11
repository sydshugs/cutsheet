/**
 * Post-processing guardrails for AI outputs.
 * Run AFTER the LLM response is parsed, BEFORE sending to the client.
 * The LLM is good at relative ranking but bad at absolute calibration.
 */

// 1. Score sanity checks — clamp and recalculate overall
export function validateScores(scores: Record<string, number>): Record<string, number> {
  const validated = { ...scores };
  for (const [key, value] of Object.entries(validated)) {
    if (typeof value === 'number') {
      validated[key] = Math.max(1.0, Math.min(10.0, Math.round(value * 10) / 10));
    }
  }
  // Overall must be the weighted average of dimensions, not an independent LLM guess
  const dims = ['hook', 'clarity', 'cta', 'production'];
  const dimScores = dims.map(d => validated[d]).filter(v => typeof v === 'number' && v > 0) as number[];
  if (dimScores.length > 0) {
    validated.overall = Math.round((dimScores.reduce((a, b) => a + b, 0) / dimScores.length) * 10) / 10;
  }
  return validated;
}

// 2. Prediction coherence — predictions must align with scores
export function validatePrediction(prediction: any, scores: Record<string, number>): any {
  if (!prediction || !scores) return prediction;
  const validated = JSON.parse(JSON.stringify(prediction)); // deep clone
  const overall = scores.overall ?? 5;

  // CTR cannot be "above" average for a bad ad
  if (overall <= 3 && validated.ctr?.vsAvg === 'above') {
    validated.ctr.vsAvg = 'below';
  }
  if (overall >= 8 && validated.ctr?.vsAvg === 'below') {
    validated.ctr.vsAvg = 'at';
  }

  // Fatigue: low scores = fast fatigue
  if (overall <= 3 && validated.fatigueDays?.high > 10) {
    validated.fatigueDays.high = Math.min(validated.fatigueDays.high, 7);
    validated.fatigueDays.low = Math.min(validated.fatigueDays.low, 3);
  }
  if (overall >= 8 && validated.fatigueDays?.low < 7) {
    validated.fatigueDays.low = Math.max(validated.fatigueDays.low, 10);
  }

  // Hook retention must correlate with hook score
  const hookScore = scores.hook ?? 5;
  if (hookScore <= 3 && validated.hookRetention?.high > 40) {
    validated.hookRetention.high = Math.min(validated.hookRetention.high, 30);
    validated.hookRetention.low = Math.min(validated.hookRetention.low, 15);
  }
  if (hookScore >= 8 && validated.hookRetention?.low < 30) {
    validated.hookRetention.low = Math.max(validated.hookRetention.low, 40);
  }

  // CVR must correlate — bad ads don't convert well
  if (overall <= 3 && validated.cvr?.high > 2.0) {
    validated.cvr.high = Math.min(validated.cvr.high, 1.5);
    validated.cvr.low = Math.min(validated.cvr.low, 0.5);
  }

  return validated;
}

// 3. Verdict must be deterministic based on score, never LLM opinion
export function validateVerdict(llmVerdict: string, overall: number): string {
  if (overall >= 8) return 'ready';
  if (overall >= 5) return 'needs_work';
  return 'not_ready';
}

// 4. Confidence must correlate with score clarity
export function validateConfidence(
  llmConfidence: string,
  scores: Record<string, number>
): string {
  const overall = scores.overall ?? 5;
  const dims = ['hook', 'clarity', 'cta', 'production'];
  const dimScores = dims.map(d => scores[d]).filter(v => typeof v === 'number') as number[];

  // Calculate score spread — high spread = mixed signals = lower confidence
  if (dimScores.length > 0) {
    const max = Math.max(...dimScores);
    const min = Math.min(...dimScores);
    const spread = max - min;

    // Clear-cut scores (all high or all low) = High confidence
    if ((overall >= 8 || overall <= 3) && spread <= 3) return 'High';
    // Mid-range or mixed signals = Medium
    if (spread > 4 || (overall > 3 && overall < 8)) return 'Medium';
  }

  // Fall through to LLM's judgment if our heuristics don't apply
  return llmConfidence;
}
