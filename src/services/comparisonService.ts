// comparisonService.ts — Stage 2 Pre-Flight comparison via Gemini

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult } from "./analyzerService";
import type { ComparisonResult, TestType } from "../types/preflight";

const MODEL = "gemini-2.5-flash";

function buildComparisonPrompt(
  analyses: AnalysisResult[],
  labels: string[],
  testType: TestType
): string {
  const testTypeLabel =
    testType === "hook"
      ? "Hook Battle"
      : testType === "cta"
        ? "CTA Showdown"
        : "Full Creative";

  const variantBlocks = analyses
    .map((a, i) => {
      const label = labels[i] || `Variant ${String.fromCharCode(65 + i)}`;
      const s = a.scores;
      const scoreBlock = s
        ? `Overall Score: ${s.overall}/10
Hook Strength: ${s.hook}/10
Message Clarity: ${s.clarity}/10
CTA Effectiveness: ${s.cta}/10
Production Quality: ${s.production}/10`
        : "Scores: Not available";

      return `=== ${label} ===
${scoreBlock}

Full Analysis:
${a.markdown}`;
    })
    .join("\n\n");

  return `You are a senior performance creative strategist with deep expertise in paid social advertising.

You have just analyzed ${analyses.length} video ad variants in a ${testTypeLabel} test.

Here are the full analysis results for each variant:

${variantBlocks}

Your task: Rank these variants by predicted real-world performance in a paid social feed environment (Meta/TikTok).

Return a JSON object with this exact structure:
{
  "winner": {
    "variant": "A",
    "label": "${labels[0] || "Variant A"}",
    "confidence": "high|medium|low",
    "headline": "One punchy sentence explaining why this wins (max 15 words)",
    "reasoning": "2-3 sentences of specific, tactical reasoning. Reference exact timestamps, specific frames, or concrete creative decisions. Do not be vague.",
    "predictedLift": "Estimated performance advantage over the next best variant (e.g. '20-35% higher CTR')"
  },
  "rankings": [
    {
      "rank": 1,
      "variant": "A",
      "label": "${labels[0] || "Variant A"}",
      "overallScore": 8.5,
      "keyStrength": "One sentence on what this variant does best",
      "keyWeakness": "One sentence on its biggest vulnerability",
      "wouldScale": true
    }
  ],
  "headToHead": {
    "hookWinner": "A",
    "hookReason": "Specific reason (1 sentence)",
    "ctaWinner": "B",
    "ctaReason": "Specific reason (1 sentence)",
    "retentionWinner": "A",
    "retentionReason": "Specific reason (1 sentence)"
  },
  "recommendation": "2-3 sentences. What should the media buyer actually DO with these results? Be direct and tactical.",
  "hybridNote": "Optional: If combining elements from multiple variants would create a stronger ad, describe it in 1-2 sentences. Otherwise null."
}

Be precise. Be opinionated. Real performance marketers need a clear answer, not hedging. Respond ONLY with the JSON object. No preamble, no markdown fences.`;
}

export async function runComparison(
  analyses: AnalysisResult[],
  labels: string[],
  testType: TestType,
  apiKey: string
): Promise<ComparisonResult> {
  const prompt = buildComparisonPrompt(analyses, labels, testType);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as ComparisonResult;
  } catch {
    throw new Error("Comparison parse failed: " + text.slice(0, 200));
  }
}
