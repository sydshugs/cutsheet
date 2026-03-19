// api/analyze.ts — Server-side proxy for Gemini visual analysis
// Keeps GEMINI_API_KEY server-side only, never exposed to the browser

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth, checkRateLimit, handlePreflight } from "./_lib/auth";

export const maxDuration = 120; // video analysis can take 30-60s

// Allow larger request bodies for video base64 (default 4.5MB is too small)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

const GEMINI_MODEL = "gemini-2.5-flash";
// Free: 5 analyses/day, Pro: 100/day
const RATE = { freeLimit: 5, proLimit: 100, windowSeconds: 86400 };

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface AnalyzeRequest {
  base64Data?: string;
  mimeType?: string;
  prompt: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const rl = await checkRateLimit("analyze", user.id, user.isPro, RATE);
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    const {
      base64Data,
      mimeType,
      prompt,
      systemInstruction,
      maxOutputTokens = 8192,
      temperature = 0.1,
      topP = 0.8,
      topK = 40,
    } = (req.body ?? {}) as AnalyzeRequest;

    // ── Validate inputs ───────────────────────────────────────────────────────
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    // If media is provided, validate it
    if (base64Data) {
      if (!mimeType) return res.status(400).json({ error: "mimeType is required when base64Data is provided" });
      // Videos can be up to 20MB (≈27MB base64), images up to 5MB
      const isVideo = mimeType.startsWith("video/");
      const maxB64Length = isVideo ? 27_000_000 : 6_700_000;
      if (base64Data.length > maxB64Length) {
        return res.status(413).json({ error: `Media exceeds maximum size (${isVideo ? "20MB" : "5MB"})` });
      }
    }

    // Cap prompt length to prevent abuse
    if (prompt.length > 50_000) {
      return res.status(413).json({ error: "prompt exceeds maximum length" });
    }

    // ── Call Gemini ───────────────────────────────────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      console.error("[analyze] GEMINI_API_KEY is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      ...(systemInstruction ? { systemInstruction } : {}),
      generationConfig: {
        maxOutputTokens: Math.min(maxOutputTokens, 16384),
        temperature: Math.min(Math.max(temperature, 0), 2),
        topP: Math.min(Math.max(topP, 0), 1),
        topK: Math.min(Math.max(topK, 1), 100),
      },
    });

    // Build content parts — media + text, or text-only
    const contentParts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
    if (base64Data && mimeType) {
      contentParts.push({ inlineData: { mimeType, data: base64Data } });
    }
    contentParts.push({ text: prompt });

    const result = await model.generateContent(contentParts);

    const text = result.response.text();

    if (!text || text.trim().length === 0) {
      return res.status(500).json({ error: "Gemini returned an empty response" });
    }

    return res.status(200).json({ text });
  } catch (err: unknown) {
    console.error("[analyze] Error:", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    const status = message.includes("429") || message.includes("rate") ? 429 : 500;
    return res.status(status).json({ error: message });
  }
}
