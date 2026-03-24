// api/fix-it.ts — Claude: "Fix It For Me" full ad rewrite (serverless)
// Takes cached analysis + context → returns structured rewrite with predicted improvements

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 5, proLimit: 30, windowSeconds: 60 };

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("fix-it", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { analysisMarkdown, platform, niche, intent, adType, scores, isOrganic } = req.body ?? {};

  if (!analysisMarkdown) {
    return res.status(400).json({ error: "Missing analysisMarkdown" });
  }

  // Identify weakest dimensions for targeted fixes
  const weakDims = scores
    ? Object.entries(scores as Record<string, number>)
        .filter(([k]) => ["hook", "clarity", "cta", "production"].includes(k))
        .sort(([, a], [, b]) => a - b)
        .slice(0, 2)
        .map(([k, v]) => `${k}: ${v}/10`)
    : [];

  const platformCopyRules: Record<string, string> = {
    Meta: "Meta copy rules: Primary text under 125 chars for full visibility. Headline under 40 chars. No ALL CAPS in headlines. CTA must match the ad objective (Shop Now for commerce, Learn More for awareness).",
    TikTok: "TikTok copy rules: Speak like a creator, not a brand. Use first person. Text overlays must be readable at 9:16 on mobile. No corporate language. Hook must be in the first line of caption.",
    Instagram: "Instagram copy rules: First line is the hook (before 'more' truncation). Use line breaks for readability. Hashtags at the end, not inline. CTA in the last line.",
    YouTube: "YouTube copy rules: First 5 seconds must deliver the value prop verbally AND visually. End screen CTA must be specific. Audio is primary — text overlays support, not replace.",
    "Google Display": "Display copy rules: Headline max 30 chars. One message per banner. CTA button must have high contrast. No body copy that requires reading — the ad has <2 seconds of attention.",
  };

  const platformRules = platformCopyRules[platform ?? ""] || "";

  const organicOverride = isOrganic ? `
ORGANIC CONTENT RULES — THIS IS NOT A PAID AD:
Rewrite to sound like a real creator talking to their audience.
Never use ad language: no urgency, no offer callouts, no CTAs, no "limited time", no "shop now", no conversion language.
Sound like something a person would naturally say on ${platform ?? "social media"}.
Replace any CTA rewrites with engagement hooks (save this, share with a friend, comment your take).
The "newCTA" field should contain an engagement prompt, not a conversion CTA.
` : "";

  const systemPrompt = `You are a senior ${isOrganic ? "content" : "performance"} creative director specializing in ${niche ?? "DTC"} ${isOrganic ? "content" : "advertising"} on ${platform ?? isOrganic ? "social media" : "paid social"}. You're rewriting a ${adType ?? "video"} ${isOrganic ? "post" : "ad"} that scored ${scores?.overall ?? "?"}/10 overall, with weakest areas: ${weakDims.join(", ") || "not identified"}.

Your rewrites must:
- Preserve the brand's existing voice and tone — read the original ad carefully before rewriting
- Be specific to ${niche ?? "this"} category — use language ${niche ?? "this"} audiences actually use, not marketing speak
- Follow ${platform ?? "platform"} copy best practices and character limits
- Fix the specific weaknesses identified in the scorecard — don't touch what scored 8+
- Address the weakest dimensions FIRST: ${weakDims.join(", ") || "all areas"}

ANTI-GENERIC RULES (violations = failure):
- No "Transform your [X]" or "Don't miss out" or "Take your [X] to the next level"
- No "Unlock the power of" or "Discover the secret to" or "Join thousands who"
- No generic urgency ("Act now!", "Limited time!") unless the original ad used it
- Every rewritten line must reference something specific from THIS ad — a product feature, a score finding, a visual element
- If you catch yourself writing copy that could apply to any product in any niche, delete it and try again
- The rewrite must be so specific to ${niche ?? "this product"} on ${platform ?? "this platform"} that it would be wrong for any other niche/platform combination`;

  const prompt = `A user's ${adType ?? "video"} ad on ${platform ?? "unknown platform"} in the ${niche ?? "unknown"} niche received this scorecard:

${analysisMarkdown}

Scores: Hook ${scores?.hook ?? "?"}/10 | Clarity ${scores?.clarity ?? "?"}/10 | CTA ${scores?.cta ?? "?"}/10 | Production ${scores?.production ?? "?"}/10 | Overall ${scores?.overall ?? "?"}/10
${weakDims.length ? `\nWEAKEST AREAS (fix these first): ${weakDims.join(", ")}` : ""}

User's intent: ${intent ?? "conversion"} — optimize the rewrite for ${intent === "awareness" ? "brand recall and reach" : intent === "consideration" ? "engagement and click-through" : "direct response and conversion"}.

${platformRules}

RULES:
1. Read the original ${isOrganic ? "post" : "ad"} copy carefully. Match its voice — if it's casual, stay casual. If it's technical, stay technical.
2. The rewritten hook must stop the scroll on ${platform ?? "the feed"} specifically.
3. Every change must address a specific weakness from the scorecard. Don't change things that scored 8+.
4. Text overlays must be readable on mobile in ${adType === "static" ? "a single glance" : "under 3 seconds"}.
${isOrganic ? "5. No CTA buttons, no conversion language. The engagement prompt should feel natural for organic content." : `5. The CTA must be specific to ${niche ?? "this product"} — no generic "Learn More" unless that was the original.`}
${organicOverride}

Return a JSON object with these exact keys:
{
  "rewrittenHook": { "copy": "<new hook text/script>", "reasoning": "<1 sentence why this is stronger for ${platform ?? "this platform"}>" },
  "revisedBody": "<full rewrite with **bold** on every changed part>",
  "newCTA": { "copy": "<rewritten CTA>", "placement": "<where to put it>" },
  "textOverlays": [{ "timestamp": "<when>", "copy": "<text>", "placement": "<where>" }],
  "predictedImprovements": [{ "dimension": "<metric name>", "oldScore": <number>, "newScore": <number>, "reason": "<why>" }],
  "editorNotes": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}

Return ONLY valid JSON, no markdown fencing.`;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
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
        rewrittenHook: { copy: "", reasoning: "" },
        revisedBody: "",
        newCTA: { copy: "", placement: "" },
        textOverlays: [],
        predictedImprovements: [],
        editorNotes: ["Could not parse rewrite response."],
      });
    }
  } catch (err) {
    console.error("fix-it error:", err);
    return res.status(500).json({ error: "Fix-it rewrite failed" });
  }
}
