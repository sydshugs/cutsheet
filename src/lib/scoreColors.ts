/** Score band thresholds: 9+ excellent, 7-8 good, 5-6 average, 0-4 weak */
export type ScoreBand = 'excellent' | 'good' | 'average' | 'weak';

export function getScoreBand(score: number): ScoreBand {
  if (score >= 9) return 'excellent';
  if (score >= 7) return 'good';
  if (score >= 5) return 'average';
  return 'weak';
}

export function getScoreColor(score: number): string {
  return `var(--score-${getScoreBand(score)})`;
}

export function getScoreBg(score: number): string {
  return `var(--score-${getScoreBand(score)}-bg)`;
}

export function getScoreBorder(score: number): string {
  return `var(--score-${getScoreBand(score)}-border)`;
}

/** Action-oriented verdict: Kill (0-4), Test (5-7), Scale (8-10) */
export type Verdict = 'Kill' | 'Test' | 'Scale';

export function getVerdict(score: number): Verdict {
  if (score >= 8) return 'Scale';
  if (score >= 5) return 'Test';
  return 'Kill';
}

export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case 'Scale': return 'var(--verdict-scale)';
    case 'Test':  return 'var(--verdict-test)';
    case 'Kill':  return 'var(--verdict-kill)';
  }
}

export function getVerdictBg(verdict: Verdict): string {
  switch (verdict) {
    case 'Scale': return 'var(--verdict-scale-bg)';
    case 'Test':  return 'var(--verdict-test-bg)';
    case 'Kill':  return 'var(--verdict-kill-bg)';
  }
}

export function getVerdictCopy(verdict: Verdict): string {
  switch (verdict) {
    case 'Scale': return 'Ready to scale — increase budget';
    case 'Test':  return 'Worth testing — fix weak areas first';
    case 'Kill':  return 'Kill this creative — rework needed';
  }
}
