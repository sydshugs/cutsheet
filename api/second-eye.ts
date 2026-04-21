// api/second-eye.ts — Claude: Second Eye fresh-viewer review for video ads

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory, sanitizeUserInput, sanitizeAnalysisText } from "./_lib/sanitizeMemory";
import { apiError } from "./_lib/apiError.js";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 10, proLimit: 60, windowSeconds: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("second-eye", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { analysisMarkdown: rawAnalysis, fileName: rawFileName, scores, improvements: rawImprovements, userContext: rawContext, sessionMemory: rawMemory, isOrganic: rawIsOrganic } = req.body ?? {};
  const sessionMemory = sanitizeSessionMemory(rawMemory);
  const userContext = sanitizeSessionMemory(rawContext);
  const isOrganic = rawIsOrganic === true;
  if (!rawAnalysis) return res.status(400).json({ error: "analysisMarkdown is required" });

  const analysisMarkdown = sanitizeAnalysisText(rawAnalysis);
  const fileName = sanitizeUserInput(rawFileName);

  const overallScore = scores?.overall ?? "N/A";
  const hookScore = scores?.hook ?? "N/A";
  const improvementsList = Array.isArray(rawImprovements) && rawImprovements.length
    ? rawImprovements.map((imp: unknown) => sanitizeUserInput(String(imp ?? ""))).filter(Boolean).join("; ")
    : "none provided";

  const contextBlock = userContext
    ? `\n\nAdditional context about who made this ad:\n${userContext}\nApply fresh-viewer expectations specific to how people actually scroll this platform. Your timestamped flags should reference what this niche's target customer would do at each moment.`
    : "";
  const memoryBlock = sessionMemory
    ? `\n\n${sessionMemory}\nIf this user has recurring scroll-trigger or clarity issues across prior ads, call that out as a PATTERN — it's more impactful than a one-off flag.`
    : "";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const systemPromptPaid = `You are watching this video ad for the very first time.
You are a slightly bored person scrolling through your feed on your phone.
You have never seen this brand before. You have no loyalty to it.
You will give this video about 2 seconds before deciding to scroll past.
The creator has been staring at this video for days and is blind to its problems.
Your job is to catch everything they can't see anymore.${contextBlock}${memoryBlock}

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
- Who is this for? No indication of target audience.`;

  const systemPromptOrganic = `You are watching this video for the very first time.
You are a regular feed user scrolling your For You page on your phone.
You have never seen this creator before. You have no loyalty to them.
You will give this video about 2 seconds before deciding to scroll past.
The creator has been staring at this video for days and is blind to its problems.
Your job is to catch everything they can't see anymore.${contextBlock}${memoryBlock}

This is organic creator content — NOT a paid ad. Judge it on organic signals only:
- Would a real viewer STOP scrolling on this?
- Would they WATCH it through to the end?
- Would they SAVE it, SHARE it with a friend, or RE-WATCH it?
- Does it trigger the algorithm (high completion, high save rate, high share rate)?

Do NOT suggest adding a CTA, product shot, offer, urgency, or conversion language.
Do NOT invent a product or brand if none is visible — if this is lifestyle, storytelling, or brand content, judge it on its own terms.
Do NOT give general advice. Be specific. Be honest. Be ruthless.
Every flag must have a timestamp.

Look for these specific problems:

SCROLL TRIGGERS — moments you would have scrolled past:
- Hook too slow (visual hook or first-line punch after 2 seconds)
- Energy drop (cut, pause, or transition with no new information)
- Confusing opening (first-time viewer has no context)
- Overlong section (same visual/beat held too long)

SOUND-OFF FAILURES — what a viewer watching without sound misses:
- Key moment only communicated through audio
- On-screen text missing at a crucial beat
- Dead air — no text overlay for 3+ seconds
- Punchline, reveal, or payoff delivered in audio only

PACING ISSUES — timing problems:
- Hook delivered too fast (viewer can't process it)
- Key visual held too briefly to register
- Transition too fast or too slow
- Energy builds then drops before the payoff

CLARITY GAPS — things a new viewer won't understand:
- What is happening? Not clear in first 3 seconds.
- Why should I keep watching? Curiosity gap absent or unearned.
- Who is this for? No signal about the creator's niche or audience.`;

  const systemPrompt = isOrganic ? systemPromptOrganic : systemPromptPaid;

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    temperature: 0,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analysis context:
File: ${fileName ?? "unknown"}
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
  if (!text.trim()) return apiError(res, 'ANALYSIS_FAILED', 500, "Empty response from Claude");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return apiError(res, 'ANALYSIS_FAILED', 500, "Could not extract JSON from Claude response");

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return apiError(res, 'ANALYSIS_FAILED', 500, "JSON.parse failed on Claude response");
  }
  const result = {
    scrollMoment: parsed.scrollMoment ?? null,
    flags: Array.isArray(parsed.flags)
      ? parsed.flags
          .map((f: Record<string, string>) => ({
            timestamp: String(f.timestamp ?? ""),
            category: (["scroll_trigger", "sound_off", "pacing", "clarity"].includes(f.category)
              ? f.category : "clarity") as string,
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
    whatItCommunicates: String(parsed.whatItCommunicates ?? ""),
    whatItFails: String(parsed.whatItFails ?? ""),
  };

  return res.status(200).json(result);
}
