// api/analyze.ts — Server-side proxy for Gemini visual analysis
// Keeps GEMINI_API_KEY server-side only, never exposed to the browser

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";
import { sanitizeSessionMemory, sanitizeUserInput } from "./_lib/sanitizeMemory";
import { safeNiche, safePlatform } from "./_lib/validateInput";
import { apiError } from "./_lib/apiError.js";
import { logApiUsage } from "./_lib/logUsage";
import { getNicheBenchmark, getNicheShortLabel } from "./_lib/benchmarks";

export const maxDuration = 120; // video analysis can take 30-60s

// Body is now just JSON metadata (file comes via Supabase Storage URL).
// Keep a modest limit for legacy base64 fallback on small files.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const GEMINI_MODEL = "gemini-2.5-flash";
// Free: 5 analyses/day, Pro: 100/day
const RATE = { freeLimit: 5, proLimit: 100, windowSeconds: 86400 };

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface AnalyzeRequest {
  base64Data?: string;
  fileUrl?: string;
  mimeType?: string;
  prompt: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  niche?: string;
  platform?: string;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const start = Date.now();

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const rl = await checkRateLimit("analyze", user.id, user.tier, RATE);
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    const {
      base64Data,
      fileUrl,
      mimeType,
      prompt,
      systemInstruction,
      maxOutputTokens = 8192,
      temperature = 0,
      topP = 0.8,
      topK = 40,
      niche,
      platform,
    } = (req.body ?? {}) as AnalyzeRequest;

    // ── Validate inputs ───────────────────────────────────────────────────────
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    // Validate MIME type if provided
    const ALLOWED_MIME_TYPES = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo",
    ];
    if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    // Cap prompt length to prevent abuse
    if (prompt.length > 50_000) {
      return res.status(413).json({ error: "prompt exceeds maximum length" });
    }

    // ── Resolve media: fileUrl (preferred) or legacy base64Data ────────────
    let resolvedBase64: string | undefined = base64Data;
    let resolvedMime: string | undefined = mimeType;

    if (fileUrl) {
      // SSRF protection: only allow Supabase Storage URLs
      const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
      if (!supabaseUrl || !fileUrl.startsWith(supabaseUrl)) {
        return res.status(400).json({ error: "fileUrl must be a Supabase Storage signed URL" });
      }

      if (!mimeType) return res.status(400).json({ error: "mimeType is required when fileUrl is provided" });

      // Fetch file from Supabase Storage
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        return res.status(400).json({ error: `Failed to fetch file from storage: ${fileResponse.status}` });
      }
      const buffer = Buffer.from(await fileResponse.arrayBuffer());
      resolvedBase64 = buffer.toString("base64");
      resolvedMime = mimeType;
    } else if (base64Data) {
      // Legacy path: base64 in body (still works for small files)
      if (!mimeType) return res.status(400).json({ error: "mimeType is required when base64Data is provided" });
      const isVideo = mimeType.startsWith("video/");
      const maxB64Length = isVideo ? 27_000_000 : 6_700_000;
      if (base64Data.length > maxB64Length) {
        return res.status(413).json({ error: `Media exceeds maximum size (${isVideo ? "20MB" : "5MB"})` });
      }
    }

    // ── Call Gemini ───────────────────────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error("[analyze] GEMINI_API_KEY is not set");
      return apiError(res, 'INTERNAL_ERROR', 500, "GEMINI_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      ...(systemInstruction ? { systemInstruction: sanitizeSessionMemory(systemInstruction) } : {}),
      generationConfig: {
        maxOutputTokens: Math.min(maxOutputTokens, 16384),
        temperature: Math.min(Math.max(temperature, 0), 2),
        topP: Math.min(Math.max(topP, 0), 1),
        topK: Math.min(Math.max(topK, 1), 100),
      },
    });

    // Build niche context block when niche is known from onboarding
    let nicheContext = "";
    if (niche) {
      const safeNicheVal = safeNiche(niche);
      const safePlatformVal = platform ? safePlatform(platform) : undefined;
      const nicheBench = getNicheBenchmark(safeNicheVal, safePlatformVal);
      const nicheLabel = getNicheShortLabel(safeNicheVal) ?? safeNicheVal;
      if (nicheBench) {
        nicheContext = `\n\nNICHE CONTEXT: This ad is in the ${nicheLabel} niche${platform ? ` on ${platform}` : ""}. Industry benchmarks — CTR: ${nicheBench.ctr.low}–${nicheBench.ctr.high}% (avg ${nicheBench.ctr.avg}%)${nicheBench.hookRate ? `, Hook retention: ${nicheBench.hookRate.avg}%` : ""}, CPM: $${nicheBench.cpm.avg}. Score relative to these benchmarks.\n`;
      }
    }

    // Build content parts — media + text, or text-only
    const contentParts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
    if (resolvedBase64 && resolvedMime) {
      contentParts.push({ inlineData: { mimeType: resolvedMime, data: resolvedBase64 } });
    }
    contentParts.push({ text: nicheContext + prompt });

    const result = await model.generateContent(contentParts);

    const text = result.response.text();

    if (!text || text.trim().length === 0) {
      return apiError(res, 'ANALYSIS_FAILED', 500, "Gemini returned an empty response");
    }

    logApiUsage({ userId: user.id, endpoint: "analyze", statusCode: 200, responseTimeMs: Date.now() - start, platform, niche });
    return res.status(200).json({ text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimited = /429|RATE_LIMITED|resource exhausted|quota/i.test(msg);
    const code = isRateLimited ? 429 : 500;
    logApiUsage({ userId: "unknown", endpoint: "analyze", statusCode: code, responseTimeMs: Date.now() - start, errorCode: isRateLimited ? "RATE_LIMITED" : "ANALYSIS_FAILED" });
    if (isRateLimited) {
      return apiError(res, 'RATE_LIMITED', 429, `[analyze] ${msg}`);
    }
    return apiError(res, 'ANALYSIS_FAILED', 500, `[analyze] ${msg}`);
  }
}
