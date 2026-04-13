// api/animate-html5-smart.ts — AI-powered multi-element HTML5 animation
// Uses Gemini Vision to detect banner elements, then generates staggered CSS animations.
//
// CREDIT FLOW: same as animate-html5.ts (1 credit per generation)
// Falls back to entrance animation if Gemini can't parse element regions.

export const maxDuration = 30;

import type { VercelRequest, VercelResponse } from "@vercel/node";
import JSZip from "jszip";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuth, handlePreflight, isProOrTeam, checkRateLimit } from "./_lib/auth";
import { checkFeatureCredit, refundCredit } from "./_lib/creditCheck";
import { apiError } from "./_lib/apiError.js";
import { logApiUsage } from "./_lib/logUsage";

const RATE = { freeLimit: 0, proLimit: 20, windowSeconds: 86400 };

// ── Element detection prompt ────────────────────────────────────────────────
// Registered in Prompt Registry: https://www.notion.so/32e4ea3cb78781d1b06deecfacc9ce07

const ELEMENT_DETECTION_PROMPT = (width: number, height: number) =>
  `<user_data>Analyze this display ad banner (${width}x${height}px). Identify and return the bounding boxes of these elements as JSON:

{
  "elements": [
    { "type": "logo", "x": number, "y": number, "width": number, "height": number },
    { "type": "cta", "x": number, "y": number, "width": number, "height": number },
    { "type": "product", "x": number, "y": number, "width": number, "height": number },
    { "type": "headline", "x": number, "y": number, "width": number, "height": number }
  ],
  "backgroundColor": "#hex"
}

Only include elements that are clearly visible. Coordinates are in pixels from top-left. Return ONLY the JSON, no markdown.</user_data>`;

// ── Element animation config ────────────────────────────────────────────────

