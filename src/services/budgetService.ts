// budgetService.ts — Real budget recommendation engine
// No AI calls. Every recommendation is based on industry benchmarks + user context.

const CPM_BENCHMARKS = {
  meta:    { low: 8,  mid: 12, high: 18, unit: 'CPM' },
  tiktok:  { low: 3,  mid: 6,  high: 10, unit: 'CPM' },
  google:  { low: 2,  mid: 4,  high: 8,  unit: 'CPM' },
  youtube: { low: 6,  mid: 10, high: 15, unit: 'CPM' },
  all:     { low: 5,  mid: 9,  high: 14, unit: 'CPM' },
} as const;

const NICHE_MODIFIERS: Record<string, {
  budgetMultiplier: number;
  note: string;
  roasTarget: string;
  testDuration: string;
}> = {
  'DTC Brand':      { budgetMultiplier: 1.0, note: 'DTC brands benefit from volume testing — start broad, narrow on winners.', roasTarget: '2-4x', testDuration: '3-5 days' },
  'SaaS':           { budgetMultiplier: 0.6, note: 'SaaS audiences are smaller — targeted spend outperforms broad volume.', roasTarget: 'CAC-based', testDuration: '5-7 days' },
  'Ecommerce':      { budgetMultiplier: 1.2, note: 'Ecommerce scales fast with winning creatives — test quickly.', roasTarget: '3-6x', testDuration: '2-4 days' },
  'Creator / UGC':  { budgetMultiplier: 0.5, note: 'Start with organic distribution before paid amplification.', roasTarget: 'engagement-first', testDuration: '3-5 days' },
  'Agency':         { budgetMultiplier: 1.0, note: "Match client's existing test budget structure.", roasTarget: 'client-dependent', testDuration: '3-7 days' },
  'Other':          { budgetMultiplier: 0.8, note: 'Conservative test budget until you establish your baseline CPM.', roasTarget: 'establish baseline first', testDuration: '3-5 days' },
};

const SCORE_TIERS = {
  strong:  { range: [8, 10], action: 'test'    as const, budgetBase: { min: 50,  max: 150 }, label: 'Test Budget',    advice: 'Strong creative. Start testing at this budget. Scale to 3-5x if CPA holds within the test window.', scaleSignal: 'If CTR > 1.5% and CPA is on target after 48hrs — double budget.' },
  average: { range: [5, 7],  action: 'limited' as const, budgetBase: { min: 20,  max: 50  }, label: 'Limited Test',   advice: 'Average creative. Cap spend at this range. Address the flagged improvements before scaling.', scaleSignal: 'Fix hook and CTA issues first. Retest before increasing budget.' },
  weak:    { range: [1, 4],  action: 'hold'    as const, budgetBase: { min: 0,   max: 0   }, label: 'Hold Spend',     advice: 'Do not spend on this creative until improvements are made. A weak creative wastes every dollar.', scaleSignal: null },
};

export interface EngineBudgetRecommendation {
  action: 'test' | 'limited' | 'hold';
  label: string;
  dailyBudget: { min: number; max: number } | null;
  platform: string;
  platformCPM: string;
  niche: string;
  advice: string;
  scaleSignal: string | null;
  testDuration: string;
  roasTarget: string;
}

export function generateBudgetRecommendation(
  overallScore: number,
  platform: string,
  niche: string,
  format: 'video' | 'static'
): EngineBudgetRecommendation {
  const tier = overallScore >= 8 ? SCORE_TIERS.strong
             : overallScore >= 5 ? SCORE_TIERS.average
             : SCORE_TIERS.weak;

  const platformKey = platform.toLowerCase() as keyof typeof CPM_BENCHMARKS;
  const cpm = CPM_BENCHMARKS[platformKey] || CPM_BENCHMARKS.all;

  const modifier = NICHE_MODIFIERS[niche] || NICHE_MODIFIERS['Other'];

  let dailyBudget = tier.action === 'hold' ? null : {
    min: Math.round(tier.budgetBase.min * modifier.budgetMultiplier),
    max: Math.round(tier.budgetBase.max * modifier.budgetMultiplier),
  };

  const platformCPM = tier.action === 'hold'
    ? '—'
    : `$${cpm.low}–$${cpm.high} ${cpm.unit} (${platform === 'all' ? 'blended' : platform})`;

  // Static ads typically have lower CTR — reduce budget accordingly
  if (format === 'static' && dailyBudget) {
    dailyBudget = {
      min: Math.round(dailyBudget.min * 0.7),
      max: Math.round(dailyBudget.max * 0.7),
    };
  }

  return {
    action: tier.action,
    label: tier.label,
    dailyBudget,
    platform,
    platformCPM,
    niche,
    advice: tier.advice + ' ' + modifier.note,
    scaleSignal: tier.scaleSignal,
    testDuration: modifier.testDuration,
    roasTarget: modifier.roasTarget,
  };
}
