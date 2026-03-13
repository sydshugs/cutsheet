import type { BudgetRecommendation, Hashtags } from "../../services/analyzerService";
import type { ComparisonResult, RankedVariant } from "../../types/preflight";

// ─── Sequence 1 & 2: Single Analysis ─────────────────────────────────────────

export const MOCK_SCORES = {
  hook: 9,
  clarity: 8,
  cta: 3,
  production: 9,
  overall: 8,
};

export const MOCK_FILENAME = "summer-campaign-v2.mp4";

export const MOCK_IMPROVEMENTS = [
  "Add a text overlay reinforcing the offer at the 3-second mark",
  "Hook is strong — consider a faster cut at 0:04 to maintain momentum",
  "Include a direct CTA in the final 2 seconds with urgency copy",
];

export const MOCK_BUDGET: BudgetRecommendation = {
  verdict: "Boost It",
  platform: "TikTok + Meta",
  daily: "$100–$200/day",
  duration: "7 days",
  reason:
    "Strong hook and production quality signal high engagement potential across visual-first platforms.",
};

export const MOCK_HASHTAGS: Hashtags = {
  tiktok: ["ugcads", "contentcreator", "dtcbrand", "adcreative", "fyp"],
  meta: [
    "digitalmarketing",
    "fbads",
    "performancemarketing",
    "ecommerce",
    "dtc",
  ],
  instagram: [
    "creativeads",
    "brandstrategy",
    "socialads",
    "contentmarketing",
    "growth",
  ],
};

// ─── Sequence 3: Pre-Flight A/B ──────────────────────────────────────────────

export const MOCK_PREFLIGHT_RANKINGS: RankedVariant[] = [
  {
    rank: 1,
    variant: "variant-0",
    label: "Variant A",
    overallScore: 8,
    keyStrength:
      "Immediate pattern interrupt in first frame stops scrollers cold",
    keyWeakness: "CTA is under-emphasized — add urgency copy",
    wouldScale: true,
  },
  {
    rank: 2,
    variant: "variant-1",
    label: "Variant B",
    overallScore: 6,
    keyStrength: "Clean production quality and clear value proposition",
    keyWeakness:
      "Weak opening — static product shot doesn't stop the scroll",
    wouldScale: false,
  },
];

export const MOCK_COMPARISON: ComparisonResult = {
  winner: {
    variant: "variant-0",
    label: "Variant A",
    confidence: "high",
    headline: "Variant A dominates with a stronger hook and faster pacing",
    reasoning:
      "Variant A opens with a bold pattern interrupt that captures attention in the first second. Its pacing maintains engagement throughout, scoring 9/10 on hook strength vs Variant B's 5/10.",
    predictedLift: "15–25% higher CTR/CVR",
  },
  rankings: MOCK_PREFLIGHT_RANKINGS,
  headToHead: {
    hookWinner: "Variant A",
    hookReason:
      "Bold color shift + text overlay vs. slow fade-in product shot",
    ctaWinner: "Variant A",
    ctaReason:
      "Verbal + text CTA at 0:12 vs. no visible CTA in Variant B",
    retentionWinner: "Variant A",
    retentionReason:
      "Dynamic scene cuts (avg 1.2s) vs. static 2.5s scenes in B",
  },
  recommendation:
    "Launch Variant A as the primary creative. Test Variant B for retargeting where a softer approach may work.",
  hybridNote:
    "Consider combining A's hook with B's product close-up for a potential winner.",
};

// ─── Sequence 4: Batch Mode ──────────────────────────────────────────────────

export const MOCK_BATCH_FILES = [
  "hero-spot-final.mp4",
  "ugc-testimonial-v3.mp4",
  "product-demo-15s.mp4",
  "lifestyle-montage.mp4",
  "brand-story-60s.mp4",
];

export interface MockBatchResult {
  id: number;
  rank: number;
  filename: string;
  hook: number;
  clarity: number;
  cta: number;
  retention: number;
  overall: number;
  wouldScale: boolean;
}

export const MOCK_BATCH_RESULTS: MockBatchResult[] = [
  {
    id: 0,
    rank: 1,
    filename: "hero-spot-final.mp4",
    hook: 9,
    clarity: 9,
    cta: 8,
    retention: 9,
    overall: 9,
    wouldScale: true,
  },
  {
    id: 1,
    rank: 2,
    filename: "ugc-testimonial-v3.mp4",
    hook: 8,
    clarity: 8,
    cta: 7,
    retention: 7,
    overall: 8,
    wouldScale: true,
  },
  {
    id: 2,
    rank: 3,
    filename: "product-demo-15s.mp4",
    hook: 7,
    clarity: 7,
    cta: 6,
    retention: 8,
    overall: 7,
    wouldScale: true,
  },
  {
    id: 3,
    rank: 4,
    filename: "lifestyle-montage.mp4",
    hook: 5,
    clarity: 5,
    cta: 4,
    retention: 6,
    overall: 5,
    wouldScale: false,
  },
  {
    id: 4,
    rank: 5,
    filename: "brand-story-60s.mp4",
    hook: 4,
    clarity: 6,
    cta: 3,
    retention: 4,
    overall: 4,
    wouldScale: false,
  },
];
