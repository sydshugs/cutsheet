// api/improvements.ts — Claude: improvements + CTA rewrites (serverless)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory } from "./_lib/sanitizeMemory";

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

  const { action, payload } = req.body ?? {};

  if (action === "improvements") {
    const { analysisMarkdown, scores, userContext: rawContext, platform, sessionMemory: rawMemory } = payload ?? {};
    const sessionMemory = sanitizeSessionMemory(rawMemory);
    const userContext = sanitizeSessionMemory(rawContext);
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

    const message = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: `You are a senior performance marketing creative strategist. You write short, specific, actionable improvement suggestions for ads. Each suggestion should be 1-2 sentences max. Focus on the weakest scoring areas. No fluff, no preamble.${contextBlock}${platformBlock}${memoryBlock}`,
      messages: [
        {
          role: "user",
          content: `Here is a video ad analysis:\n\n${analysisMarkdown}\n\nWeakest areas: ${weakAreas || "none particularly weak"}${platform && platform !== "all" ? `\nTarget platform: ${platform}` : ""}\n\nWrite exactly 4-6 bullet-point improvements. Return ONLY the bullet points, one per line, starting with "- ". No headers, no numbering, no extra text.`,
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
    const { currentCTA, productContext, userContext: rawContext, sessionMemory: rawMemory } = payload ?? {};
    const sessionMemory = sanitizeSessionMemory(rawMemory);
    const userContext = sanitizeSessionMemory(rawContext);
    if (!currentCTA) return res.status(200).json({ rewrites: [] });

    const contextBlock = userContext
      ? `\n\n${userContext}\n\nOptimize CTAs specifically for the user's platform and niche. Match the tone and conversion patterns that work for their specific context.`
      : "";
    const memoryBlock = sessionMemory
      ? `\n\n${sessionMemory}\nReference the user's prior ads when crafting CTAs — maintain voice consistency.`
      : "";

    const message = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: `You are a direct-response copywriter. You write short, punchy CTAs for paid social ads. Each CTA should be under 8 words. Focus on urgency, clarity, and conversion.${contextBlock}${memoryBlock}`,
      messages: [
        {
          role: "user",
          content: `The current CTA section from this ad analysis:\n\n${currentCTA}\n\nProduct/context: ${productContext}\n\nWrite exactly 3 alternative CTA options. Return ONLY the 3 CTAs, one per line, no numbering, no extra text.`,
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
    const { analysisMarkdown, filename, userContext: rawContext, sessionMemory: rawMemory, adFormat, platform } = payload ?? {};
    const sessionMemory = sanitizeSessionMemory(rawMemory);
    const userContext = sanitizeSessionMemory(rawContext);
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

    const message = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: `You are a senior creative strategist at a top performance marketing agency. You write tight, actionable creative briefs that creative teams can execute immediately. Your briefs are specific to the ad analyzed — not generic templates.${contextBlock}${memoryBlock}${platformBlock}`,
      messages: [
        {
          role: "user",
          content: `Based on this ${formatLabel} ad analysis for "${filename ?? "this ad"}", write a creative brief for the next iteration of this ad. Structure it exactly like this:

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
${analysisMarkdown}`,
        },
      ],
    });

    const brief = message.content[0].type === "text" ? message.content[0].text : "";
    if (!brief.trim()) return res.status(500).json({ error: "Claude returned empty brief" });
    return res.status(200).json({ brief });
  }

  return res.status(400).json({ error: "Unknown action. Use 'improvements', 'cta-rewrites', or 'brief'." });
}
