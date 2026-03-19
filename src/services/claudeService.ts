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
  scores: { hook: number; clarity: number; cta: number; production: number; overall: number } | null,
  userContext?: string,
  platform?: string
): Promise<string[]> {
  if (!scores) return [];

  const weakAreas = Object.entries(scores)
    .filter(([key, val]) => key !== "overall" && val <= 6)
    .map(([key, val]) => `${key}: ${val}/10`)
    .join(", ");

  const contextBlock = userContext ? `\n\n${userContext}\n\nUse the user context to inform the specificity, tone, and priorities of each improvement. Do NOT mention the user's role, niche, or platform explicitly in the improvement text. The improvements should feel naturally tailored — not like they're addressing the user directly. Do NOT give generic advice.` : "";
  const platformBlock = platform && platform !== "all" ? `\nOptimize all suggestions specifically for ${platform}. Consider ${platform}-specific best practices, audience behavior, and format requirements.` : "";

  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `You are a senior performance marketing creative strategist. You write short, specific, actionable improvement suggestions for ads. Each suggestion should be 1-2 sentences max. Focus on the weakest scoring areas. No fluff, no preamble.${contextBlock}${platformBlock}`,
    messages: [
      {
        role: "user",
        content: `Here is a video ad analysis:\n\n${analysisMarkdown}\n\nWeakest areas: ${weakAreas || "none particularly weak"}${platform && platform !== "all" ? `\nTarget platform: ${platform}` : ""}\n\nWrite exactly 4-6 bullet-point improvements. Return ONLY the bullet points, one per line, starting with "- ". No headers, no numbering, no extra text.`,
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
  filename: string,
  userContext?: string
): Promise<string> {
  const contextBlock = userContext ? `\n\n${userContext}\n\nStructure this brief specifically for the user's niche and platform. Use relevant industry terminology and platform best practices.` : "";

  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are a senior creative strategist at a top performance marketing agency. You write tight, actionable creative briefs that creative teams can execute immediately. Your briefs are specific to the ad analyzed — not generic templates.${contextBlock}`,
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
  productContext: string,
  userContext?: string
): Promise<string[]> {
  const contextBlock = userContext ? `\n\n${userContext}\n\nOptimize CTAs specifically for the user's platform and niche. Match the tone and conversion patterns that work for their specific context.` : "";

  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    system: `You are a direct-response copywriter. You write short, punchy CTAs for paid social ads. Each CTA should be under 8 words. Focus on urgency, clarity, and conversion.${contextBlock}`,
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
  improvements?: string[],
  userContext?: string
): Promise<SecondEyeResult> {
  const client = getClient();

  const overallScore = scores?.overall ?? "N/A";
  const hookScore = scores?.hook ?? "N/A";
  const improvementsList = improvements?.length
    ? improvements.join("; ")
    : "none provided";

  const contextBlock = userContext ? `\n\nAdditional context about who made this ad:\n${userContext}\nApply fresh-viewer expectations specific to how people actually scroll this platform. Your timestamped flags should reference what this niche's target customer would do at each moment.` : "";

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are watching this video ad for the very first time.
You are a slightly bored person scrolling through your feed on your phone.
You have never seen this brand before. You have no loyalty to it.
You will give this video about 2 seconds before deciding to scroll past.
The creator has been staring at this video for days and is blind to its problems.
Your job is to catch everything they can't see anymore.${contextBlock}

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

// ─── PLATFORM SCORING ────────────────────────────────────────────────────────

export interface PlatformScore {
  platform: 'tiktok' | 'reels' | 'shorts'
  score: number
  verdict: string
  improvements: string[]
  signals: { label: string; pass: boolean }[]
}

const PLATFORM_PROMPTS: Record<'tiktok' | 'reels' | 'shorts', string> = {
  tiktok: `You are a TikTok performance expert scoring a video ad for FYP performance.
Platform context:
- Hook window: 0-1.5 seconds. If hook is slower, FYP score drops hard.
- Completion rate is the #1 algorithm signal. Anything that causes drop-off kills reach.
- Native/raw aesthetic outperforms polished production on TikTok.
- Trending sound compatibility matters for discovery.
- CTAs that drive comments ('comment if this is you') beat click CTAs for organic reach.
- Text overlays are mandatory for sound-off viewers (85% of feed).
Analysis data: SUMMARY_PLACEHOLDER
Score this video 1-10 for TikTok FYP performance specifically.
Return JSON only:
{
  "score": number,
  "verdict": "string (one sentence, honest, specific)",
  "improvements": ["string", "string", "string"],
  "signals": [
    { "label": "Hook by 1.5s", "pass": boolean },
    { "label": "Text overlay present", "pass": boolean },
    { "label": "Native feel", "pass": boolean },
    { "label": "Comment-driving CTA", "pass": boolean }
  ]
}`,
  reels: `You are an Instagram Reels performance expert scoring a video for Reels reach.
Platform context:
- Hook window: 0-2 seconds.
- Shares and saves are the top Reels signals — not likes.
- Reels shared to Stories get a major reach multiplier.
- High-contrast text overlays on lower third perform best.
- 'Save this' and 'Share with someone who needs this' CTAs outperform all others.
- 15-30 second length is the Reels sweet spot for completion.
- Trending audio boosts discovery but less than TikTok.
Analysis data: SUMMARY_PLACEHOLDER
Score this video 1-10 for Instagram Reels performance specifically.
Return JSON only:
{
  "score": number,
  "verdict": "string (one sentence, honest, specific)",
  "improvements": ["string", "string", "string"],
  "signals": [
    { "label": "Hook by 2s", "pass": boolean },
    { "label": "Save/share CTA", "pass": boolean },
    { "label": "Text overlay contrast", "pass": boolean },
    { "label": "Optimal length (15-30s)", "pass": boolean }
  ]
}`,
  shorts: `You are a YouTube Shorts performance expert scoring a video for Shorts reach.
Platform context:
- Hook window: 0-3 seconds. Most forgiving of the three platforms.
- Viewers have higher intent — more willing to click through.
- Verbal subscribe CTA at the end significantly boosts channel growth.
- SEO matters — title and description keywords drive search discovery.
- Retention curve is visible in YouTube analytics — front-load value.
- End on a strong final frame — Shorts loops, so the last frame matters.
- Thumbnail shown on some surfaces — strong final frame doubles as thumbnail.
Analysis data: SUMMARY_PLACEHOLDER
Score this video 1-10 for YouTube Shorts performance specifically.
Return JSON only:
{
  "score": number,
  "verdict": "string (one sentence, honest, specific)",
  "improvements": ["string", "string", "string"],
  "signals": [
    { "label": "Hook by 3s", "pass": boolean },
    { "label": "Subscribe CTA", "pass": boolean },
    { "label": "Strong final frame", "pass": boolean },
    { "label": "SEO-friendly concept", "pass": boolean }
  ]
}`,
}

export const generatePlatformScore = async (
  platform: 'tiktok' | 'reels' | 'shorts',
  analysisResult: { scores: { overall: number; hook: number; cta: number }; improvements: string[] },
  fileName: string
): Promise<PlatformScore> => {
  const client = getClient()

  const summary = `File: ${fileName}
Overall score: ${analysisResult.scores.overall}/10
Hook score: ${analysisResult.scores.hook}/10
CTA score: ${analysisResult.scores.cta}/10
Key improvements: ${analysisResult.improvements.slice(0, 3).join(', ')}`

  const prompt = PLATFORM_PROMPTS[platform].replace('SUMMARY_PLACEHOLDER', summary)

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: 'You are a platform optimization expert. Return only valid JSON matching the exact schema requested. No markdown, no explanation.',
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(cleaned)

  return {
    platform,
    score: Number(parsed.score),
    verdict: String(parsed.verdict),
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3).map(String) : [],
    signals: Array.isArray(parsed.signals)
      ? parsed.signals.map((s: { label: unknown; pass: unknown }) => ({ label: String(s.label), pass: Boolean(s.pass) }))
      : [],
  };
}

// ─── STATIC SECOND EYE (Design Review) ──────────────────────────────────────

export interface StaticSecondEyeFlag {
  area: "typography" | "layout" | "hierarchy" | "contrast";
  severity: "critical" | "warning" | "note";
  issue: string;
  fix: string;
}

export interface StaticSecondEyeResult {
  topIssue: string;
  flags: StaticSecondEyeFlag[];
  overallDesignVerdict: string;
}

export async function generateStaticSecondEye(
  analysisMarkdown: string,
  fileName: string,
  scores?: { overall: number; cta: number },
  improvements?: string[],
  userContext?: string
): Promise<StaticSecondEyeResult> {
  const client = getClient();

  const overallScore = scores?.overall ?? "N/A";
  const ctaScore = scores?.cta ?? "N/A";
  const improvementsList = improvements?.length
    ? improvements.join(", ")
    : "none provided";

  const contextBlock = userContext ? `\n\n${userContext}\nReview this design with the user's niche and platform context in mind. Design standards vary by industry — apply the right expectations.` : "";

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `You are a professional graphic designer and art director reviewing this static ad for the first time with fresh eyes.
The creator has been staring at it for hours and is blind to the small things that make it look unpolished.
Your job: find every design and typography issue.
Be specific. Be technical. Be ruthless.
Think like someone who notices bad kerning immediately.${contextBlock}

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
File: ${fileName}
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
      "fix": "<specific, actionable, one sentence>"
    }
  ],
  "overallDesignVerdict": "<one honest sentence about the overall design quality>"
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  if (!text.trim()) throw new Error("Claude returned empty Static Second Eye review");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Static Second Eye: could not parse JSON from response");

  try {
    const parsed = JSON.parse(jsonMatch[0]) as StaticSecondEyeResult;

    return {
      topIssue: String(parsed.topIssue ?? ""),
      flags: Array.isArray(parsed.flags)
        ? parsed.flags
            .map((f) => ({
              area: (["typography", "layout", "hierarchy", "contrast"].includes(f.area)
                ? f.area
                : "layout") as StaticSecondEyeFlag["area"],
              severity: (["critical", "warning", "note"].includes(f.severity)
                ? f.severity
                : "note") as StaticSecondEyeFlag["severity"],
              issue: String(f.issue ?? ""),
              fix: String(f.fix ?? ""),
            }))
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, note: 2 };
              return order[a.severity] - order[b.severity];
            })
        : [],
      overallDesignVerdict: String(parsed.overallDesignVerdict ?? ""),
    };
  } catch (e) {
    throw new Error(`Static Second Eye: invalid JSON — ${(e as Error).message}`);
  }
}

// ─── DISPLAY AD SUITE COHESION ──────────────────────────────────────────────

export interface SuiteIssue {
  severity: "critical" | "warning" | "note";
  issue: string;
  affectedFormats: string[];
  fix: string;
}

export interface SuiteCohesionResult {
  suiteScore: number;
  brandConsistency: number;
  messageConsistency: number;
  visualConsistency: number;
  ctaConsistency: number;
  verdict: string;
  strongestBanner: string;
  weakestBanner: string;
  strengths: string[];
  issues: SuiteIssue[];
  recommendations: string[];
  missingFormats: string[];
}

export async function analyzeSuiteCohesion(
  banners: Array<{ format: string; fileName: string; overallScore: number; improvements?: string[] }>,
  userContext?: string
): Promise<SuiteCohesionResult> {
  const client = getClient();

  const bannerList = banners
    .map(
      (b, i) =>
        `${i + 1}. ${b.format} — ${b.fileName} — Score: ${b.overallScore}/10\n   Issues: ${b.improvements?.slice(0, 3).join(", ") || "none"}`
    )
    .join("\n");

  const prompt = `You are a display advertising expert reviewing a full banner ad suite for campaign consistency.

${userContext || ""}

A display ad suite must be consistent across all sizes: same brand identity, same headline/offer, same CTA, same visual style.

BANNERS IN THIS SUITE:
${bannerList}

Analyze for:
1. Brand consistency — same logo/colors/fonts across sizes?
2. Message consistency — same headline/offer across sizes?
3. Visual consistency — do all sizes feel like the same campaign?
4. CTA consistency — same call to action everywhere?
5. Format coverage — key standard formats missing?

Standard IAB suite: 728x90, 300x250, 160x600, 320x50. Missing formats should be flagged.

IMPORTANT: Do not mention the user's role, niche, or platform explicitly.

Return JSON only — no prose:
{
  "suiteScore": <1-10>,
  "brandConsistency": <1-10>,
  "messageConsistency": <1-10>,
  "visualConsistency": <1-10>,
  "ctaConsistency": <1-10>,
  "verdict": "<one honest sentence about the suite overall>",
  "strongestBanner": "<format name of best performer, e.g. '300x250 Medium Rectangle'>",
  "weakestBanner": "<format name of worst performer>",
  "strengths": ["<2-3 things the suite does well>"],
  "issues": [
    { "severity": "critical" | "warning" | "note", "issue": "<specific, name formats>", "affectedFormats": ["<format>"], "fix": "<specific, actionable>" }
  ],
  "recommendations": ["<3 prioritized actions>"],
  "missingFormats": ["<standard formats not present>"]
}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Suite cohesion: invalid response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    suiteScore: Number(parsed.suiteScore) || 5,
    brandConsistency: Number(parsed.brandConsistency) || 5,
    messageConsistency: Number(parsed.messageConsistency) || 5,
    visualConsistency: Number(parsed.visualConsistency) || 5,
    ctaConsistency: Number(parsed.ctaConsistency) || 5,
    verdict: String(parsed.verdict ?? ""),
    strongestBanner: String(parsed.strongestBanner ?? ""),
    weakestBanner: String(parsed.weakestBanner ?? ""),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    missingFormats: Array.isArray(parsed.missingFormats) ? parsed.missingFormats : [],
  };
}

// ─── BEFORE/AFTER COMPARISON ────────────────────────────────────────────────

export interface AddressedImprovement {
  improvement: string;
  addressed: boolean;
  confidence: "high" | "medium" | "low";
  note: string;
}

export interface ComparisonResult {
  scoreChange: number;
  metricChanges: { hook: number; cta: number; clarity: number; production: number };
  improvementsAddressed: AddressedImprovement[];
  verdict: "significantly_better" | "better" | "same" | "worse";
  verdictText: string;
  topWin: string;
  remainingWork: string[];
}

export async function generateComparison(
  originalScores: { overall: number; hook: number; cta: number; clarity: number; production: number },
  improvedScores: { overall: number; hook: number; cta: number; clarity: number; production: number },
  originalImprovements: string[],
  userContext?: string
): Promise<ComparisonResult> {
  const client = getClient();

  const prompt = `You are comparing two versions of the same ad creative.
The creator received feedback and made improvements.

${userContext || ""}

ORIGINAL VERSION SCORES:
Overall: ${originalScores.overall}/10
Hook: ${originalScores.hook}/10
CTA: ${originalScores.cta}/10
Clarity: ${originalScores.clarity}/10
Production: ${originalScores.production}/10

IMPROVED VERSION SCORES:
Overall: ${improvedScores.overall}/10
Hook: ${improvedScores.hook}/10
CTA: ${improvedScores.cta}/10
Clarity: ${improvedScores.clarity}/10
Production: ${improvedScores.production}/10

IMPROVEMENTS THAT WERE SUGGESTED:
${originalImprovements.map((imp, i) => `${i + 1}. ${imp}`).join("\n")}

Based on the score changes, assess which improvements were addressed.
Be honest. If scores dropped, say so.

Return JSON only:
{
  "scoreChange": ${improvedScores.overall - originalScores.overall},
  "metricChanges": { "hook": ${improvedScores.hook - originalScores.hook}, "cta": ${improvedScores.cta - originalScores.cta}, "clarity": ${improvedScores.clarity - originalScores.clarity}, "production": ${improvedScores.production - originalScores.production} },
  "verdict": "significantly_better" | "better" | "same" | "worse",
  "verdictText": "<one honest sentence>",
  "topWin": "<single biggest improvement>",
  "improvementsAddressed": [
    { "improvement": "<original text>", "addressed": true|false, "confidence": "high"|"medium"|"low", "note": "<what changed>" }
  ],
  "remainingWork": ["<what still needs fixing>"]
}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Comparison: invalid response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    scoreChange: Number(parsed.scoreChange) || 0,
    metricChanges: {
      hook: Number(parsed.metricChanges?.hook) || 0,
      cta: Number(parsed.metricChanges?.cta) || 0,
      clarity: Number(parsed.metricChanges?.clarity) || 0,
      production: Number(parsed.metricChanges?.production) || 0,
    },
    verdict: (["significantly_better", "better", "same", "worse"].includes(parsed.verdict) ? parsed.verdict : "same") as ComparisonResult["verdict"],
    verdictText: String(parsed.verdictText || ""),
    topWin: String(parsed.topWin || ""),
    improvementsAddressed: Array.isArray(parsed.improvementsAddressed) ? parsed.improvementsAddressed : [],
    remainingWork: Array.isArray(parsed.remainingWork) ? parsed.remainingWork : [],
  };
}
