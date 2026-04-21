// api/improvements.ts — Claude: improvements + CTA rewrites (serverless)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory, sanitizeUserInput, sanitizeAnalysisText } from "./_lib/sanitizeMemory";
import { apiError } from "./_lib/apiError.js";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 30, proLimit: 120, windowSeconds: 60 };

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("improvements", user.id, user.tier, RATE);
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

  const { action, payload } = req.body ?? {};

  if (action === "improvements") {
    const { analysisMarkdown: rawAnalysis, scores, userContext: rawContext, platform: rawPlatform, sessionMemory: rawMemory, adType: rawAdType } = payload ?? {};
    const sessionMemory = sanitizeSessionMemory(rawMemory);
    const userContext = sanitizeSessionMemory(rawContext);
    const analysisMarkdown = sanitizeAnalysisText(rawAnalysis);
    const platform = sanitizeUserInput(rawPlatform);
    const isOrganic = rawAdType === "organic";
    if (!scores) return res.status(200).json({ improvements: [] });

    const weakAreas = Object.entries(scores as Record<string, number>)
      .filter(([key, val]) => key !== "overall" && val <= 6)
      .map(([key, val]) => `${key}: ${val}/10`)
      .join(", ");

    const contextBlock = userContext
      ? `\n\n${userContext}\n\nUse the user context to inform the specificity, tone, and priorities of each improvement. Do NOT mention the user's role, niche, or platform explicitly in the improvement text. The improvements should feel naturally tailored — not like they're addressing the user directly. Do NOT give generic advice.`
      : "";
    const platformBlock =
      platform && platform !== "all"
        ? `\nOptimize all suggestions specifically for ${platform}. Consider ${platform}-specific best practices, audience behavior, and format requirements.`
        : "";
    const memoryBlock = sessionMemory
      ? `\n\nSESSION HISTORY:\n${sessionMemory}\nDo NOT repeat improvements already given in prior analyses. Prioritize NEW or RECURRING weaknesses.`
      : "";

    const organicSystemPrompt = "You are a senior organic content strategist who advises creators on how to grow reach, saves, shares, and rewatches on TikTok, Instagram Reels, and YouTube Shorts. You write short, specific, actionable improvements for organic content. Each suggestion is 1-2 sentences max. Focus on the weakest scoring areas for ORGANIC performance: hook, clarity, shareability, production. Do NOT suggest adding CTAs, product mentions, offers, urgency language, or conversion tactics — this is organic content, not a paid ad. Do NOT invent a product or brand if none is visible in the creative. No fluff, no preamble.";
    const paidSystemPrompt = "You are a senior performance marketing creative strategist. You write short, specific, actionable improvement suggestions for ads. Each suggestion should be 1-2 sentences max. Focus on the weakest scoring areas. No fluff, no preamble.";

    const message = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: `${isOrganic ? organicSystemPrompt : paidSystemPrompt}${contextBlock}${platformBlock}${memoryBlock}${brandVoiceContext}`,
      messages: [
        {
          role: "user",
          content: `Here is a ${isOrganic ? "video analysis of organic creator content" : "video ad analysis"}:\n\n${analysisMarkdown}\n\nWeakest areas: ${weakAreas || "none particularly weak"}${platform && platform !== "all" ? `\nTarget platform: ${platform}` : ""}\n\nWrite exactly 4-6 bullet-point improvements${isOrganic ? " for organic performance (reach, saves, shares, rewatch)" : ""}. Return ONLY the bullet points, one per line, starting with "- ". No headers, no numbering, no extra text.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const improvements = text
      .split("\n")
      .map((line: string) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line: string) => line.length > 0);

    return res.status(200).json({ improvements });
  }

  if (action === "cta-rewrites") {
    const { currentCTA: rawCTA, productContext: rawProduct, userContext: rawContext, sessionMemory: rawMemory, adType: rawAdType } = payload ?? {};
    const sessionMemory = sanitizeSessionMemory(rawMemory);
    const userContext = sanitizeSessionMemory(rawContext);
    const currentCTA = sanitizeAnalysisText(rawCTA);
    const productContext = sanitizeUserInput(rawProduct);
    const isOrganic = rawAdType === "organic";
    if (!currentCTA) return res.status(200).json({ rewrites: [] });

    const contextBlock = userContext
      ? `\n\n${userContext}\n\nOptimize CTAs specifically for the user's platform and niche. Match the tone and conversion patterns that work for their specific context.`
      : "";
    const memoryBlock = sessionMemory
      ? `\n\n${sessionMemory}\nReference the user's prior ads when crafting CTAs — maintain voice consistency.`
      : "";

    const organicCtaSystem = "You are an organic content strategist writing soft creator-to-viewer nudges for organic posts. This is NOT a paid ad. Write short, natural end-frame lines that prompt an organic action — follow, save, share, comment, DM. Under 8 words each. Do NOT use urgency, discount language, 'Shop Now' / 'Buy Now', or any direct-response ad copy. Do NOT invent a product or brand if none is visible in the creative.";
    const paidCtaSystem = "You are a direct-response copywriter. You write short, punchy CTAs for paid social ads. Each CTA should be under 8 words. Focus on urgency, clarity, and conversion.";

    const message = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      temperature: 0,
      system: `${isOrganic ? organicCtaSystem : paidCtaSystem}${contextBlock}${memoryBlock}${brandVoiceContext}`,
      messages: [
        {
          role: "user",
          content: `The current ${isOrganic ? "end-frame or caption" : "CTA"} section from this ${isOrganic ? "organic post" : "ad"} analysis:\n\n${currentCTA}\n\n${isOrganic ? "Context" : "Product/context"}: ${productContext}\n\nWrite exactly 3 ${isOrganic ? "alternative organic nudges" : "alternative CTA options"}. Return ONLY the 3 ${isOrganic ? "nudges" : "CTAs"}, one per line, no numbering, no extra text.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const rewrites = text
      .split("\n")
      .map((line: string) =>
        line
          .replace(/^\d+[.)]\s*/, "")
          .replace(/^[-•*]\s*/, "")
          .replace(/^[""]|[""]$/g, "")
          .trim()
      )
      .filter((line: string) => line.length > 0)
      .slice(0, 3);

    return res.status(200).json({ rewrites });
  }

  if (action === "brief") {
    const { analysisMarkdown: rawAnalysis, filename: rawFilename, userContext: rawContext, sessionMemory: rawMemory, adFormat, platform: rawPlatform, isOrganic: rawIsOrganic } = payload ?? {};
    const sessionMemory = sanitizeSessionMemory(rawMemory);
    const userContext = sanitizeSessionMemory(rawContext);
    const analysisMarkdown = sanitizeAnalysisText(rawAnalysis);
    const filename = sanitizeUserInput(rawFilename);
    const platform = sanitizeUserInput(rawPlatform);
    const isOrganic = rawIsOrganic === true;
    if (!analysisMarkdown) return res.status(400).json({ error: "analysisMarkdown is required" });

    const formatLabel = adFormat === "static" ? "static" : "video";
    const platformLabel = platform && platform !== "all" ? platform : "";

    const contextBlock = userContext
      ? `\n\n${userContext}\n\nStructure this brief specifically for the user's niche and platform. Use relevant industry terminology and platform best practices.`
      : "";
    const memoryBlock = sessionMemory
      ? `\n\n${sessionMemory}\nReference learnings from prior analyses when structuring this brief. Avoid recommending approaches that already scored poorly.`
      : "";
    const platformBlock = platformLabel
      ? `\n\nOptimize this brief specifically for ${platformLabel} — format, copy length, and hook style should reflect ${platformLabel} best practices.`
      : "";

    const systemPromptPaid = `You are a senior creative strategist at a top performance marketing agency. You write tight, actionable creative briefs that creative teams can execute immediately. Your briefs are specific to the ad analyzed — not generic templates.${contextBlock}${memoryBlock}${platformBlock}${brandVoiceContext}`;

    const systemPromptOrganic = `You are a senior organic content strategist helping a ${platformLabel || "social feed"} creator plan their next post. You write tight, actionable creator briefs targeted at the content's specific weaknesses — not generic templates. You write for organic performance (scroll-stop, save rate, share appeal, rewatch, audience growth), NEVER for conversion.

This is organic creator content, NOT a paid ad. Output rules (violations = failure):
- **Proof Points** must be creator credibility signals — the creator's lived experience, niche expertise, community trust, trend participation, audience relevance. NEVER review counts, star ratings, testimonials-as-social-proof, money-back guarantees, or risk-free trials.
- **CTA** section must hold a SOFT ENGAGEMENT PROMPT — "follow for part 2", "save for your next [X]", "comment your favorite", "share with someone who [Y]". NEVER "Shop Now", "Link in bio", "Free Shipping", "Use code", "discount", "buy now", or any purchase/conversion copy. The section label stays "CTA" for schema compatibility; the content is organic.
- **Format** must be a creator-native format (authentic cut, POV storytelling, lifestyle vignette, day-in-the-life, talking-head, voiceover with b-roll). NEVER "UGC product demonstration" — UGC as a format term is paid advertising vocabulary.
- **Hook Direction** must describe organic scroll-stop moments (pattern interrupt, curiosity gap, relatable-moment opener, visual hook in first frame). NEVER product reveals or CTA openers.
- Do NOT invent a product or brand if none is visible in the analysis. If this is lifestyle, storytelling, educational, or brand content, treat it on its own terms.
- Do NOT use ad terminology (impression, CPA, CTR, CPM, ROAS, funnel, lead, conversion).${contextBlock}${memoryBlock}${platformBlock}${brandVoiceContext}`;

    const systemPrompt = isOrganic ? systemPromptOrganic : systemPromptPaid;

    const userMessagePaid = `Based on this ${formatLabel} ad analysis for "${filename ?? "this ad"}", write a creative brief for the next iteration of this ad. Structure it exactly like this:

## Creative Brief

**Objective:** One sentence on what this ad should achieve.

**Target Audience:** Who this is for, what they care about, what their pain point is.

**Hook Direction:** 2-3 hook concepts with the first 3 seconds described for each.

**Format:** [UGC / Talking head / Lifestyle / Animation / Other] — and why this format fits the audience.

**Key Message:** The single most important thing the viewer should feel or understand.

**Proof Points:** What evidence or credibility to include.

**CTA:** Exact CTA copy + placement recommendation.

**Do:** 3 things the creative must include or achieve.

**Don't:** 3 things to avoid.

CRITICAL FORMAT RULES — follow EXACTLY or the parser will break:
- Every section MUST start with **Label:** followed by content on the same line
- Use exactly these label names: Objective, Target Audience, Hook Direction, Format, Key Message, Proof Points, CTA, Do, Don't
- For numbered items (Hook Direction), put each on its own line starting with 1. 2. 3.
- For bullet items (Proof Points, Do, Don't), put each on its own line starting with -
- Do NOT add any extra markdown formatting, headers, or dividers
- Do NOT wrap the brief in code fences

---

Analysis:
${analysisMarkdown}`;

    const userMessageOrganic = `Based on this ${formatLabel} creator content analysis for "${filename ?? "this post"}", write a creator brief for the next iteration. This is organic creator content — NOT a paid ad. Structure it exactly like this:

## Creative Brief

**Objective:** One sentence on what this post should achieve — organic performance (scroll-stop, save, share, rewatch, reach new audience). NOT conversion or sales.

**Target Audience:** Feed scrollers on ${platformLabel || "this platform"} who save, share, or rewatch this type of content. Describe who they are, what they care about, what would make them stop scrolling. NOT "shoppers" or "buyers" — feed viewers.

**Hook Direction:** 2-3 organic hook concepts with the first 3 seconds described for each. Each hook must be a scroll-stop pattern interrupt, curiosity gap, relatable moment, or creator-to-camera opener. NO product reveals. NO CTAs in the hook.

**Format:** [Authentic cut / POV storytelling / Lifestyle vignette / Day-in-the-life / Talking head / Voiceover with b-roll / Other creator-native format] — and why this fits the creator and audience. NOT "UGC product demonstration" (UGC is paid ad vocabulary).

**Key Message:** The single most important thing the feed viewer should feel or take away. NOT a product benefit or value prop pitch.

**Proof Points:** 3 creator-credibility signals specific to THIS creator and niche — examples: lived experience ("I've done this for 5 years"), community trust ("my followers know I only recommend things I actually use"), niche expertise, trend participation, specific personal detail. NEVER "review count", "5-star rating", "money-back guarantee", "risk-free trial", or any paid social-proof format.

**CTA:** A SOFT ENGAGEMENT PROMPT — examples: "save this for your next beach day", "comment your favorite part", "share with someone who'd love this", "follow for part 2". NEVER "Shop Now", "Link in bio", "Free Shipping", "Use code", "discount", "buy now", or any purchase language. Output format: one short line + placement note (e.g., "end card", "pinned comment", "caption last line").

**Do:** 3 things the creative must include — each must address a specific weakness from the analysis. Each must be organic-native (save-worthy moment, share trigger, rewatchability, trend awareness, creator-voice authenticity).

**Don't:** 3 things to avoid — each should call out a specific ad-voice pattern the creator must not adopt (no "Shop Now", no product pitch, no urgency copy, no hard sell, no ad terminology).

CRITICAL FORMAT RULES — follow EXACTLY or the parser will break:
- Every section MUST start with **Label:** followed by content on the same line
- Use exactly these label names: Objective, Target Audience, Hook Direction, Format, Key Message, Proof Points, CTA, Do, Don't
- For numbered items (Hook Direction), put each on its own line starting with 1. 2. 3.
- For bullet items (Proof Points, Do, Don't), put each on its own line starting with -
- Do NOT add any extra markdown formatting, headers, or dividers
- Do NOT wrap the brief in code fences

---

Analysis:
${analysisMarkdown}`;

    const userMessage = isOrganic ? userMessageOrganic : userMessagePaid;

    const message = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const brief = message.content[0].type === "text" ? message.content[0].text : "";
    if (!brief.trim()) return apiError(res, 'GENERATION_FAILED', 500, "Claude returned empty brief");
    return res.status(200).json({ brief });
  }

  return res.status(400).json({ error: "Unknown action. Use 'improvements', 'cta-rewrites', or 'brief'." });
}
