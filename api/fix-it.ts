// api/fix-it.ts — Claude: "Fix It For Me" full ad rewrite (serverless)
// Takes cached analysis + context → returns structured rewrite with predicted improvements

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { safePlatform, safeAdType, safeNiche } from "./_lib/validateInput";
import { sanitizeSessionMemory, sanitizeAnalysisText } from "./_lib/sanitizeMemory";
import { apiError } from "./_lib/apiError.js";
import { logApiUsage } from "./_lib/logUsage";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 5, proLimit: 30, windowSeconds: 60 };

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const start = Date.now();

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("fix-it", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  // Fetch brand voice from user profile (non-fatal)
  let brandVoiceContext = "";
  try {
    const supabaseAdmin = createClient(
      (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL)!,
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)!,
      { auth: { persistSession: false } }
    );
    const { data: profileData } = await supabaseAdmin
      .from("user_profiles")
      .select("brand_voice_description, brand_voice_tags")
      .eq("user_id", user.id)
      .single();
    const rawDesc = profileData?.brand_voice_description ?? "";
    const rawTags: string[] = profileData?.brand_voice_tags ?? [];
    if (rawDesc) {
      brandVoiceContext = `\nBrand voice: ${sanitizeSessionMemory(rawDesc)}\nVoice tags: ${rawTags.map((t: string) => sanitizeSessionMemory(t)).join(", ")}\n\nAll copy rewrites, hooks, CTAs, and suggestions must match this voice exactly. A voice mismatch is worse than keeping the original copy.\n`;
    }
  } catch {
    // Profile fetch failure is non-fatal — proceed without brand voice
  }

  const { analysisMarkdown: rawAnalysis, platform: rawPlatform, niche: rawNiche, intent: rawIntent, adType: rawAdType, scores, ctaFree, isOrganic: rawIsOrganic } = req.body ?? {};
  const isCTAFree = ctaFree === true;
  const isOrganic = rawIsOrganic === true;

  if (!rawAnalysis) {
    return res.status(400).json({ error: "Missing analysisMarkdown" });
  }

  const analysisMarkdown = sanitizeAnalysisText(rawAnalysis);

  // Sanitize user-supplied fields before prompt injection
  const platform = safePlatform(rawPlatform) === "general" ? "paid social" : safePlatform(rawPlatform);
  const niche = safeNiche(rawNiche);
  const adType = safeAdType(rawAdType);
  const intent = (typeof rawIntent === "string" && ["conversion", "awareness", "consideration"].includes(rawIntent)) ? rawIntent : "conversion";

  // Identify weakest dimensions for targeted fixes
  // When ctaFree, exclude CTA from weak dims — low CTA score is expected and intentional
  const weakDims = scores
    ? Object.entries(scores as Record<string, number>)
        .filter(([k]) => (isCTAFree ? ["hook", "clarity", "production"] : ["hook", "clarity", "cta", "production"]).includes(k))
        .sort(([, a], [, b]) => a - b)
        .slice(0, 2)
        .map(([k, v]) => `${k}: ${v}/10`)
    : [];

  const platformCopyRules: Record<string, string> = {
    meta: "Meta copy rules: Primary text under 125 chars for full visibility. Headline under 40 chars. No ALL CAPS in headlines. CTA must match the ad objective (Shop Now for commerce, Learn More for awareness).",
    tiktok: "TikTok copy rules: Speak like a creator, not a brand. Use first person. Text overlays must be readable at 9:16 on mobile. No corporate language. Hook must be in the first line of caption.",
    instagram: "Instagram copy rules: First line is the hook (before 'more' truncation). Use line breaks for readability. Hashtags at the end, not inline. CTA in the last line.",
    youtube: "YouTube copy rules: First 5 seconds must deliver the value prop verbally AND visually. End screen CTA must be specific. Audio is primary — text overlays support, not replace.",
    google: "Display copy rules: Headline max 30 chars. One message per banner. CTA button must have high contrast. No body copy that requires reading — the ad has <2 seconds of attention.",
  };

  const organicPlatformCopyRules: Record<string, string> = {
    tiktok: "TikTok organic rules: Speak like a creator, not a brand. First person. Hook in the first line of caption. No brand-speak, no corporate tone. Trending-audio-aware phrasing beats generic copy.",
    reels: "Reels organic rules: First line of caption is the hook (before the 'more' truncation). Use line breaks for readability. Caption should reward saves and shares, not drive clicks.",
    shorts: "Shorts organic rules: Title and caption do the heavy lifting for discoverability. Hook in first 5 seconds of the video, supporting text minimal.",
    meta: "Meta organic rules: Caption under 125 chars for full visibility. Conversational tone. No ALL CAPS. Save-worthy content (educational, inspirational, relatable) beats promotional copy.",
    instagram: "Instagram organic rules: First line is the hook (before 'more' truncation). Line breaks for readability. Hashtags at the end, not inline. Caption should invite saves and DMs, not clicks.",
    pinterest: "Pinterest organic rules: Keyword-rich description (Pinterest is search-driven). Include the topic, style, and use case. On-image text should reinforce the pin's value prop.",
  };

  const platformRules = isOrganic
    ? (organicPlatformCopyRules[platform] || "")
    : (platformCopyRules[platform] || "");

  const systemPrompt = isOrganic
    ? `You are a senior creator strategist specializing in <user_niche>${niche}</user_niche> organic content on <user_platform>${platform}</user_platform>. You're rewriting a <user_content_type>${adType}</user_content_type> post that scored ${scores?.overall ?? "?"}/10 overall, with weakest areas: ${weakDims.join(", ") || "not identified"}.

Your rewrites must:
- Preserve the creator's existing voice and tone — read the original carefully before rewriting
- Be specific to ${niche} content — use language ${niche} creators and audiences actually use, not marketing speak
- Follow ${platform} organic best practices and character limits
- Fix the specific weaknesses identified in the scorecard — don't touch what scored 8+
- Address the weakest dimensions FIRST: ${weakDims.join(", ") || "all areas"}
- Rewrite for organic performance: scroll-stop, save rate, share appeal, completion, rewatch. NOT for conversion.

ANTI-CTA RULES (violations = failure):
- Do NOT suggest adding a CTA, "Shop Now" button, discount code, offer, or purchase language.
- Do NOT invent a product or brand if none is visible in the content.
- Do NOT add urgency copy ("Act now!", "Limited time!", "Last chance!") — organic content earns attention, it doesn't demand it.
- For the "newCTA" field in your JSON response, return a SOFT ENGAGEMENT PROMPT only (e.g., "comment your pick", "save for your next plan", "share with someone who needs this", "follow for part two") — NEVER a conversion CTA. If no engagement prompt fits, return { "copy": "", "placement": "N/A" }.
- Every rewritten line must reference something specific from THIS post — a visual element, the creator's phrasing, a score finding.
- If you catch yourself writing copy that could apply to any product in any niche, delete it and try again.

IMPORTANT FIELD MAPPING — the response uses paid-named fields for schema compatibility, but the VALUES are organic:
- "newCTA" field → soft engagement prompt (follow/save/share/comment/DM) — NOT a conversion CTA.
- All other fields retain their plain meanings (hook = hook, revisedBody = full rewrite, textOverlays = on-screen text, predictedImprovements = score lifts).${brandVoiceContext}`
    : `You are a senior performance creative director specializing in <user_niche>${niche}</user_niche> advertising on <user_platform>${platform}</user_platform>. You're rewriting a <user_ad_type>${adType}</user_ad_type> ad that scored ${scores?.overall ?? "?"}/10 overall, with weakest areas: ${weakDims.join(", ") || "not identified"}.

Your rewrites must:
- Preserve the brand's existing voice and tone — read the original ad carefully before rewriting
- Be specific to ${niche} category — use language ${niche} audiences actually use, not marketing speak
- Follow ${platform} copy best practices and character limits
- Fix the specific weaknesses identified in the scorecard — don't touch what scored 8+
- Address the weakest dimensions FIRST: ${weakDims.join(", ") || "all areas"}

ANTI-GENERIC RULES (violations = failure):
- No "Transform your [X]" or "Don't miss out" or "Take your [X] to the next level"
- No "Unlock the power of" or "Discover the secret to" or "Join thousands who"
- No generic urgency ("Act now!", "Limited time!") unless the original ad used it
- Every rewritten line must reference something specific from THIS ad — a product feature, a score finding, a visual element
- If you catch yourself writing copy that could apply to any product in any niche, delete it and try again
- The rewrite must be so specific to ${niche} on ${platform} that it would be wrong for any other niche/platform combination${brandVoiceContext}${isCTAFree ? `

