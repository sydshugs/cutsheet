import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WIDTH = 1200;
const HEIGHT = 630;

const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// Background — zinc-950
ctx.fillStyle = "#09090b";
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Indigo glow circle (center)
const glow = ctx.createRadialGradient(
  WIDTH / 2, HEIGHT / 2, 0,
  WIDTH / 2, HEIGHT / 2, 300
);
glow.addColorStop(0, "rgba(99, 102, 241, 0.15)");
glow.addColorStop(1, "transparent");
ctx.fillStyle = glow;
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// "cutsheet" wordmark — white, 72px, centered
ctx.fillStyle = "#ffffff";
ctx.font = "bold 72px 'Helvetica Neue', Helvetica, Arial, sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("cutsheet", WIDTH / 2, HEIGHT / 2 - 30);

// Tagline — zinc-400, 28px, centered below
ctx.fillStyle = "#a1a1aa";
ctx.font = "400 28px 'Helvetica Neue', Helvetica, Arial, sans-serif";
ctx.fillText("Know which ad will win — before you spend.", WIDTH / 2, HEIGHT / 2 + 40);

// "cutsheet.xyz" — zinc-600, 18px, bottom right
ctx.fillStyle = "#52525b";
ctx.font = "500 18px 'Helvetica Neue', Helvetica, Arial, sans-serif";
ctx.textAlign = "right";
ctx.fillText("cutsheet.xyz", WIDTH - 40, HEIGHT - 32);

// Export
const out = resolve(__dirname, "..", "public", "og-image.png");
writeFileSync(out, canvas.toBuffer("image/png"));
console.log(`✅ OG image saved to ${out} (${Math.round(canvas.toBuffer("image/png").length / 1024)} KB)`);
