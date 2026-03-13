#!/usr/bin/env node
// Capture demo sequences as frame PNGs, then stitch into WebP (alpha) + MP4 via ffmpeg
// All inputs are hardcoded constants — no user input, safe to use execFileSync.

import puppeteer from "puppeteer";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = "/Users/atlas/.local/bin/ffmpeg";
const OUTPUT_DIR = path.resolve(__dirname, "../demo-exports");
const BASE_URL = "http://localhost:3000/demo";
const FPS = 24;
const VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 2 };

const SEQUENCES = [
  { id: 1, name: "upload-to-analysis", duration: 6000 },
  { id: 2, name: "scorecard-deep-dive", duration: 8000 },
  { id: 3, name: "ab-pre-flight", duration: 8000 },
  { id: 4, name: "batch-mode", duration: 6000 },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureSequence(browser, seq) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  console.log(`  Navigating to ?seq=${seq.id}...`);
  await page.goto(`${BASE_URL}?seq=${seq.id}`, {
    waitUntil: "networkidle0",
    timeout: 15000,
  });

  // Wait for fonts + initial render
  await sleep(1500);

  const frameDir = path.join(OUTPUT_DIR, `frames-${seq.id}`);
  fs.mkdirSync(frameDir, { recursive: true });

  const totalFrames = Math.ceil((seq.duration / 1000) * FPS);

  console.log(`  Capturing ${totalFrames} frames at ${FPS}fps...`);

  for (let i = 0; i < totalFrames; i++) {
    // Set deterministic time for this frame
    const frameTime = (i / FPS) * 1000;
    await page.evaluate((t) => {
      window.__DEMO_TIME__ = t;
    }, frameTime);

    // Small delay to let React re-render
    await sleep(50);

    const framePath = path.join(
      frameDir,
      `frame-${String(i).padStart(4, "0")}.png`
    );
    // Capture with transparent background (omitBackground for alpha)
    await page.screenshot({ path: framePath, type: "png", omitBackground: true });

    if ((i + 1) % 10 === 0 || i === totalFrames - 1) {
      process.stdout.write(`    ${i + 1}/${totalFrames} frames\r`);
    }
  }
  console.log(); // newline after progress

  await page.close();

  // Check for ffmpeg
  const hasFFmpeg = fs.existsSync(FFMPEG);
  if (!hasFFmpeg) {
    console.log("  ffmpeg not found — saving PNG frames only");
    return;
  }

  const framePattern = path.join(frameDir, "frame-%04d.png");

  // ffmpeg: frames -> MP4 (high quality, no alpha in MP4)
  const mp4Out = path.join(OUTPUT_DIR, `${seq.name}.mp4`);
  console.log(`  Encoding MP4...`);
  execFileSync(FFMPEG, [
    "-y",
    "-framerate", String(FPS),
    "-i", framePattern,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-preset", "slow",
    mp4Out,
  ], { stdio: "pipe" });
  const mp4Size = (fs.statSync(mp4Out).size / 1024).toFixed(0);
  console.log(`     ${seq.name}.mp4 (${mp4Size} KB)`);

  // ffmpeg: frames -> animated WebP (with alpha channel, 640px wide)
  const webpOut = path.join(OUTPUT_DIR, `${seq.name}.webp`);
  console.log(`  Encoding WebP...`);
  execFileSync(FFMPEG, [
    "-y",
    "-framerate", String(FPS),
    "-i", framePattern,
    "-vf", `fps=${FPS},scale=640:-1:flags=lanczos`,
    "-c:v", "libwebp_anim",
    "-lossless", "0",
    "-quality", "80",
    "-loop", "0",
    webpOut,
  ], { stdio: "pipe" });
  const webpSize = (fs.statSync(webpOut).size / 1024).toFixed(0);
  console.log(`     ${seq.name}.webp (${webpSize} KB)`);

  // Cleanup frames
  fs.rmSync(frameDir, { recursive: true, force: true });
}

async function main() {
  console.log("Demo Capture Pipeline");
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`  FPS: ${FPS}, Resolution: ${VIEWPORT.width}x${VIEWPORT.height} @${VIEWPORT.deviceScaleFactor}x\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1280,800",
    ],
  });

  for (const seq of SEQUENCES) {
    console.log(`\nSequence ${seq.id}: "${seq.name}" (${seq.duration / 1000}s)`);
    await captureSequence(browser, seq);
  }

  await browser.close();

  // Summary
  console.log("\n\nCapture complete! Files:");
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => !f.startsWith(".") && !f.startsWith("frames"));
  for (const file of files.sort()) {
    const size = (fs.statSync(path.join(OUTPUT_DIR, file)).size / 1024).toFixed(0);
    console.log(`  ${file} (${size} KB)`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
