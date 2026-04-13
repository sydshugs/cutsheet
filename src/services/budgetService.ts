/**
 * Budget recommendation engine — deterministic, no AI.
 * CPM benchmarks last verified: April 2026
 * Sources: WordStream 2025, Databox DTC report, Statista paid social
 * Update cadence: verify quarterly
 */

const CPM_BENCHMARKS = {
  meta:    { low: 8,  mid: 12, high: 18, unit: 'CPM' },
  tiktok:  { low: 3,  mid: 6,  high: 10, unit: 'CPM' },
  google:  { low: 2,  mid: 4,  high: 8,  unit: 'CPM' },
  youtube: { low: 6,  mid: 10, high: 15, unit: 'CPM' },
  all:     { low: 5,  mid: 9,  high: 14, unit: 'CPM' },
  static_all: { low: 5, mid: 10, high: 18, unit: 'CPM' },
} as const;

const NICHE_MODIFIERS: Record<string, {
  budgetMultiplier: number;
  note: string;
  roasTarget: string;
  testDuration: string;
}> = {
  'DTC Brand':          { budgetMultiplier: 1.0, note: 'DTC brands benefit from volume testing — start broad, narrow on winners.', roasTarget: '2-4x', testDuration: '3-5 days' },
  'SaaS':               { budgetMultiplier: 0.6, note: 'SaaS audiences are smaller — targeted spend outperforms broad volume.', roasTarget: 'CAC-based', testDuration: '5-7 days' },
  'Ecommerce':          { budgetMultiplier: 1.2, note: 'Ecommerce scales fast with winning creatives — test quickly.', roasTarget: '3-6x', testDuration: '2-4 days' },
  'Creator / UGC':      { budgetMultiplier: 0.5, note: 'Start with organic distribution before paid amplification.', roasTarget: 'engagement-first', testDuration: '3-5 days' },
  'Agency':             { budgetMultiplier: 1.0, note: "Match client's existing test budget structure.", roasTarget: 'client-dependent', testDuration: '3-7 days' },
  'Health & Wellness':  { budgetMultiplier: 0.8, note: 'Health audiences respond to trust signals — test with smaller budgets, scale on social proof.', roasTarget: '2-3x', testDuration: '5-7 days' },
  'Finance / Fintech':  { budgetMultiplier: 0.5, note: 'Finance has high CPMs and compliance risk — conservative testing, strict CPA targets.', roasTarget: 'CAC < LTV/3', testDuration: '7-14 days' },
  'Food & Beverage':    { budgetMultiplier: 1.1, note: 'Food/bev has lower CPMs and impulse-buy behavior — test broadly, optimize for ROAS.', roasTarget: '3-5x', testDuration: '3-5 days' },
  'Real Estate':        { budgetMultiplier: 0.6, note: 'Real estate is high-ticket with long cycles — optimize for lead cost, not ROAS.', roasTarget: 'CPL-based', testDuration: '7-14 days' },
  'Other':              { budgetMultiplier: 0.8, note: 'Conservative test budget until you establish your baseline CPM.', roasTarget: 'establish baseline first', testDuration: '3-5 days' },
};

const NICHE_ALIASES: Record<string, string> = {
  'ecommerce / dtc': 'DTC Brand',
  'ecommerce': 'Ecommerce',
  'dtc': 'DTC Brand',
  'saas': 'SaaS',
  'health & wellness': 'Health & Wellness',
  'health': 'Health & Wellness',
  'finance / fintech': 'Finance / Fintech',
  'finance': 'Finance / Fintech',
  'food & beverage': 'Food & Beverage',
  'food': 'Food & Beverage',
  'real estate': 'Real Estate',
  'creator': 'Creator / UGC',
  'agency': 'Agency',
};

const SCORE_TIERS = {
  strong:  { range: [8, 10],  action: 'test'    as const, budgetBase: { min: 50,  max: 150 }, label: 'Test Budget',    advice: 'Strong creative. Start testing at this budget. Scale to 3-5x if CPA holds within the test window.', scaleSignal: 'If CTR > 1.5% and CPA is on target after 48hrs — double budget.' },
  good:    { range: [7, 7.9], action: 'limited' as const, budgetBase: { min: 40,  max: 100 }, label: 'Limited Test',   advice: 'Good creative. Test at this range and monitor closely. Fix flagged issues to unlock full budget.', scaleSignal: 'Fix remaining issues, then scale if CPA holds.' },
  average: { range: [5, 6.9], action: 'limited' as const, budgetBase: { min: 20,  max: 50  }, label: 'Limited Test',   advice: 'Average creative. Cap spend at this range. Address the flagged improvements before scaling.', scaleSignal: 'Fix hook and CTA issues before scaling.' },
  weak:    { range: [1, 4],   action: 'hold'    as const, budgetBase: { min: 0,   max: 0   }, label: 'Hold Spend',     advice: 'Do not spend on this creative until improvements are made. A weak creative wastes every dollar.', scaleSignal: null },
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
  footnote: string | null;
  adSets: number;
}

export function generateBudgetRecommendation(
  overallScore: number,
  platform: string,
  niche: string,
  format: 'video' | 'static'
): EngineBudgetRecommendation {
  const tier = overallScore >= 8 ? SCORE_TIERS.strong
             : overallScore >= 7 ? SCORE_TIERS.good
             : overallScore >= 5 ? SCORE_TIERS.average
             : SCORE_TIERS.weak;

  const platformKey = (format === 'static' && platform.toLowerCase() === 'all')
    ? 'static_all'
    : platform.toLowerCase() as keyof typeof CPM_BENCHMARKS;
  const cpm = CPM_BENCHMARKS[platformKey as keyof typeof CPM_BENCHMARKS] || CPM_BENCHMARKS.all;

  const resolvedNiche = NICHE_ALIASES[niche.toLowerCase().trim()] ?? niche;
  const modifier = NICHE_MODIFIERS[resolvedNiche] ?? NICHE_MODIFIERS['Other'];

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

  const footnote = (format === 'static' && platform.toLowerCase() === 'all')
    ? "Static 'All platforms' = Meta + Google Display (TikTok/YouTube excluded)"
    : null;

  const adSets = tier.action === 'hold' ? 0
    : overallScore >= 8 ? 3
    : overallScore >= 6 ? 2
    : 1;

  return {
    action: tier.action,
    label: tier.label,
    dailyBudget,
    platform,
    platformCPM,
    niche: resolvedNiche,
    advice: tier.advice + ' ' + modifier.note,
    scaleSignal: tier.scaleSignal,
    testDuration: modifier.testDuration,
    roasTarget: modifier.roasTarget,
    footnote,
    adSets,
  };
}
