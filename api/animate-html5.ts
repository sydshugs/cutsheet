// api/animate-html5.ts — Generate animated HTML5 ad unit from static display banner
// CSS keyframe animations applied to the original image. No AI needed.
//
// CREDIT FLOW:
// 1. verifyAuth() -> get user + tier
// 2. checkRateLimit() -> per-user throttle
// 3. Verify isPro -> 403 if free tier
// 4. Deduct 1 credit (atomic) -> 429 if no credits
// 5. Generate HTML5 ad + zip bundle
// 6. If generation fails -> refund credit
// 7. Return html + zipBase64 + fileSize

export const maxDuration = 15;

import type { VercelRequest, VercelResponse } from "@vercel/node";
import JSZip from "jszip";
import { verifyAuth, handlePreflight, isProOrTeam, checkRateLimit } from "./_lib/auth";
import { checkFeatureCredit, refundCredit } from "./_lib/creditCheck";
import { apiError } from "./_lib/apiError.js";
import { logApiUsage } from "./_lib/logUsage";

type AnimationStyle = "entrance" | "pulse" | "reveal" | "kenburns" | "slidein" | "bounce" | "glow" | "wipe";

const RATE = { freeLimit: 0, proLimit: 20, windowSeconds: 86400 };

// ── CSS Animation Templates ─────────────────────────────────────────────────

const ANIMATION_CSS: Record<AnimationStyle, string> = {
  entrance: `@keyframes entrance {
  0% { opacity: 0; transform: translateY(20px); }
  30% { opacity: 1; transform: translateY(0); }
  100% { opacity: 1; transform: translateY(0); }
}`,
  pulse: `@keyframes pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.03); filter: brightness(1.08); }
}`,
  reveal: `@keyframes reveal {
  0% { clip-path: inset(0 100% 0 0); }
  50% { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}`,
  kenburns: `@keyframes kenburns {
  0% { transform: scale(1) translate(0, 0); }
  50% { transform: scale(1.08) translate(-2%, -1%); }
  100% { transform: scale(1) translate(0, 0); }
}`,
  slidein: `@keyframes slidein {
  0% { transform: translateX(-100%); opacity: 0; }
  20% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(0); opacity: 1; }
}`,
  bounce: `@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  15% { transform: translateY(-8px); }
  30% { transform: translateY(0); }
  45% { transform: translateY(-4px); }
  60% { transform: translateY(0); }
}`,
  glow: `@keyframes glow {
  0%, 100% { filter: brightness(1) drop-shadow(0 0 0 transparent); }
  50% { filter: brightness(1.1) drop-shadow(0 0 15px rgba(255,255,255,0.3)); }
}`,
  wipe: `@keyframes wipe {
  0% { clip-path: inset(0 100% 0 0); }
  40% { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}`,
};

const VALID_STYLES = new Set<string>(["entrance", "pulse", "reveal", "kenburns", "slidein", "bounce", "glow", "wipe"]);

// ── HTML5 Ad Generator ──────────────────────────────────────────────────────

function generateHtml5Ad(params: {
  imageFileName: string;
  style: AnimationStyle;
  duration: number;
  loop: boolean;
  width: number;
  height: number;
}): string {
  const { imageFileName, style, duration, loop, width, height } = params;
  const loopCount = loop ? "infinite" : "3";
  const animationCSS = ANIMATION_CSS[style];

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
    animation: ${style} ${duration}s ease-in-out ${loopCount};
  }
  ${animationCSS}
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

// ── Zip Bundler ─────────────────────────────────────────────────────────────

async function createAdZip(
  html: string,
  imageBase64: string,
  mimeType: string,
): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("index.html", html);

  // Decode base64 image and add as file
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("gif") ? "gif" : "jpg";
  zip.file(`image.${ext}`, imageBuffer);

  // Manifest for ad servers
  zip.file("manifest.json", JSON.stringify({
    version: "1.0",
    width: 0, // set by caller metadata
    height: 0,
    assets: [`image.${ext}`, "index.html"],
  }, null, 2));

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return buf;
}

// ── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const start = Date.now();

  try {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // ── Rate limit ──────────────────────────────────────────────────────
    const rl = await checkRateLimit("animate-html5", user.id, user.tier, RATE);
    if (!rl.allowed) {
      return res.status(429).json({ error: "RATE_LIMITED", resetAt: rl.resetAt });
    }

    // ── Pro gate ────────────────────────────────────────────────────────
    if (!isProOrTeam(user.tier)) {
      return res.status(403).json({ error: "PRO_REQUIRED", feature: "animate" });
    }

    // ── Credit check (atomic deduct) ────────────────────────────────────
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
    const { imageBase64, style, duration, loop, width, height, mimeType } = req.body ?? {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "imageBase64 is required" });
    }
    if (!VALID_STYLES.has(style)) {
      return res.status(400).json({ error: "Invalid animation style" });
    }
    const safeDuration = Math.max(1, Math.min(30, Number(duration) || 15));
    const safeLoop = typeof loop === "boolean" ? loop : true;
    const safeWidth = Math.max(50, Math.min(2000, Number(width) || 300));
    const safeHeight = Math.max(50, Math.min(2000, Number(height) || 250));
    const safeMime = typeof mimeType === "string" ? mimeType : "image/jpeg";

    // ── DEV MOCK ────────────────────────────────────────────────────────
    if (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === undefined) {
      const html = generateHtml5Ad({
        imageFileName: `data:${safeMime};base64,${imageBase64.slice(0, 100)}...`,
        style: style as AnimationStyle,
        duration: safeDuration,
        loop: safeLoop,
        width: safeWidth,
        height: safeHeight,
      });
      return res.status(200).json({ html, zipBase64: "", fileSize: 0 });
    }

    // ── Generate HTML5 ad ───────────────────────────────────────────────
    const ext = safeMime.includes("png") ? "png" : safeMime.includes("gif") ? "gif" : "jpg";
    const imageFileName = `image.${ext}`;

    const html = generateHtml5Ad({
      imageFileName,
      style: style as AnimationStyle,
      duration: safeDuration,
      loop: safeLoop,
      width: safeWidth,
      height: safeHeight,
    });

    // ── Bundle into zip ─────────────────────────────────────────────────
    let zipBuffer: Buffer;
    try {
      zipBuffer = await createAdZip(html, imageBase64, safeMime);
    } catch (zipErr) {
      await refundCredit(user.id, user.tier, "animate");
      console.info("[animate-html5] Credit refunded -- zip creation failed");
      return apiError(res, "GENERATION_FAILED", 500,
        `[animate-html5] zip: ${zipErr instanceof Error ? zipErr.message : String(zipErr)}`);
    }

    logApiUsage({
      userId: user.id,
      endpoint: "animate-html5",
      statusCode: 200,
      responseTimeMs: Date.now() - start,
      format: `${safeWidth}x${safeHeight}`,
    });

    return res.status(200).json({
      html,
      zipBase64: zipBuffer.toString("base64"),
      fileSize: zipBuffer.length,
    });
  } catch (err) {
    logApiUsage({
      userId: "unknown",
      endpoint: "animate-html5",
      statusCode: 500,
      responseTimeMs: Date.now() - start,
      errorCode: "GENERATION_FAILED",
    });
    return apiError(res, "GENERATION_FAILED", 500,
      `[animate-html5] ${err instanceof Error ? err.message : String(err)}`);
  }
}