interface DetectedElement {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ElementsResult {
  elements: DetectedElement[];
  backgroundColor: string;
}

const ELEMENT_ANIMATIONS: Record<string, { animation: string; delay: number }> = {
  product:  { animation: "fadeScale",  delay: 0.3 },
  headline: { animation: "slideLeft",  delay: 0.6 },
  cta:      { animation: "bounceIn",   delay: 1.0 },
  logo:     { animation: "fadeIn",     delay: 1.5 },
};

// ── Smart HTML5 generator ───────────────────────────────────────────────────

function generateSmartHtml5Ad(params: {
  imageFileName: string;
  elements: DetectedElement[];
  backgroundColor: string;
  duration: number;
  loop: boolean;
  width: number;
  height: number;
}): string {
  const { imageFileName, elements, backgroundColor, duration, loop, width, height } = params;
  const loopCount = loop ? "infinite" : "3";

  let elementDivs = "";
  let elementIds = "";

  for (const el of elements) {
    const config = ELEMENT_ANIMATIONS[el.type] || { animation: "fadeIn", delay: 0.8 };
    const id = `el-${el.type}`;
    elementIds += `
      #${id} {
        position: absolute;
        left: ${el.x}px;
        top: ${el.y}px;
        width: ${el.width}px;
        height: ${el.height}px;
        animation: ${config.animation} ${Math.max(0.5, duration * 0.4)}s ease-out ${config.delay}s both;
        animation-iteration-count: ${loopCount};
      }`;
    elementDivs += `\n    <div id="${id}"></div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="ad.size" content="width=${width},height=${height}">
<title>${width}x${height} Smart Animated Ad</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .ad-container {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    background: ${backgroundColor};
  }
  .ad-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: kenburns ${duration}s ease-in-out ${loopCount};
  }
  @keyframes kenburns {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  @keyframes fadeScale {
    0% { opacity: 0; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes slideLeft {
    0% { opacity: 0; transform: translateX(-30px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes bounceIn {
    0% { opacity: 0; transform: scale(0.5); }
    60% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  ${elementIds}
</style>
</head>
<body>
<div class="ad-container" onclick="window.open(window.clickTag || '#')">
  <img class="ad-bg" src="${imageFileName}" alt="" />${elementDivs}
</div>
<script>
  var clickTag = "";
</script>
</body>
</html>`;
}

// ── Fallback: simple entrance animation ─────────────────────────────────────

function generateFallbackHtml5Ad(params: {
  imageFileName: string;
  duration: number;
  loop: boolean;
  width: number;
  height: number;
}): string {
  const { imageFileName, duration, loop, width, height } = params;
  const loopCount = loop ? "infinite" : "3";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="ad.size" content="width=${width},height=${height}">
<title>${width}x${height} Animated Ad</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .ad-container {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    background: #000;
  }
  .ad-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: entrance ${duration}s ease-in-out ${loopCount};
  }
  @keyframes entrance {
    0% { opacity: 0; transform: translateY(20px); }
    30% { opacity: 1; transform: translateY(0); }
    100% { opacity: 1; transform: translateY(0); }
  }
</style>
</head>
<body>
<div class="ad-container" onclick="window.open(window.clickTag || '#')">
  <img class="ad-image" src="${imageFileName}" alt="" />
</div>
<script>
  var clickTag = "";
</script>
</body>
</html>`;
}

// ── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const start = Date.now();

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const rl = await checkRateLimit("animate-html5-smart", user.id, user.tier, RATE);
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    if (!isProOrTeam(user.tier)) {
      return res.status(403).json({ error: "PRO_REQUIRED", feature: "animate" });
    }

    const credit = await checkFeatureCredit(user.id, user.tier, "animate");
    if (!credit.allowed) {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return res.status(429).json({
        error: "CREDIT_LIMIT_REACHED",
        feature: "animate",
        used: credit.used,
        limit: credit.limit,
        tier: user.tier,
        resetDate: resetDate.toISOString(),
      });
    }

    // ── Input validation ────────────────────────────────────────────────
    const { imageBase64, duration, loop, width, height, mimeType } = req.body ?? {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "imageBase64 is required" });
    }
    const safeDuration = Math.max(1, Math.min(30, Number(duration) || 15));
    const safeLoop = typeof loop === "boolean" ? loop : true;
    const safeWidth = Math.max(50, Math.min(2000, Number(width) || 300));
    const safeHeight = Math.max(50, Math.min(2000, Number(height) || 250));
    const safeMime = typeof mimeType === "string" ? mimeType : "image/jpeg";
    const ext = safeMime.includes("png") ? "png" : safeMime.includes("gif") ? "gif" : "jpg";
    const imageFileName = `image.${ext}`;

    // ── Step 1: Gemini Vision element detection ─────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error("[animate-html5-smart] GEMINI_API_KEY is not set");
      return apiError(res, "INTERNAL_ERROR", 500, "GEMINI_API_KEY is not set");
    }

    let elements: ElementsResult | null = null;
    let mode: "smart" | "fallback" = "smart";

    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: imageBase64,
              },
            },
            {
              text: ELEMENT_DETECTION_PROMPT(safeWidth, safeHeight),
            },
          ],
        }],
        generationConfig: { temperature: 0 },
      });

      const rawText = result.response.text().trim();
      // Strip markdown fences if present
      const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.elements && Array.isArray(parsed.elements) && parsed.elements.length > 0) {
          // Validate element bounds
          const validElements = parsed.elements.filter(
            (el: DetectedElement) =>
              el.type && typeof el.x === "number" && typeof el.y === "number" &&
              typeof el.width === "number" && typeof el.height === "number" &&
              el.x >= 0 && el.y >= 0 && el.width > 0 && el.height > 0 &&
              el.x + el.width <= safeWidth * 1.1 && el.y + el.height <= safeHeight * 1.1
          );
          if (validElements.length > 0) {
            elements = {
              elements: validElements,
              backgroundColor: parsed.backgroundColor || "#000000",
            };
          }
        }
      } catch {
        // JSON parse failed — fallback
        console.info("[animate-html5-smart] Gemini output was not valid JSON, falling back");
      }
    } catch (geminiErr) {
      console.warn("[animate-html5-smart] Gemini call failed, falling back:", geminiErr instanceof Error ? geminiErr.message : String(geminiErr));
    }

    // ── Step 2: Generate HTML5 ──────────────────────────────────────────
    let html: string;

    if (elements) {
      html = generateSmartHtml5Ad({
        imageFileName,
        elements: elements.elements,
        backgroundColor: elements.backgroundColor,
        duration: safeDuration,
        loop: safeLoop,
        width: safeWidth,
        height: safeHeight,
      });
    } else {
      mode = "fallback";
      html = generateFallbackHtml5Ad({
        imageFileName,
        duration: safeDuration,
        loop: safeLoop,
        width: safeWidth,
        height: safeHeight,
      });
    }

    // ── Step 3: Zip bundle ──────────────────────────────────────────────
    let zipBuffer: Buffer;
    try {
      const zip = new JSZip();
      zip.file("index.html", html);
      const imageBuffer = Buffer.from(imageBase64, "base64");
      zip.file(imageFileName, imageBuffer);
      zip.file("manifest.json", JSON.stringify({
        version: "1.0",
        width: safeWidth,
        height: safeHeight,
        mode,
        assets: [imageFileName, "index.html"],
      }, null, 2));
      zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    } catch (zipErr) {
      await refundCredit(user.id, user.tier, "animate");
      console.info("[animate-html5-smart] Credit refunded -- zip creation failed");
      return apiError(res, "GENERATION_FAILED", 500,
        `[animate-html5-smart] zip: ${zipErr instanceof Error ? zipErr.message : String(zipErr)}`);
    }

    logApiUsage({
      userId: user.id,
      endpoint: "animate-html5-smart",
      statusCode: 200,
      responseTimeMs: Date.now() - start,
      format: `${safeWidth}x${safeHeight}`,
    });

    return res.status(200).json({
      html,
      zipBase64: zipBuffer.toString("base64"),
      fileSize: zipBuffer.length,
      mode,
      detectedElements: elements ? elements.elements.length : 0,
    });
  } catch (err) {
    // Refund on unexpected failure
    try {
      const user = await verifyAuth(req);
      if (user) await refundCredit(user.id, user.tier, "animate");
    } catch { /* best-effort refund */ }

    logApiUsage({
      userId: "unknown",
      endpoint: "animate-html5-smart",
      statusCode: 500,
      responseTimeMs: Date.now() - start,
      errorCode: "GENERATION_FAILED",
    });
    return apiError(res, "GENERATION_FAILED", 500,
      `[animate-html5-smart] ${err instanceof Error ? err.message : String(err)}`);
  }
}
