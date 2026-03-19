// api/policy-check.ts — Policy Check: scan ad creatives against Meta and TikTok ad policies

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
// 3 checks / day free (86400s window), unlimited pro
const RATE = { freeLimit: 3, proLimit: 9999, windowSeconds: 86400 };

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface PolicyCheckRequest {
  mediaUrl?: string;
  adCopy?: string;
  platform: "meta" | "tiktok" | "both";
  adType: "video" | "static" | "display";
  niche: string;
  existingAnalysis?: object;
}

export interface PolicyCategory {
  id: string;
  name: string;
  platform: "meta" | "tiktok";
  status: "clear" | "review" | "rejection";
  finding: string;
  fix: string;
  riskLevel: "low" | "medium" | "high";
}

export interface PolicyCheckResult {
  verdict: "good" | "fix" | "high_risk";
  verdictLabel: "Good to launch" | "Fix before launching" | "High rejection risk";
  metaCategories: PolicyCategory[];
  tiktokCategories: PolicyCategory[];
  topFixes: string[];
  reviewerNotes: string;
  platform: "meta" | "tiktok" | "both";
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("policy-check", user.id, user.isPro, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { mediaUrl, adCopy, platform, adType, niche, existingAnalysis } =
    (req.body ?? {}) as PolicyCheckRequest;

  if (!platform || !adType || !niche) {
    return res.status(400).json({ error: "platform, adType, and niche are required" });
  }

  // ── Step 1: Gemini visual scan (only if no existing analysis and media URL provided)
  let geminiFindings = "";

  if (!existingAnalysis && mediaUrl) {
    try {
      const geminiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
      if (geminiKey) {
        const genai = new GoogleGenerativeAI(geminiKey);
        const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

        const visualScanPrompt = `Analyze this ad creative for potential advertising policy violations. Look specifically for:
- Any text or visual claims that could be considered misleading
- Before/after imagery
- Text overlays making health, financial, or results-based claims
- Images of people in distress or exaggerated reactions
- Countdown timers or artificial urgency signals
- Any imagery that could be considered sensitive, adult, or violent
- Text that appears to circumvent automated review (misspellings, symbols replacing letters)
- Weight loss or body transformation visuals
- Financial gain claims or income promises
- Celebrity or testimonial imagery
- Weapons, drugs, or adult content indicators
- Logo or brand marks that could indicate trademarked content

Return findings as structured JSON:
{
  "hasBeforeAfter": boolean,
  "hasExaggeratedReactions": boolean,
  "hasArtificialUrgency": boolean,
  "hasSensitiveImagery": boolean,
  "hasCircumventionText": boolean,
  "hasHealthClaims": boolean,
  "hasFinancialClaims": boolean,
  "textHeavy": boolean,
  "textPercentageEstimate": string,
  "specificFlags": ["describe each visual concern concisely"],
  "overallRisk": "low" | "medium" | "high"
}`;

        // For URL-based media, use the fetch part approach
        const imageResp = await fetch(mediaUrl);
        if (imageResp.ok) {
          const imageBuffer = await imageResp.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString("base64");
          const contentType = imageResp.headers.get("content-type") || "image/jpeg";

          const geminiResult = await model.generateContent([
            { inlineData: { mimeType: contentType, data: base64 } },
            visualScanPrompt,
          ]);
          const raw = geminiResult.response.text();
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            geminiFindings = `\n\nGEMINI VISUAL SCAN FINDINGS:\n${jsonMatch[0]}`;
          }
        }
      }
    } catch {
      // Visual scan is best-effort — continue without it
      geminiFindings = "\n\n[Visual scan unavailable — analysis based on ad copy and metadata only]";
    }
  } else if (existingAnalysis) {
    geminiFindings = `\n\nEXISTING VISUAL ANALYSIS (from prior Gemini analysis):\n${JSON.stringify(existingAnalysis, null, 2)}`;
  }

  // ── Step 2: Claude policy evaluation
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const platformSection =
    platform === "both"
      ? "Evaluate against BOTH Meta and TikTok policies."
      : platform === "meta"
      ? "Evaluate against Meta advertising policies only."
      : "Evaluate against TikTok advertising policies only.";

