/**
 * Golden scoring fixtures -- 8 test cases covering edge cases for guardrail validation.
 * Each fixture simulates a parsed analysis output with known scores, a mock prediction,
 * and expected validated outputs after guardrails run.
 */

export interface GoldenFixture {
  name: string;
  scores: { hook: number; clarity: number; cta: number; production: number; overall: number };
  platform: string;
  niche: string;
  format: 'video' | 'static';
  mockPrediction: {
    ctr: { low: number; high: number; benchmark: number; vsAvg: 'above' | 'at' | 'below' };
    cvr: { low: number; high: number };
    hookRetention: { low: number; high: number } | null;
    fatigueDays: { low: number; high: number };
    confidence: 'Low' | 'Medium' | 'High';
    confidenceReason: string;
    positiveSignals: string[];
    negativeSignals: string[];
  };
  mockVerdict: string;
  expected: {
    verdict: string;
    confidence: 'Low' | 'Medium' | 'High';
    ctrVsAvg?: 'above' | 'at' | 'below';
    fatigueDaysHighMax?: number;
    hookRetentionHighMax?: number;
    cvrHighMax?: number;
    allScoresMin?: number;
    allScoresMax?: number;
  };
}

export const fixtures: GoldenFixture[] = [
  // 1. perfect-static-meta -- all high, should sail through
  {
    name: "perfect-static-meta",
    scores: { hook: 9, clarity: 9, cta: 9, production: 9, overall: 10 },
    platform: "Meta",
    niche: "Ecommerce / DTC",
    format: "static",
    mockPrediction: {
      ctr: { low: 2.5, high: 3.8, benchmark: 2.1, vsAvg: "above" },
      cvr: { low: 1.5, high: 3.0 },
      hookRetention: null,
      fatigueDays: { low: 14, high: 28 },
      confidence: "High",
      confidenceReason: "Clear-cut high scores across all dimensions.",
      positiveSignals: ["Strong CTA with urgency", "Professional production quality"],
      negativeSignals: ["Minor: could test additional copy variants"],
    },
    mockVerdict: "ready",
    expected: {
      // overall recalculated: (9+9+9+9)/4 = 9.0
      verdict: "ready",
      confidence: "High",
      ctrVsAvg: "above",
    },
  },

  // 2. terrible-tiktok-video -- all low, LLM hallucinated good predictions
  {
    name: "terrible-tiktok-video",
    scores: { hook: 2, clarity: 2, cta: 2, production: 3, overall: 8 },
    platform: "TikTok",
    niche: "Creator / Content",
    format: "video",
    mockPrediction: {
      ctr: { low: 1.5, high: 3.0, benchmark: 2.0, vsAvg: "above" },
      cvr: { low: 1.0, high: 3.5 },
      hookRetention: { low: 25, high: 55 },
      fatigueDays: { low: 5, high: 18 },
      confidence: "High",
      confidenceReason: "Strong platform data for creator content on TikTok.",
      positiveSignals: ["Platform-native format"],
      negativeSignals: ["Weak hook", "No CTA"],
    },
    mockVerdict: "ready",
    expected: {
      // overall recalculated: (2+2+2+3)/4 = 2.3
      verdict: "not_ready",
      confidence: "High",
      ctrVsAvg: "below",
      fatigueDaysHighMax: 7,
      hookRetentionHighMax: 30,
      cvrHighMax: 1.5,
    },
  },

  // 3. mixed-signals -- great hook, terrible CTA, wide spread
  {
    name: "mixed-signals",
    scores: { hook: 9, clarity: 7, cta: 2, production: 5, overall: 7 },
    platform: "Meta",
    niche: "SaaS",
    format: "video",
    mockPrediction: {
      ctr: { low: 0.8, high: 1.5, benchmark: 1.0, vsAvg: "at" },
      cvr: { low: 0.5, high: 1.5 },
      hookRetention: { low: 40, high: 60 },
      fatigueDays: { low: 7, high: 14 },
      confidence: "High",
      confidenceReason: "Good data for SaaS on Meta.",
      positiveSignals: ["Strong hook", "Clear message"],
      negativeSignals: ["Weak CTA", "Average production"],
    },
    mockVerdict: "needs_work",
    expected: {
      // overall recalculated: (9+7+2+5)/4 = 5.8
      // spread = 9-2 = 7 > 4 => Medium confidence
      verdict: "needs_work",
      confidence: "Medium",
    },
  },

  // 4. mid-range-youtube -- boring middle, everything average
  {
    name: "mid-range-youtube",
    scores: { hook: 5, clarity: 6, cta: 5, production: 6, overall: 6 },
    platform: "YouTube",
    niche: "Agency",
    format: "video",
    mockPrediction: {
      ctr: { low: 0.3, high: 0.7, benchmark: 0.4, vsAvg: "at" },
      cvr: { low: 0.3, high: 0.8 },
      hookRetention: { low: 30, high: 45 },
      fatigueDays: { low: 10, high: 18 },
      confidence: "Medium",
      confidenceReason: "Mid-range scores with moderate benchmark data.",
      positiveSignals: ["Decent production", "Clear message"],
      negativeSignals: ["Predictable hook", "Generic CTA"],
    },
    mockVerdict: "needs_work",
    expected: {
      // overall recalculated: (5+6+5+6)/4 = 5.5
      // overall > 3 and < 8 => Medium
      verdict: "needs_work",
      confidence: "Medium",
    },
  },

  // 5. great-hook-bad-cta -- high spread, overall > 3 so fatigue NOT capped
  {
    name: "great-hook-bad-cta",
    scores: { hook: 9, clarity: 7, cta: 1, production: 7, overall: 7 },
    platform: "TikTok",
    niche: "Ecommerce / DTC",
    format: "video",
    mockPrediction: {
      ctr: { low: 1.0, high: 2.0, benchmark: 1.4, vsAvg: "above" },
      cvr: { low: 0.2, high: 0.8 },
      hookRetention: { low: 45, high: 65 },
      fatigueDays: { low: 5, high: 12 },
      confidence: "High",
      confidenceReason: "Strong hook signal but contradictory CTA.",
      positiveSignals: ["Excellent hook", "Good production"],
      negativeSignals: ["No CTA present", "Missed conversion opportunity"],
    },
    mockVerdict: "needs_work",
    expected: {
      // overall recalculated: (9+7+1+7)/4 = 6.0
      // spread = 9-1 = 8 > 4 => Medium
      // overall 6.0 > 3, so fatigueDays NOT capped (no fatigueDaysHighMax assertion)
      verdict: "needs_work",
      confidence: "Medium",
    },
  },

  // 6. all-zeros -- guardrails must clamp everything to 1.0 minimum
  {
    name: "all-zeros",
    scores: { hook: 0, clarity: 0, cta: 0, production: 0, overall: 0 },
    platform: "Meta",
    niche: "Ecommerce / DTC",
    format: "static",
    mockPrediction: {
      ctr: { low: 0.1, high: 0.3, benchmark: 0.5, vsAvg: "below" },
      cvr: { low: 0.0, high: 0.2 },
      hookRetention: null,
      fatigueDays: { low: 1, high: 3 },
      confidence: "Low",
      confidenceReason: "Invalid scores.",
      positiveSignals: [],
      negativeSignals: ["All scores are zero"],
    },
    mockVerdict: "not_ready",
    expected: {
      // all clamped to 1.0, overall = (1+1+1+1)/4 = 1.0
      verdict: "not_ready",
      confidence: "High",
      allScoresMin: 1.0,
    },
  },

  // 7. overflow-scores -- guardrails must clamp everything to 10.0 maximum
  {
    name: "overflow-scores",
    scores: { hook: 12, clarity: 15, cta: 11, production: 13, overall: 15 },
    platform: "Meta",
    niche: "Ecommerce / DTC",
    format: "static",
    mockPrediction: {
      ctr: { low: 4.0, high: 6.0, benchmark: 3.0, vsAvg: "above" },
      cvr: { low: 3.0, high: 5.0 },
      hookRetention: null,
      fatigueDays: { low: 30, high: 60 },
      confidence: "High",
      confidenceReason: "Impossible scores.",
      positiveSignals: ["Everything maxed"],
      negativeSignals: [],
    },
    mockVerdict: "ready",
    expected: {
      // all clamped to 10.0, overall = (10+10+10+10)/4 = 10.0
      verdict: "ready",
      confidence: "High",
      allScoresMax: 10.0,
    },
  },

  // 8. low-score-high-confidence -- LLM hallucinated optimistic predictions on a bad ad
  {
    name: "low-score-high-confidence",
    scores: { hook: 2, clarity: 2, cta: 1, production: 2, overall: 5 },
    platform: "Meta",
    niche: "Supplements",
    format: "video",
    mockPrediction: {
      ctr: { low: 2.0, high: 4.0, benchmark: 2.5, vsAvg: "above" },
      cvr: { low: 1.0, high: 3.0 },
      hookRetention: { low: 20, high: 50 },
      fatigueDays: { low: 10, high: 20 },
      confidence: "High",
      confidenceReason: "Strong data for supplements on Meta.",
      positiveSignals: ["Niche-specific targeting"],
      negativeSignals: ["Weak hook", "No CTA"],
    },
    mockVerdict: "ready",
    expected: {
      // overall recalculated: (2+2+1+2)/4 = 1.75 => 1.8
      // overall 1.8 <= 3 => not_ready
      // CTR vsAvg "above" corrected to "below" (overall <= 3)
      // fatigueDays.high 20 capped to 7 (overall <= 3)
      // hookRetention.high 50 capped to 30 (hook 2 <= 3)
      // cvr.high 3.0 capped to 1.5 (overall <= 3)
      // confidence: overall 1.8 <= 3, spread = 2-1 = 1 <= 3 => "High"
      verdict: "not_ready",
      confidence: "High",
      ctrVsAvg: "below",
      fatigueDaysHighMax: 7,
      hookRetentionHighMax: 30,
      cvrHighMax: 1.5,
    },
  },
];
