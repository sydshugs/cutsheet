// api/platform-score.ts — Claude: platform-specific re-score (serverless)
// Takes cached Gemini analysis + target platform → returns platform-specific scorecard
// This is the "Phase 2" of the split analysis — fast and cheap.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { safePlatform, safeAdType, safeNiche } from "./_lib/validateInput";
import { sanitizeSessionMemory, sanitizeAnalysisText } from "./_lib/sanitizeMemory";

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
  instagram: `Prioritize: visually striking imagery, cohesive grid aesthetic, strong first-frame hook, Reels-compatible vertical format, hashtag strategy, save-worthy content. Penalize: low-quality images, text-heavy static posts, no clear CTA, generic stock photography.`,
  facebook: `Prioritize: thumb-stop in first frame, clear value prop, sound-off readability, strong CTA above fold, text overlay on key moments, engagement-driving copy. Penalize: long intros without text, no captions, weak opening frame.`,
  pinterest: `Prioritize: vertical 2:3 aspect ratio, text overlay with clear value prop, lifestyle imagery, rich pin compatibility, keyword-rich description, save-worthy design. Penalize: horizontal format, no text overlay, hard-sell copy, low-resolution imagery.`,
};

const ORGANIC_PLATFORM_GUIDANCE: Record<string, string> = {
  tiktok: `Prioritize: scroll-stop in first 0.5s, native feel (phone-shot energy beats polished production), trending audio, text overlay that matches the audio beat, rewatch-triggering payoff, completion through 100%. Penalize: polished/corporate feel, horizontal framing, stock music, slow or exposition-heavy intros.`,
  reels: `Prioritize: vertical 9:16 framing, strong visual opener, trending or native-feel audio, text overlays at key beats, save-worthy payoff (information, transformation, aesthetic), share triggers (DM-worthy moments). Penalize: horizontal format, overly produced content, slow pacing, no clear reason to save or share.`,
  shorts: `Prioritize: strong hook in first 3s (skip threshold), vertical format, fast pacing, clear on-screen text, rewatch-triggering reveals or payoffs. Penalize: weak audio, no clear narrative, slow opener, horizontal framing.`,
  meta: `Prioritize: thumb-stop opener, save-worthy content (educational, inspirational, relatable), sound-off readability, strong first-frame or first-line clarity, platform-native post energy. Penalize: ad-like framing, stock imagery, long exposition, no clear value for the scroller.`,
  instagram: `Prioritize: editorial or platform-native aesthetic, cohesive feel, strong first-frame hook, save-worthy content (aesthetic, educational, quotable), shareable moments for Stories/DMs, caption discoverability. Penalize: low-quality imagery, generic stock look, hard-sell framing, no clear save/share trigger.`,
  pinterest: `Prioritize: vertical 2:3 aspect ratio, text overlay with clear value prop, lifestyle or how-to imagery, rich pin compatibility, keyword-rich on-image text, save-worthy design (Pinterest rewards save rate above everything). Penalize: horizontal format, no text overlay, hard-sell copy, low-resolution imagery.`,
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

  const { analysisMarkdown: rawAnalysis, platform: rawPlatform, adType: rawAdType, userContext: rawUserContext, niche: rawNiche, scores, isOrganic: rawIsOrganic } = req.body ?? {};
  const isOrganic = rawIsOrganic === true;

  if (!rawAnalysis || !rawPlatform) {
    return res.status(400).json({ error: "Missing analysisMarkdown or platform" });
  }

  const analysisMarkdown = sanitizeAnalysisText(rawAnalysis);

  // Sanitize user-supplied fields before prompt injection
  const platform = safePlatform(rawPlatform);
  const adType = safeAdType(rawAdType);
  const nicheLabel = safeNiche(rawNiche);
  const userContext = sanitizeSessionMemory(rawUserContext);

  const platformKey = platform.toLowerCase().replace(/\s+/g, "");
  const guidance = isOrganic
    ? (ORGANIC_PLATFORM_GUIDANCE[platformKey] ?? ORGANIC_PLATFORM_GUIDANCE.meta)
    : (PLATFORM_GUIDANCE[platformKey] ?? PLATFORM_GUIDANCE.meta);

  // Niche-specific platform expectations — all 8 niches
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
    health: {
      meta: "Health & wellness on Meta: transformation results (before/after) drive highest engagement. UGC testimonials from real users outperform clinical claims. Avoid medical language that triggers policy flags. Show the product in daily routine context.",
      tiktok: "Health on TikTok: 'what I eat in a day' and routine formats dominate. Must feel like wellness content, not an ad. Creator-led with casual tone. Specific results ('in 2 weeks') outperform vague claims.",
      youtube: "Health on YouTube: educational long-form works — explain the science, show the process. First 5s must show the result or transformation. Expert authority (doctor, nutritionist) adds credibility.",
    },
    finance: {
      meta: "Finance/fintech on Meta: lead with the pain point (fees, complexity, waiting). Screen recordings of the app experience. Trust signals (FDIC, encryption) must be visible. Avoid hype — financial audiences are skeptical.",
      tiktok: "Finance on TikTok: 'money hack' and 'I saved $X' formats. Must feel like financial advice from a friend. Avoid corporate jargon. Quick tips with specific numbers perform best.",
      youtube: "Finance on YouTube: detailed explainers and comparisons. Show the dashboard/interface early. Transparency builds trust — show real numbers. End with clear CTA and offer.",
    },
    food: {
      meta: "Food & beverage on Meta: close-up product shots with steam/pour/sizzle. Sound-off must still look appetizing. UGC taste reactions outperform polished brand content. Price and offer in first frame.",
      tiktok: "Food on TikTok: ASMR preparation, taste test reactions, recipe integration. Must trigger craving in first frame. Trending audio + satisfying visuals. 'You NEED to try this' format.",
      youtube: "Food on YouTube: recipe integration, honest reviews, mukbang-style. Longer consideration — show the full experience. End screen with discount code.",
    },
    realestate: {
      meta: "Real estate on Meta: virtual tour snippets, neighborhood highlights, price-first hooks. Carousel format for multiple rooms. Lead generation CTA ('Book a tour') not 'Learn more'.",
      tiktok: "Real estate on TikTok: 'Wait till you see the kitchen' reveal format. POV walkthroughs with trending audio. Price tag hooks ('$X gets you THIS in [city]'). Must feel like house hunting content.",
      youtube: "Real estate on YouTube: full property tours, neighborhood guides, market updates. First 5s must show the hero shot (exterior or best room). Clear CTA for scheduling.",
    },
    agency: {
      meta: "Agency creative on Meta: case study format — show the client result. Before/after metrics. Production quality should be high since you're selling creative services. Strong brand consistency.",
      tiktok: "Agency on TikTok: behind-the-scenes of ad creation, 'we made this ad and it did $X' format. Show the process. Educational content about what makes ads work.",
      youtube: "Agency on YouTube: portfolio showcases, detailed case studies, creative breakdowns. Position as thought leader. End with lead gen CTA.",
    },
    creator: {
      meta: "Creator/content on Meta: personality-led content. Authentic behind-the-scenes. Build parasocial connection. Share the journey, not just the product. Sound-off readability critical for Reels.",
      tiktok: "Creator on TikTok: this IS your native platform. Prioritize trend participation, duets, stitches. Raw authenticity over production value. First 0.5s hook is everything.",
      youtube: "Creator on YouTube: longer-form value content. Vlogs, tutorials, day-in-the-life. Consistency matters more than individual video quality. End screen for subscribe.",
    },
    dtc: {
      meta: "DTC/ecommerce on Meta: thumb-stop visuals are everything. Product-in-use outperforms product-on-white. UGC unboxing and review format. Price/offer visible in first frame.",
      tiktok: "DTC on TikTok: 'TikTok made me buy it' format. Authentic creator reactions. Fast cuts, trending audio. Product reveal in first 2 seconds.",
      youtube: "DTC on YouTube: longer consideration cycle. Detailed product demos, comparison content. End screen CTA with clear offer.",
    },
  };

  const NICHE_ALIASES: Record<string, string> = {
    "ecommerce": "dtc", "ecommerce / dtc": "dtc", "dtc": "dtc", "shopify": "dtc",
    "saas": "saas", "software": "saas", "b2b": "saas",
    "supplements": "supplements",
    "health": "health", "health & wellness": "health", "wellness": "health", "fitness": "health",
    "finance": "finance", "finance / fintech": "finance", "fintech": "finance",
    "banking": "finance", "insurance": "finance",
    "food": "food", "food & beverage": "food", "beverage": "food",
    "restaurant": "food", "cpg": "food",
    "real estate": "realestate", "realestate": "realestate", "property": "realestate",
    "agency": "agency",
    "creator": "creator", "creator / content": "creator", "content": "creator",
    "influencer": "creator",
  };

  const nicheKey = NICHE_ALIASES[nicheLabel.toLowerCase().trim()]
    ?? NICHE_ALIASES[nicheLabel.toLowerCase().replace(/[^a-z\s\/]/g, "").trim()]
    ?? "";
  // Paid niche×platform context is paid-voiced ("SaaS ads on Meta…"). Skip for organic —
  // follow-up ticket will build an organicNichePlatformContext map.
  const nicheContext = isOrganic
    ? ""
    : (nicheKey ? (nichePlatformContext[nicheKey]?.[platformKey] ?? "") : "");

  // Include scores context if available
  const scoresContext = scores
    ? `\nORIGINAL SCORES: Overall ${scores.overall ?? "?"}/10, Hook ${scores.hook ?? "?"}/10, Clarity ${scores.clarity ?? "?"}/10, CTA ${scores.cta ?? "?"}/10, Production ${scores.production ?? "?"}/10`
    : "";

  const systemPrompt = isOrganic
    ? `You are a ${platform} organic content strategist who advises ${nicheLabel} creators on how their content performs natively on ${platform}. You score creator content on organic signals — scroll-stop, save rate, share appeal, rewatch value, algorithm fit — NOT on advertising metrics. A 7 means "performs well as organic ${nicheLabel} content on ${platform}", not "good ad". Be platform-honest and organic-calibrated.

Do NOT suggest adding CTAs, products, offers, urgency, discount codes, or conversion tactics.
Do NOT invent a product or brand if none is visible in the content.
If this is lifestyle, storytelling, educational, or brand content, judge it on its own terms as organic content.`
    : `You are a ${platform} advertising specialist for ${nicheLabel} brands. You score creative specifically for how ${nicheLabel} ads perform on ${platform} — not generic ad quality. A 7 means "good for ${nicheLabel} on ${platform}", not "good in general". A ${nicheLabel} ad optimized for Meta might score 4 on TikTok. Be platform-honest and niche-calibrated.`;

  const promptOrganic = `A ${nicheLabel} creator's organic post has already been analyzed. Based on the following analysis, generate a platform-specific organic scorecard for ${platform}.

ORIGINAL ANALYSIS:
${analysisMarkdown}
${scoresContext}

CONTENT TYPE: ${adType ?? "video"}
TARGET PLATFORM: ${platform}
NICHE: ${nicheLabel}

${userContext ? `<user_context>\n${userContext}\n</user_context>\n` : ""}

Platform-specific organic scoring guidance for ${platform}:
${guidance}

Score this post specifically for organic ${platform} performance — scroll-stop, completion, save rate, share appeal, rewatch value, algorithm fit. Do NOT score for advertising or conversion performance.

SIGNALS CHECKLIST — REQUIRED (exactly 3 per platform, organic-only):
Each signal is { "label": <≤20-char title-case platform-native check>, "pass": true | false }.
EVIDENCE RULE: mark pass:true ONLY when you can point to specific evidence visible in the creative (e.g. you see a vertical aspect ratio, you see on-screen text overlay, you see creator-style handheld framing, you hear trending audio). If you cannot cite evidence, mark pass:false. Do NOT assume pass by default.
VOCABULARY RULE: labels must be platform-native organic checks. NEVER use paid-ad vocabulary: no "Clear CTA", no "Strong offer", no "Conversion intent", no "Link in bio", no "Shop Now", no "Free Shipping".
Platform-native label anchors (use these or close variants — prefer evidence-specific labels over copying):
- TikTok: "Vertical 9:16", "Trending audio", "Fast hook", "Native cut"
- Instagram Reels: "Vertical 9:16", "Save-worthy", "Creator-native feel", "Audio-forward"
- YouTube Shorts: "Vertical 9:16", "Hook < 3s", "Retention cue", "Loopable end"
- Instagram Feed: "Square 1:1", "Premium aesthetic", "Grid-consistent", "High-contrast"
- Pinterest: "Vertical 2:3", "Search-discoverable", "Text overlay", "Inspirational tone"
- Meta Feed: "Native format", "Thumb-stop", "Mobile-legible", "Square 1:1"

Return a JSON object with these exact keys:
{
  "platform": "${platform}",
  "score": <number 1-10, whole number>,
  "platformFit": <number 1-10, how well this post suits ${platform} natively>,
  "signals": [
    { "label": "<≤20-char platform-native check>", "pass": true|false },
    { "label": "<≤20-char platform-native check>", "pass": true|false },
    { "label": "<≤20-char platform-native check>", "pass": true|false }
  ],
  "strengths": [<3 specific organic strengths for ${platform}>],
  "weaknesses": [<3 specific organic weaknesses for ${platform} — NOT ad weaknesses>],
  "improvements": [<3-5 actionable organic improvements — NOT ad copy rewrites, NOT CTA additions, NOT offer additions>],
  "tips": [<2-3 organic best practice tips for ${platform}>],
  "verdict": "<one sentence summary of how this post performs as organic content on ${platform}>"
}

Return ONLY valid JSON, no markdown fencing.`;

  const promptPaid = `A ${nicheLabel} creative has already been analyzed. Based on the following analysis, generate a platform-specific scorecard for ${platform}.

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

  const prompt = isOrganic ? promptOrganic : promptPaid;

  try {
    const client = getClient();
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0,
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
        ...(isOrganic ? { signals: [] } : {}),
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