  const adDetails = [
    `Platform(s): ${platform === "both" ? "Meta and TikTok" : platform.charAt(0).toUpperCase() + platform.slice(1)}`,
    `Ad type: ${adType}`,
    `Niche: ${niche}`,
    adCopy ? `\nAd copy / script:\n"${adCopy}"` : "",
    geminiFindings,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are an expert in Meta and TikTok advertising policies with 10 years of experience getting ads approved and appealing rejections. You know the exact language reviewers look for, the edge cases that trip up automated systems, and the appeal strategies that actually work.

Your job is to produce a thorough, actionable Policy Check Report. Be specific and direct. Reference actual policy language where relevant. Never be vague.`;

  const userPrompt = `Analyze the following ad creative and produce a Policy Check Report.

AD DETAILS:
${adDetails}

${platformSection}

${platform === "meta" || platform === "both" ? `
**META POLICY CATEGORIES TO EVALUATE:**
1. Prohibited content (weapons, drugs, adult content, discriminatory content)
2. Restricted content (alcohol, financial products, health/medical, weight loss, political)
3. Personal attributes (no direct addressing of personal characteristics — race, religion, health, financial status)
4. Misleading claims (before/after, guaranteed results, exaggerated claims, fake urgency)
5. Text in images (heavy text flag — over ~20% text area raises review probability)
6. Sensationalism (shocking imagery, exaggerated reactions, emotional manipulation)
7. Community Standards (harmful, deceptive, or offensive content)
8. Circumvention (symbols replacing letters, deliberate misspellings to avoid filters)
` : ""}

${platform === "tiktok" || platform === "both" ? `
**TIKTOK POLICY CATEGORIES TO EVALUATE:**
1. Prohibited industries (weapons, tobacco, adult content, gambling, illegal services)
2. Restricted categories (alcohol, finance, weight loss, supplements, healthcare)
3. Misleading advertising (false claims, fake reviews, fabricated results, misleading CTAs)
4. Intellectual property (trademarked logos, copyrighted audio/music, celebrity likeness)
5. Sensitive topics (political content, religious references, body image, social issues)
6. Community Guidelines (harmful challenges, dangerous acts, distressing content)
7. Ad format compliance (aspect ratio, duration limits, CTA button usage)
` : ""}

For each category, provide your assessment in this EXACT JSON format. Do not include any text outside the JSON.

{
  "verdict": "good" | "fix" | "high_risk",
  "verdictLabel": "Good to launch" | "Fix before launching" | "High rejection risk",
  "metaCategories": [
    {
      "id": "meta_prohibited",
      "name": "Prohibited Content",
      "platform": "meta",
      "status": "clear" | "review" | "rejection",
      "finding": "What was found (or 'No prohibited content detected' if clear)",
      "fix": "Exact actionable fix (or 'No action needed' if clear)",
      "riskLevel": "low" | "medium" | "high"
    }
  ],
  "tiktokCategories": [
    {
      "id": "tiktok_prohibited",
      "name": "Prohibited Industries",
      "platform": "tiktok",
      "status": "clear" | "review" | "rejection",
      "finding": "What was found",
      "fix": "Exact actionable fix",
      "riskLevel": "low" | "medium" | "high"
    }
  ],
  "topFixes": [
    "Fix 1 — most critical change to make right now",
    "Fix 2",
    "Fix 3"
  ],
  "reviewerNotes": "If this gets flagged for human review, here is exactly what to write in your appeal. Reference the specific policy section. Include what you changed and why the ad complies. Be factual and professional."
}

Return only the complete JSON. No preamble, no explanation outside the JSON.`;

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Failed to parse policy check response" });
    }

    const result = JSON.parse(jsonMatch[0]) as PolicyCheckResult;

    // Inject platform field into result
    result.platform = platform;

    // Normalize: remove platform categories that weren't requested
    if (platform === "meta") result.tiktokCategories = [];
    if (platform === "tiktok") result.metaCategories = [];

    return res.status(200).json(result);
  } catch (err) {
    console.error("[policy-check] Error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Policy check failed",
    });
  }
}
