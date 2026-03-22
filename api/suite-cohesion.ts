// api/suite-cohesion.ts — Claude: Display ad suite consistency analysis

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory } from "./_lib/sanitizeMemory";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const RATE = { freeLimit: 5, proLimit: 20, windowSeconds: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("suite-cohesion", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { banners, userContext: rawContext, sessionMemory: rawMemory, niche, platform } = req.body ?? {};
  const sessionMemory = sanitizeSessionMemory(rawMemory);
  const userContext = sanitizeSessionMemory(rawContext);
  if (!Array.isArray(banners) || banners.length < 2) {
    return res.status(400).json({ error: "At least 2 banners are required" });
  }

  const bannerList = banners
    .map(
      (b: { format: string; fileName: string; overallScore: number; improvements?: string[] }, i: number) =>
        `${i + 1}. ${b.format} — ${b.fileName} — Score: ${b.overallScore}/10\n   Issues: ${b.improvements?.slice(0, 3).join(", ") || "none"}`
    )
    .join("\n");

  const nicheLabel = niche || "general";
  const platformLabel = platform || "Google Display Network";

  // Niche-specific display ad design standards
  const nicheDesignStandards: Record<string, string> = {
    supplements: "Supplement display ads: product imagery must be prominent in all sizes. Health claims must be consistent (same disclaimer in every banner). Before/after imagery is banned on GDN. Color psychology: green/natural tones build trust. CTA must avoid 'cure' or 'treat' language.",
    ecommerce: "DTC/ecommerce display ads: product-on-lifestyle outperforms product-on-white at small sizes. Price/offer must be legible at 320x50. 'Shop Now' CTA outperforms 'Learn More' for commerce. Consistent sale/discount messaging across all sizes.",
    saas: "SaaS display ads: UI screenshots must be legible at smallest sizes or replaced with icon/illustration. Feature benefit headline, not feature name. 'Start Free Trial' CTA outperforms 'Sign Up'. Social proof (logo bar) should appear in 300x250 and 728x90.",
    finance: "Finance display ads: regulatory disclaimers must appear in every size. Trust signals (security badges, compliance logos) critical. Conservative color palette builds credibility. No income/return claims without disclaimers in ALL banners.",
    skincare: "Skincare display ads: product photography quality must be consistent across sizes. Ingredient callouts in larger formats. Before/after restricted on most ad networks. 'Dermatologist recommended' needs to appear wherever claimed.",
  };

  const nicheKey2 = nicheLabel.toLowerCase().replace(/[^a-z]/g, "");
  const nicheStandards = Object.entries(nicheDesignStandards).find(([k]) => nicheKey2.includes(k))?.[1] || "";

  const systemPrompt = `You are a display advertising creative director specializing in ${nicheLabel} campaigns on ${platformLabel}. You've reviewed thousands of ${nicheLabel} IAB banner suites and know that consistency across sizes is what separates professional campaigns from amateur ones. You evaluate against real ${nicheLabel} campaign standards — not just whether files exist, but whether they function as a cohesive ${nicheLabel} campaign that builds brand recognition across ${platformLabel} placements.`;

  const prompt = `You are reviewing a ${nicheLabel} banner ad suite for campaign consistency on ${platformLabel}.

${userContext || ""}
${sessionMemory ? `\n${sessionMemory}\nIf this user's prior ads share consistency issues with this suite, flag the pattern.\n` : ""}
A ${nicheLabel} display ad suite must be consistent across all sizes: same brand identity, same headline/offer, same CTA, same visual style.

${nicheStandards ? `\n${nicheLabel.toUpperCase()} DESIGN STANDARDS:\n${nicheStandards}\n` : ""}

BANNERS IN THIS SUITE:
${bannerList}

Analyze for:
1. Brand consistency — same logo/colors/fonts across sizes? Do they meet ${nicheLabel} category expectations?
2. Message consistency — same headline/offer across sizes? Is the ${nicheLabel} value prop clear in every format?
3. Visual consistency — do all sizes feel like the same ${nicheLabel} campaign?
4. CTA consistency — same call to action everywhere? Does it follow ${nicheLabel} CTA best practices?
5. Format coverage — key standard formats for ${platformLabel} missing?

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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: "Could not parse Claude response" });

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return res.status(500).json({ error: "Failed to parse AI response — please try again" });
  }
  return res.status(200).json({
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
  });
}
