/**
 * Golden scoring fixtures — 8 test cases covering edge cases for guardrail validation.
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
  };
}

export const fixtures: GoldenFixture[] = [
  {
    name: "perfect-static-meta",
    scores: { hook: 9, clarity: 9, cta: 10, production: 9, overall: 10 },
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
      verdict: "ready",
      confidence: "High",
      ctrVsAvg: "above",
    },
  },
  {
    name: "terrible-tiktok-video",
    scores: { hook: 2, clarity: 3, cta: 2, production: 2, overall: 8 },
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
      verdict: "not_ready",
      confidence: "High",
      ctrVsAvg: "below",
      fatigueDaysHighMax: 7,
      hookRetentionHighMax: 30,
      cvrHighMax: 1.5,
    },
  },
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
      verdict: "needs_work",
      confidence: "Medium",
    },
  },
  {
    name: "mid-range-youtube",
    scores: { hook: 5, clarity: 6, cta: 5, production: 6, overall: 6 },
    platform: "YouTube",
    niche: "SaaS",
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
      verdict: "needs_work",
      confidence: "Medium",
    },
  },
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
      verdict: "needs_work",
      confidence: "Medium",
    },
  },
  {
    name: "platform-cta-video",
    scores: { hook: 7, clarity: 8, cta: 7, production: 8, overall: 8 },
    platform: "Meta",
    niche: "Ecommerce / DTC",
    format: "video",
    mockPrediction: {
      ctr: { low: 1.8, high: 3.0, benchmark: 2.1, vsAvg: "above" },
      cvr: { low: 1.2, high: 2.5 },
      hookRetention: { low: 35, high: 50 },
      fatigueDays: { low: 10, high: 21 },
      confidence: "High",
      confidenceReason: "Strong signals across all dimensions with good benchmark data.",
      positiveSignals: ["Clear value proposition", "Platform-native CTA flow"],
      negativeSignals: ["Hook could be more distinctive"],
    },
    mockVerdict: "ready",
    expected: {
      verdict: "needs_work",
      confidence: "Medium",
    },
  },
  {
    name: "display-banner-300x250",
    scores: { hook: 6, clarity: 7, cta: 8, production: 7, overall: 7 },
    platform: "Google",
    niche: "Ecommerce / DTC",
    format: "static",
    mockPrediction: {
      ctr: { low: 2.5, high: 5.0, benchmark: 3.5, vsAvg: "at" },
      cvr: { low: 1.0, high: 2.0 },
      hookRetention: null,
      fatigueDays: { low: 10, high: 20 },
      confidence: "Medium",
      confidenceReason: "Good data for DTC display ads on Google.",
      positiveSignals: ["Strong CTA", "Clean layout"],
      negativeSignals: ["Average hook for display"],
    },
    mockVerdict: "needs_work",
    expected: {
      verdict: "needs_work",
      confidence: "Medium",
    },
  },
  {
    name: "unknown-niche",
    scores: { hook: 6, clarity: 6, cta: 5, production: 7, overall: 6 },
    platform: "Meta",
    niche: "Pet Supplies",
    format: "video",
    mockPrediction: {
      ctr: { low: 1.0, high: 2.0, benchmark: 1.5, vsAvg: "at" },
      cvr: { low: 0.5, high: 1.5 },
      hookRetention: { low: 25, high: 40 },
      fatigueDays: { low: 8, high: 16 },
      confidence: "Low",
      confidenceReason: "No specific benchmark data for this niche.",
      positiveSignals: ["Decent production value"],
      negativeSignals: ["Generic hook", "Weak CTA"],
    },
    mockVerdict: "needs_work",
    expected: {
      verdict: "needs_work",
      confidence: "Medium",
    },
  },
];
