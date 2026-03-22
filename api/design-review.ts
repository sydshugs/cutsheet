// api/design-review.ts — Claude: Static ad design review (typography, layout, hierarchy, contrast)

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory } from "./_lib/sanitizeMemory";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 10, proLimit: 60, windowSeconds: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("design-review", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { analysisMarkdown, fileName, scores, improvements, userContext: rawContext, sessionMemory: rawMemory } = req.body ?? {};
  const sessionMemory = sanitizeSessionMemory(rawMemory);
  const userContext = sanitizeSessionMemory(rawContext);
  if (!analysisMarkdown) return res.status(400).json({ error: "analysisMarkdown is required" });

  const overallScore = scores?.overall ?? "N/A";
  const ctaScore = scores?.cta ?? "N/A";
  const improvementsList = Array.isArray(improvements) && improvements.length
    ? improvements.join(", ")
    : "none provided";

  const contextBlock = userContext
    ? `\n\n${userContext}\nReview this design with the user's niche and platform context in mind. Design standards vary by industry — apply the right expectations.`
    : "";
  const memoryBlock = sessionMemory
    ? `\n\n${sessionMemory}\nIf this user has recurring typography or layout issues across prior ads, flag this as a systemic design habit — not just a one-off.`
    : "";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are a professional graphic designer and art director reviewing this static ad for the first time with fresh eyes.
The creator has been staring at it for hours and is blind to the small things that make it look unpolished.
Your job: find every design and typography issue.
Be specific. Be technical. Be ruthless.
Think like someone who notices bad kerning immediately.${contextBlock}${memoryBlock}

Review these areas:

TYPOGRAPHY:
- Kerning: Are letter pairs too tight or too loose? Flag specific words or headlines.
- Leading: Is line spacing too tight (cramped) or too loose (disconnected)?
- Hierarchy: Is there a clear type scale? (headline → subhead → body → CTA) Does the most important text read first?
- Font weight: Is there enough contrast between bold and regular weights?
- Legibility: Is any text too small to read comfortably? Minimum readable size for ad copy is 14px/10pt.
- Widows/orphans: Any single words alone on a line?
- Alignment: Is text consistently left, center, or right aligned? Mixed alignment without intention looks sloppy.

LAYOUT & ALIGNMENT:
- Grid alignment: Do elements snap to an invisible grid, or do things feel randomly placed?
- Optical centering: Is the hero element truly centered or just mathematically centered (these are different)?
- Margins: Are margins consistent? Too tight on any edge?
- Element spacing: Is spacing between elements consistent or arbitrary? Inconsistent spacing reads as unfinished.
- Breathing room: Is there enough whitespace or is it overcrowded?

VISUAL HIERARCHY:
- Where does the eye land first? Is that where it should?
- Is there a clear primary, secondary, tertiary information order?
- Does the CTA stand out from the background? Is it the most visually distinct element after the hero?

COLOR & CONTRAST:
- Does text meet contrast requirements against its background? (WCAG AA: 4.5:1 for body, 3:1 for large text)
- Is the color palette cohesive or are there clashing hues?
- Are brand colors used consistently?`,
    messages: [
      {
        role: "user",
        content: `Analysis context:
File: ${fileName ?? "unknown"}
Overall score: ${overallScore}/10
CTA score: ${ctaScore}/10
Existing improvements: ${improvementsList}

Full analysis:
${analysisMarkdown}

Return JSON only — no prose, no preamble:
{
  "topIssue": "<the single most critical design problem, one sentence>",
  "flags": [
    {
      "area": "typography | layout | hierarchy | contrast",
      "severity": "critical | warning | note",
      "issue": "<specific, technical, one sentence>",
      "fix": "<specific, actionable, MAX 10 words, no parenthetical examples>"
    }
  ],
  "overallDesignVerdict": "<one honest sentence about the overall design quality>"
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  if (!text.trim()) return res.status(500).json({ error: "Empty response from Claude" });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Could not parse Claude response" });

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return res.status(500).json({ error: "Failed to parse AI response — please try again" });
  }
  const result = {
    topIssue: String(parsed.topIssue ?? ""),
    flags: Array.isArray(parsed.flags)
      ? parsed.flags
          .map((f: Record<string, string>) => ({
            area: (["typography", "layout", "hierarchy", "contrast"].includes(f.area)
              ? f.area : "layout") as string,
            severity: (["critical", "warning", "note"].includes(f.severity)
              ? f.severity : "note") as string,
            issue: String(f.issue ?? ""),
            fix: String(f.fix ?? ""),
          }))
          .sort((a: { severity: string }, b: { severity: string }) => {
            const order: Record<string, number> = { critical: 0, warning: 1, note: 2 };
            return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
          })
      : [],
    overallDesignVerdict: String(parsed.overallDesignVerdict ?? ""),
  };

  return res.status(200).json(result);
}
