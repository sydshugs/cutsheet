// claudeService.ts — Claude Sonnet for text outputs (improvements, briefs, CTA rewrites)

import Anthropic from "@anthropic-ai/sdk";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

function getClient(): Anthropic {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

// ─── IMPROVEMENTS ────────────────────────────────────────────────────────────

export async function generateImprovements(
  analysisMarkdown: string,
  scores: { hook: number; clarity: number; cta: number; production: number; overall: number } | null
): Promise<string[]> {
  if (!scores) return [];

  const weakAreas = Object.entries(scores)
    .filter(([key, val]) => key !== "overall" && val <= 6)
    .map(([key, val]) => `${key}: ${val}/10`)
    .join(", ");

  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are a senior performance marketing creative strategist. You write short, specific, actionable improvement suggestions for video ads. Each suggestion should be 1-2 sentences max. Focus on the weakest scoring areas. No fluff, no preamble.`,
    messages: [
      {
        role: "user",
        content: `Here is a video ad analysis:\n\n${analysisMarkdown}\n\nWeakest areas: ${weakAreas || "none particularly weak"}\n\nWrite exactly 4-6 bullet-point improvements. Return ONLY the bullet points, one per line, starting with "- ". No headers, no numbering, no extra text.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

// ─── CREATIVE BRIEF ──────────────────────────────────────────────────────────

export async function generateBriefWithClaude(
  analysisMarkdown: string,
  filename: string
): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are a senior creative strategist at a top performance marketing agency. You write tight, actionable creative briefs that creative teams can execute immediately. Your briefs are specific to the ad analyzed — not generic templates.`,
    messages: [
      {
        role: "user",
        content: `Based on this video ad analysis for "${filename}", write a creative brief for the next iteration of this ad. Structure it exactly like this:

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

---

Analysis:
${analysisMarkdown}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  if (!text.trim()) throw new Error("Claude returned empty brief");
  return text;
}

// ─── CTA REWRITES ────────────────────────────────────────────────────────────

export async function generateCTARewrites(
  currentCTA: string,
  productContext: string
): Promise<string[]> {
  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    system: `You are a direct-response copywriter. You write short, punchy CTAs for paid social ads. Each CTA should be under 8 words. Focus on urgency, clarity, and conversion.`,
    messages: [
      {
        role: "user",
        content: `The current CTA section from this ad analysis:\n\n${currentCTA}\n\nProduct/context: ${productContext}\n\nWrite exactly 3 alternative CTA options. Return ONLY the 3 CTAs, one per line, no numbering, no extra text.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return text
    .split("\n")
    .map((line) => line.replace(/^\d+[.)]\s*/, "").replace(/^[-•*]\s*/, "").replace(/^[""]|[""]$/g, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);
}

// ─── SECOND EYE REVIEW ───────────────────────────────────────────────────────

export async function generateSecondEyeReview(
  analysisMarkdown: string,
  fileName: string
): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are a first-time viewer watching organic social content. You have never seen this video. You scroll fast, your attention span is short, and you are brutally honest about when you would stop watching and why. Provide specific, timestamped feedback — not vague observations.`,
    messages: [
      {
        role: "user",
        content: `Based on this analysis of "${fileName}", act as a first-time viewer. List timestamped moments where a new viewer would stop watching and why.

Format: **[Timestamp]** — [What happens] → [Why a viewer stops here]

Be specific. Be brutal. Focus on the first 30 seconds. 3–6 moments maximum.

Analysis:
${analysisMarkdown}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  if (!text.trim()) throw new Error("Claude returned empty Second Eye review");
  return text;
}
