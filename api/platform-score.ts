// api/platform-score.ts — Claude: platform-specific re-score (serverless)
// Takes cached Gemini analysis + target platform → returns platform-specific scorecard
// This is the "Phase 2" of the split analysis — fast and cheap.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { safePlatform, safeAdType, safeNiche } from "./_lib/validateInput";
import { sanitizeSessionMemory } from "./_lib/sanitizeMemory";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 20, proLimit: 80, windowSeconds: 60 };

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

const PLATFORM_GUIDANCE: Record<string, string> = {
  tiktok: `Prioritize: native feel, no-border vertical framing, trending audio cues, fast pacing (cut every 2-3s), text overlay accessibility, hook in frame 1. Penalize: corporate/polished feel, horizontal framing, stock music, slow intros.`,
  reels: `Prioritize: native feel, vertical framing, trending audio, Reels-specific engagement hooks, text overlays, quick cuts. Penalize: overly produced content, horizontal format, slow pacing.`,
  shorts: `Prioritize: strong hook in 5s (skip threshold), vertical format, fast pacing, clear text overlays, YouTube-specific end screen CTA. Penalize: weak audio, no clear narrative, buried CTA.`,
  meta: `Prioritize: thumb-stop in first frame, clear value prop, sound-off readability, strong CTA above fold, text overlay on key moments. Penalize: long intros without text, no captions, weak opening frame.`,
  youtube: `Prioritize: strong hook in 5s (skip threshold), audio quality, retention arc, end screen CTA, brand consistency. Penalize: weak audio, no clear narrative, buried CTA.`,
  google: `Prioritize: hierarchy at smallest size, single clear message, brand visibility, CTA button contrast. Penalize: text-heavy layout, low contrast, unclear offer.`,
  display: `Prioritize: hierarchy at smallest size, single clear message, brand visibility, CTA button contrast. Penalize: text-heavy layout, low contrast, unclear offer.`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("platform-score", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { analysisMarkdown, platform: rawPlatform, adType: rawAdType, userContext: rawUserContext, niche: rawNiche, scores } = req.body ?? {};

  if (!analysisMarkdown || !rawPlatform) {
    return res.status(400).json({ error: "Missing analysisMarkdown or platform" });
  }

  // Sanitize user-supplied fields before prompt injection
  const platform = safePlatform(rawPlatform);
  const adType = safeAdType(rawAdType);
  const nicheLabel = safeNiche(rawNiche);
  const userContext = sanitizeSessionMemory(rawUserContext);

  const platformKey = platform.toLowerCase().replace(/\s+/g, "");
  const guidance = PLATFORM_GUIDANCE[platformKey] ?? PLATFORM_GUIDANCE.meta;

  // Niche-specific platform expectations
  const nichePlatformContext: Record<string, Record<string, string>> = {
    supplements: {
      meta: "Supplement ads on Meta: curiosity-gap hooks outperform direct claims. UGC testimonials convert 2-3x vs polished production. Text overlays must avoid health claims that trigger policy review. Sound-off is critical.",
      tiktok: "Supplement ads on TikTok: creator-style 'I tried this' format dominates. Must feel native — polished production tanks engagement. Hook must land in 0.5s. Avoid anything that looks like a traditional ad.",
      youtube: "Supplement ads on YouTube: longer-form education works. First 5s must establish credibility. Audio quality matters — voiceover with b-roll outperforms talking head for supplements.",
    },
    saas: {
      meta: "SaaS ads on Meta: screen recordings with text overlays outperform lifestyle imagery. Problem-solution hooks in 3 seconds. CTA must be specific ('Start free trial') not generic ('Learn more').",
      tiktok: "SaaS ads on TikTok: 'POV: you discover [tool]' format works. Must feel like a tip, not an ad. Screen recordings with casual narration. Avoid corporate language entirely.",
      youtube: "SaaS ads on YouTube: demo-first approach. Show the product working in first 5s. Skip button is the enemy — lead with the outcome, not the problem.",
    },
    ecommerce: {
      meta: "DTC/ecommerce on Meta: thumb-stop visuals are everything. Product-in-use outperforms product-on-white. UGC unboxing and review format. Price/offer visible in first frame.",
      tiktok: "DTC on TikTok: 'TikTok made me buy it' format. Authentic creator reactions. Fast cuts, trending audio. Product reveal in first 2 seconds.",
      youtube: "DTC on YouTube: longer consideration cycle. Detailed product demos, comparison content. End screen CTA with clear offer.",
    },
  };

  const nicheKey = nicheLabel.toLowerCase().replace(/[^a-z]/g, "");
  const platformKey2 = platformKey.replace(/\s+/g, "");
  const nicheContext = Object.entries(nichePlatformContext).find(([k]) => nicheKey.includes(k))?.[1]?.[platformKey2] || "";

  // Include scores context if available
  const scoresContext = scores
    ? `\nORIGINAL SCORES: Overall ${scores.overall ?? "?"}/10, Hook ${scores.hook ?? "?"}/10, Clarity ${scores.clarity ?? "?"}/10, CTA ${scores.cta ?? "?"}/10, Production ${scores.production ?? "?"}/10`
    : "";

  const systemPrompt = `You are a ${platform} advertising specialist for ${nicheLabel} brands. You score creative specifically for how ${nicheLabel} ads perform on ${platform} — not generic ad quality. A 7 means "good for ${nicheLabel} on ${platform}", not "good in general". A ${nicheLabel} ad optimized for Meta might score 4 on TikTok. Be platform-honest and niche-calibrated.`;

  const prompt = `A ${nicheLabel} creative has already been analyzed. Based on the following analysis, generate a platform-specific scorecard for ${platform}.

ORIGINAL ANALYSIS:
${analysisMarkdown}
${scoresContext}

AD TYPE: ${adType ?? "video"}
TARGET PLATFORM: ${platform}
NICHE: ${nicheLabel}

${userContext ? `<user_context>\n${userContext}\n</user_context>\n` : ""}

Platform-specific scoring guidance for ${platform}:
${guidance}

${nicheContext ? `\n${nicheLabel.toUpperCase()} ON ${platform.toUpperCase()} SPECIFICS:\n${nicheContext}` : ""}

Score this ad specifically for ${platform} performance. Return a JSON object with these exact keys:
{
  "platform": "${platform}",
  "score": <number 1-10, whole number>,
  "platformFit": <number 1-10, how well this ad suits ${platform} specifically>,
  "strengths": [<3 specific strengths for ${platform}>],
  "weaknesses": [<3 specific weaknesses for ${platform}>],
  "improvements": [<3-5 actionable platform-specific improvements>],
  "tips": [<2-3 platform best practice tips>],
  "verdict": "<one sentence summary of how this ad performs on ${platform}>"
}

Return ONLY valid JSON, no markdown fencing.`;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch {
      return res.status(200).json({
        platform,
        score: 5,
        platformFit: 5,
        strengths: [],
        weaknesses: [],
        improvements: [],
        tips: [],
        verdict: "Could not parse platform score.",
      });
    }
  } catch (err) {
    console.error("platform-score error:", err);
    return res.status(500).json({ error: "Platform scoring failed" });
  }
}
