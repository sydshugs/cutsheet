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

export interface SecondEyeFlag {
  timestamp: string;
  category: "scroll_trigger" | "sound_off" | "pacing" | "clarity";
  severity: "critical" | "warning" | "note";
  issue: string;
  fix: string;
}

export interface SecondEyeResult {
  scrollMoment: string | null;
  flags: SecondEyeFlag[];
  whatItCommunicates: string;
  whatItFails: string;
}

export async function generateSecondEyeReview(
  analysisMarkdown: string,
  fileName: string,
  scores?: { hook: number; overall: number },
  improvements?: string[]
): Promise<SecondEyeResult> {
  const client = getClient();

  const overallScore = scores?.overall ?? "N/A";
  const hookScore = scores?.hook ?? "N/A";
  const improvementsList = improvements?.length
    ? improvements.join("; ")
    : "none provided";

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are watching this video ad for the very first time.
You are a slightly bored person scrolling through your feed on your phone.
You have never seen this brand before. You have no loyalty to it.
You will give this video about 2 seconds before deciding to scroll past.
The creator has been staring at this video for days and is blind to its problems.
Your job is to catch everything they can't see anymore.

Do NOT give general advice. Be specific. Be honest. Be ruthless.
Every flag must have a timestamp.

Look for these specific problems:

SCROLL TRIGGERS — moments you would have scrolled past:
- Hook too slow (key phrase or visual hook after 2 seconds)
- Energy drop (cut, pause, or transition with no new information)
- Confusing opening (first-time viewer has no context)
- Overlong section (same visual/point held too long)

SOUND-OFF FAILURES — what a viewer watching without sound misses:
- Offer mentioned verbally but never shown as text
- Brand/product name spoken but not on screen
- Key benefit only communicated through audio
- Dead air — no text overlay for 3+ seconds

PACING ISSUES — timing problems:
- Hook phrase delivered too fast (viewer can't process it)
- CTA on screen too briefly (under 2 seconds = unreadable)
- Transition too fast or too slow
- Energy builds then drops before the CTA

CLARITY GAPS — things a new viewer won't understand:
- What is being sold? Not clear in first 5 seconds.
- Why should I care? Problem never stated before the solution.
- Who is this for? No indication of target audience.`,
    messages: [
      {
        role: "user",
        content: `Analysis context:
File: ${fileName}
Overall score: ${overallScore}/10
Hook score: ${hookScore}/10
Existing improvements: ${improvementsList}

Full analysis:
${analysisMarkdown}

Return JSON only — no prose, no preamble:
{
  "scrollMoment": "<timestamp + one sentence — when would you scroll, or null>",
  "flags": [
    {
      "timestamp": "<MM:SS or MM:SS-MM:SS range>",
      "category": "scroll_trigger | sound_off | pacing | clarity",
      "severity": "critical | warning | note",
      "issue": "<one sentence, specific>",
      "fix": "<one sentence, actionable>"
    }
  ],
  "whatItCommunicates": "<one sentence — what the video actually communicates to a new viewer>",
  "whatItFails": "<one sentence — the biggest thing it fails to communicate>"
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  if (!text.trim()) throw new Error("Claude returned empty Second Eye review");

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Second Eye: could not parse JSON from response");

  try {
    const parsed = JSON.parse(jsonMatch[0]) as SecondEyeResult;

    // Validate and normalize
    return {
      scrollMoment: parsed.scrollMoment ?? null,
      flags: Array.isArray(parsed.flags)
        ? parsed.flags
            .map((f) => ({
              timestamp: String(f.timestamp ?? ""),
              category: (["scroll_trigger", "sound_off", "pacing", "clarity"].includes(f.category)
                ? f.category
                : "clarity") as SecondEyeFlag["category"],
              severity: (["critical", "warning", "note"].includes(f.severity)
                ? f.severity
                : "note") as SecondEyeFlag["severity"],
              issue: String(f.issue ?? ""),
              fix: String(f.fix ?? ""),
            }))
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, note: 2 };
              return order[a.severity] - order[b.severity];
            })
        : [],
      whatItCommunicates: String(parsed.whatItCommunicates ?? ""),
      whatItFails: String(parsed.whatItFails ?? ""),
    };
  } catch (e) {
    throw new Error(`Second Eye: invalid JSON — ${(e as Error).message}`);
  }
}
