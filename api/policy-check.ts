// api/policy-check.ts — Policy Check: scan ad creatives against Meta and TikTok ad policies

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { validateFetchUrl } from "./_lib/validateUrl";
import { safePlatform, safeAdType, safeNiche, validateBase64Size } from "./_lib/validateInput";

export const maxDuration = 60;

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
// 3 checks / day free (86400s window), unlimited pro
const RATE = { freeLimit: 3, proLimit: 9999, windowSeconds: 86400 };

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface PolicyCheckRequest {
  mediaUrl?: string;
  mediaDataUrl?: string;
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

  try {

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rl = await checkRateLimit("policy-check", user.id, user.tier, RATE);
  if (!rl.allowed) {
    return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
  }

  const { mediaUrl, mediaDataUrl, adCopy, platform: rawPlatform, adType: rawAdType, niche: rawNiche, existingAnalysis } =
    (req.body ?? {}) as PolicyCheckRequest;

  if (!rawPlatform || !rawAdType || !rawNiche) {
    return res.status(400).json({ error: "platform, adType, and niche are required" });
  }

  // Sanitize prompt-interpolated fields
  const platform = safePlatform(rawPlatform) as "meta" | "tiktok" | "both";
  const adType = safeAdType(rawAdType);
  const niche = safeNiche(rawNiche);

  // Validate base64 size if client sent a data URL
  if (mediaDataUrl) {
    const b64Err = validateBase64Size(mediaDataUrl, "mediaDataUrl");
    if (b64Err) return res.status(413).json({ error: b64Err });
  }

  // ── Step 1: Gemini visual scan (only if no existing analysis and media provided)
  let geminiFindings = "";

  // Resolve image data: either from data URL (client upload) or remote URL
  const hasMedia = !existingAnalysis && (mediaDataUrl || mediaUrl);

  if (hasMedia) {
    try {
      const geminiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
      if (geminiKey) {
        const genai = new GoogleGenerativeAI(geminiKey);
        const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

        const nicheRiskContext: Record<string, string> = {
          supplements: "HIGH-RISK NICHE: Supplements. Pay extra attention to: health claims, before/after imagery, efficacy promises, FDA disclaimer absence, ingredient claims, 'doctor recommended' without proof.",
          health: "HIGH-RISK NICHE: Health/Medical. Pay extra attention to: medical claims, diagnosis suggestions, treatment promises, before/after imagery, professional endorsements without disclaimers.",
          finance: "HIGH-RISK NICHE: Finance. Pay extra attention to: income claims, earnings screenshots, guaranteed returns, financial advice without disclaimers, wealth lifestyle imagery.",
          weightloss: "HIGH-RISK NICHE: Weight Loss. Pay extra attention to: before/after body imagery, specific weight loss claims, timeframe promises, body shaming, unrealistic results.",
          skincare: "MODERATE-RISK NICHE: Skincare/Beauty. Watch for: before/after skin imagery, anti-aging claims, dermatologist endorsements, 'clinically proven' without citation.",
          alcohol: "RESTRICTED NICHE: Alcohol. Watch for: age-gating absence, excessive consumption imagery, health benefit claims, appeal to minors.",
        };

        const nicheKey = niche.toLowerCase().replace(/[^a-z]/g, "");
        const nicheWarning = Object.entries(nicheRiskContext).find(([k]) => nicheKey.includes(k))?.[1] || "";

        const visualScanPrompt = `You are a ${platform === "meta" || platform === "both" ? "Meta" : "TikTok"} ad policy reviewer scanning a ${adType} ad in the ${niche} niche for potential violations.

${nicheWarning}

PLATFORM: ${platform === "both" ? "Meta AND TikTok" : platform === "meta" ? "Meta" : "TikTok"}
AD TYPE: ${adType}
NICHE: ${niche}

Scan this ad creative for:
- Any text or visual claims that could be considered misleading for ${niche} specifically
- Before/after imagery (especially critical in ${niche})
- Text overlays making health, financial, or results-based claims
- Images of people in distress or exaggerated reactions
- Countdown timers or artificial urgency signals
- Any imagery that could be considered sensitive, adult, or violent
- Text that appears to circumvent automated review (misspellings, symbols replacing letters)
- Weight loss or body transformation visuals
- Financial gain claims or income promises
- Celebrity or testimonial imagery without proper disclosure
- Weapons, drugs, or adult content indicators
- Logo or brand marks that could indicate trademarked content
- ${platform === "meta" || platform === "both" ? "Meta's ~20% text-in-image threshold" : ""}
- ${platform === "tiktok" || platform === "both" ? "TikTok's restricted category triggers for " + niche : ""}

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
  "specificFlags": ["describe each visual concern concisely, referencing ${niche}-specific risks"],
  "overallRisk": "low" | "medium" | "high",
  "nicheSpecificRisks": ["${niche}-specific policy concerns found"]
}`;

        let base64: string;
        let contentType: string;

        if (mediaDataUrl) {
          // Client sent base64 data URL: "data:image/png;base64,iVBOR..."
          const match = mediaDataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) throw new Error("Invalid data URL format");
          contentType = match[1];
          base64 = match[2];
        } else {
          // Fetch from remote URL — validate against SSRF
          const urlErr = validateFetchUrl(mediaUrl!);
          if (urlErr) throw new Error(urlErr);
          const imageResp = await fetch(mediaUrl!);
          if (!imageResp.ok) throw new Error(`Failed to fetch media: ${imageResp.status}`);
          const imageBuffer = await imageResp.arrayBuffer();
          base64 = Buffer.from(imageBuffer).toString("base64");
          contentType = imageResp.headers.get("content-type") || "image/jpeg";
        }

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
    } catch (geminiErr) {
      // Visual scan is best-effort — continue without it
      console.error("[policy-check] Gemini visual scan failed:", geminiErr);
      geminiFindings = "\n\n[Visual scan unavailable — analysis based on ad copy and metadata only]";
    }
  } else if (existingAnalysis) {
    geminiFindings = `\n\nEXISTING VISUAL ANALYSIS (from prior Gemini analysis):\n${JSON.stringify(existingAnalysis, null, 2)}`;
  }

  // ── Step 2: Claude policy evaluation
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[policy-check] ANTHROPIC_API_KEY is not set");
    return res.status(500).json({ error: "Server configuration error — please contact support." });
  }
  const client = new Anthropic({ apiKey });

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

  // Build niche-specific policy escalation
  const highRiskNiches: Record<string, string> = {
    supplements: "ELEVATED SCRUTINY — Supplements. Meta rejects: efficacy claims ('clinically proven', 'doctor recommended'), before/after body imagery, FDA-unapproved health claims, implied cures. TikTok rejects: health outcome promises, 'miracle' language, unverified ingredient claims. Flag ALL health-adjacent copy aggressively.",
    health: "ELEVATED SCRUTINY — Health/Medical. Meta rejects: diagnosis language, treatment promises, personal health attributes ('struggling with...'), before/after imagery. TikTok rejects: medical advice, unqualified health claims, distressing imagery. Any claim requires visible disclaimer.",
    finance: "ELEVATED SCRUTINY — Finance. Meta rejects: income guarantees, earnings screenshots without disclaimers, 'get rich' language, misleading ROI claims. TikTok rejects: financial advice without qualification, guaranteed returns, wealth lifestyle as proof. Requires financial disclaimers.",
    weightloss: "ELEVATED SCRUTINY — Weight Loss. Meta rejects: before/after body photos, specific weight claims ('lose 10 lbs'), timeframe promises, body shaming. TikTok rejects: body-negative content, unrealistic transformation timelines, diet pill promotion.",
    skincare: "MODERATE SCRUTINY — Skincare. Watch for: before/after skin close-ups (Meta restricts), 'anti-aging' claims without citation, 'dermatologist recommended' without proof, 'clinically tested' without study reference.",
    alcohol: "RESTRICTED — Alcohol. Both platforms require: age-gating, no appeal to minors, no excessive consumption, no health benefit claims. Meta requires age-restricted targeting. TikTok prohibits alcohol ads in many regions.",
    gambling: "RESTRICTED — Gambling. Both platforms require: licensing proof, responsible gambling messaging, age-gating. Meta requires pre-approval. TikTok prohibits in most regions.",
  };

  const nicheKey = niche.toLowerCase().replace(/[^a-z]/g, "");
  const nicheEscalation = Object.entries(highRiskNiches).find(([k]) => nicheKey.includes(k))?.[1] || "";

  const systemPrompt = `You are a ${platform === "both" ? "Meta and TikTok" : platform === "meta" ? "Meta" : "TikTok"} ad policy compliance specialist reviewing a ${adType} ad in the ${niche} niche.

You know the exact policy language reviewers use, the automated triggers that cause instant rejection, and the edge cases that trip up ${niche} advertisers specifically on ${platform === "both" ? "both Meta and TikTok" : platform === "meta" ? "Meta" : "TikTok"}.

${nicheEscalation}

Your job: produce a thorough, actionable Policy Check Report. Every finding must reference the specific policy section and explain WHY this ${niche} ad on ${platform === "both" ? "Meta/TikTok" : platform} triggers it. Never be vague — say exactly what to change and how.`;

  const metaNicheForbidden: Record<string, string> = {
    supplements: "Meta ${niche} specifics: No 'clinically proven' without linked study. No before/after body imagery. No 'FDA approved' (supplements aren't). No personal health attributes ('if you struggle with...'). Disclaimer required for all health claims.",
    health: "Meta ${niche} specifics: No diagnosis language ('do you have...'). No treatment guarantees. No before/after medical imagery. No personal health attributes. Professional disclaimers required.",
    finance: "Meta ${niche} specifics: No income guarantees or earnings screenshots without disclaimers. No 'get rich' or implied guaranteed returns. Financial disclaimers required. No misleading pricing or billing terms.",
    weightloss: "Meta ${niche} specifics: No before/after body photos. No specific weight/size claims. No timeframe promises ('lose X in Y days'). No body shaming language. No diet pill promotion without disclaimers.",
    skincare: "Meta ${niche} specifics: Before/after close-ups trigger review. 'Anti-aging' requires substantiation. 'Dermatologist recommended' needs proof. 'Clinically tested' needs study citation.",
  };

  const tiktokNicheForbidden: Record<string, string> = {
    supplements: "TikTok ${niche} specifics: No health outcome promises. No 'miracle' or 'cure' language. No unverified ingredient efficacy claims. Must not look like medical advice. Creator-style content with health claims still gets flagged.",
    health: "TikTok ${niche} specifics: No medical advice without qualification. No unqualified health claims. No distressing medical imagery. Health disclaimers required even in UGC-style content.",
    finance: "TikTok ${niche} specifics: No financial advice without regulatory qualification. No guaranteed returns. No wealth-lifestyle-as-proof content. No misleading income claims even in 'story' format.",
    weightloss: "TikTok ${niche} specifics: No body-negative content. No unrealistic transformation timelines. No diet pill promotion. No body shaming even as 'motivation'.",
    skincare: "TikTok ${niche} specifics: Transformation videos trigger review if claims are unsubstantiated. 'Works overnight' is misleading. Creator testimonials need 'results may vary' language.",
  };

  const metaNicheRules = Object.entries(metaNicheForbidden).find(([k]) => nicheKey.includes(k))?.[1] || "";
  const tiktokNicheRules = Object.entries(tiktokNicheForbidden).find(([k]) => nicheKey.includes(k))?.[1] || "";

  const userPrompt = `Analyze the following ${adType} ad creative in the ${niche} niche and produce a Policy Check Report.

AD DETAILS:
${adDetails}

${platformSection}

${platform === "meta" || platform === "both" ? `
**META POLICY CATEGORIES TO EVALUATE (for this ${niche} ${adType} ad):**
1. Prohibited content (weapons, drugs, adult content, discriminatory content)
2. Restricted content (alcohol, financial products, health/medical, weight loss, political) — ${niche} ads face extra scrutiny here
3. Personal attributes (no direct addressing of personal characteristics — race, religion, health, financial status) — common rejection trigger for ${niche} ads
4. Misleading claims (before/after, guaranteed results, exaggerated claims, fake urgency)
5. Text in images (heavy text flag — over ~20% text area raises review probability)
6. Sensationalism (shocking imagery, exaggerated reactions, emotional manipulation)
7. Community Standards (harmful, deceptive, or offensive content)
8. Circumvention (symbols replacing letters, deliberate misspellings to avoid filters)
${metaNicheRules}
` : ""}

${platform === "tiktok" || platform === "both" ? `
**TIKTOK POLICY CATEGORIES TO EVALUATE (for this ${niche} ${adType} ad):**
1. Prohibited industries (weapons, tobacco, adult content, gambling, illegal services)
2. Restricted categories (alcohol, finance, weight loss, supplements, healthcare) — ${niche} is in or adjacent to a restricted category
3. Misleading advertising (false claims, fake reviews, fabricated results, misleading CTAs)
4. Intellectual property (trademarked logos, copyrighted audio/music, celebrity likeness)
5. Sensitive topics (political content, religious references, body image, social issues)
6. Community Guidelines (harmful challenges, dangerous acts, distressing content)
7. Ad format compliance (aspect ratio, duration limits, CTA button usage)
${tiktokNicheRules}
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

  } catch (err: unknown) {
    console.error('[policy-check] Unhandled error:', err instanceof Error ? err.message : err, err instanceof Error ? err.stack : '');
    return res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