CTA-FREE AD: This Meta ad intentionally has no in-creative CTA — it relies on Meta's native CTA button in Ads Manager.
Do NOT suggest adding a CTA, Shop Now button, or any verbal call-to-action to the creative.
For the "newCTA" field in your JSON response, return: { "copy": "", "placement": "Uses Meta native CTA button" }.
Focus rewrite energy on hook strength, visual storytelling, offer clarity, and sound-off viability instead.` : ""}`;

  const promptOrganic = `A creator's ${adType} post on ${platform} in the ${niche} niche received this organic scorecard:

${analysisMarkdown}

Scores: Hook ${scores?.hook ?? "?"}/10 | Clarity ${scores?.clarity ?? "?"}/10 | Shareability ${scores?.cta ?? "?"}/10 | Production ${scores?.production ?? "?"}/10 | Overall ${scores?.overall ?? "?"}/10
${weakDims.length ? `\nWEAKEST AREAS (fix these first): ${weakDims.join(", ")}` : ""}

${platformRules}

RULES:
1. Read the original carefully. Match its voice — if it's casual, stay casual. If it's storytelling, stay storytelling.
2. The rewritten hook must stop the scroll on organic ${platform} feed specifically — not paid.
3. Every change must address a specific weakness from the scorecard. Don't change things that scored 8+.
4. Text overlays must be readable on mobile in ${adType === "static" ? "a single glance" : "under 3 seconds"}.
5. The "newCTA" field is a SOFT ENGAGEMENT PROMPT only (follow/save/share/comment/DM) — never a conversion CTA. Empty string + placement "N/A" is fine if no prompt fits.
6. Do NOT invent a product or brand if none is visible.

Return a JSON object with these exact keys:
{
  "rewrittenHook": { "copy": "<new hook text/script>", "reasoning": "<1 sentence why this is stronger for organic ${platform}>" },
  "revisedBody": "<full rewrite with **bold** on every changed part>",
  "newCTA": { "copy": "<soft engagement prompt, or empty string>", "placement": "<where to put it, or 'N/A'>" },
  "textOverlays": [{ "timestamp": "<when>", "copy": "<text>", "placement": "<where>" }],
  "predictedImprovements": [{ "dimension": "<metric name>", "oldScore": <number>, "newScore": <number>, "reason": "<why>" }],
  "editorNotes": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}

Return ONLY valid JSON, no markdown fencing.`;

  const promptPaid = `A user's ${adType} ad on ${platform} in the ${niche} niche received this scorecard:

${analysisMarkdown}

Scores: Hook ${scores?.hook ?? "?"}/10 | Clarity ${scores?.clarity ?? "?"}/10 | CTA ${scores?.cta ?? "?"}/10 | Production ${scores?.production ?? "?"}/10 | Overall ${scores?.overall ?? "?"}/10
${isCTAFree ? "NOTE: CTA score is intentionally low — this ad uses Meta's native CTA button. Do NOT rewrite or suggest a CTA." : ""}
${weakDims.length ? `\nWEAKEST AREAS (fix these first): ${weakDims.join(", ")}` : ""}

User's intent: ${intent} — optimize the rewrite for ${intent === "awareness" ? "brand recall and reach" : intent === "consideration" ? "engagement and click-through" : "direct response and conversion"}.

${platformRules}

RULES:
1. Read the original ad copy carefully. Match its voice — if it's casual, stay casual. If it's technical, stay technical.
2. The rewritten hook must stop the scroll on ${platform} specifically.
3. Every change must address a specific weakness from the scorecard. Don't change things that scored 8+.
4. Text overlays must be readable on mobile in ${adType === "static" ? "a single glance" : "under 3 seconds"}.
5. The CTA must be specific to ${niche} — no generic "Learn More" unless that was the original.

Return a JSON object with these exact keys:
{
  "rewrittenHook": { "copy": "<new hook text/script>", "reasoning": "<1 sentence why this is stronger for ${platform}>" },
  "revisedBody": "<full rewrite with **bold** on every changed part>",
  "newCTA": { "copy": "<rewritten CTA>", "placement": "<where to put it>" },
  "textOverlays": [{ "timestamp": "<when>", "copy": "<text>", "placement": "<where>" }],
  "predictedImprovements": [{ "dimension": "<metric name>", "oldScore": <number>, "newScore": <number>, "reason": "<why>" }],
  "editorNotes": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}

Return ONLY valid JSON, no markdown fencing.`;

  const prompt = isOrganic ? promptOrganic : promptPaid;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      logApiUsage({ userId: user.id, endpoint: "fix-it", statusCode: 200, responseTimeMs: Date.now() - start, platform, niche, format: adType });
      return res.status(200).json(parsed);
    } catch {
      logApiUsage({ userId: user.id, endpoint: "fix-it", statusCode: 200, responseTimeMs: Date.now() - start, platform, niche, format: adType, errorCode: "PARSE_FALLBACK" });
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
    logApiUsage({ userId: user.id, endpoint: "fix-it", statusCode: 500, responseTimeMs: Date.now() - start, platform, niche, format: adType, errorCode: "GENERATION_FAILED" });
    return apiError(res, 'GENERATION_FAILED', 500,
      `[fix-it] ${err instanceof Error ? err.message : String(err)}`);
  }
}
