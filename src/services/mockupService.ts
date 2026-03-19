// mockupService.ts — Canvas-based real-life placement mockups for display ads

import type { DisplayFormat } from "../utils/displayAdUtils";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

// ─── DRAWING HELPERS ────────────────────────────────────────────────────────

function drawNavBar(ctx: CanvasRenderingContext2D, w: number) {
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, w, 44);
  ctx.fillStyle = "#e9ecef";
  ctx.fillRect(0, 43, w, 1);
  // Fake logo
  ctx.fillStyle = "#adb5bd";
  ctx.fillRect(16, 12, 80, 20);
  // Fake nav links
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = "#ced4da";
    ctx.fillRect(140 + i * 70, 16, 50, 12);
  }
}

function drawTextLines(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, count: number, gap = 20) {
  for (let i = 0; i < count; i++) {
    const lineW = w * (0.7 + Math.random() * 0.3);
    ctx.fillStyle = "#dee2e6";
    ctx.fillRect(x, y + i * gap, lineW, 10);
  }
}

function drawHeadline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = "#343a40";
  ctx.fillRect(x, y, w * 0.75, 16);
  ctx.fillRect(x, y + 22, w * 0.5, 16);
}

function drawAdLabel(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#adb5bd";
  ctx.font = "10px sans-serif";
  ctx.fillText("Ad", x, y - 4);
}

function drawAnnotation(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.setLineDash([]);
  // Label
  ctx.fillStyle = "#ef4444";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("Your ad", x, y + h + 16);
}

// ─── LAYOUT GENERATORS ──────────────────────────────────────────────────────

function drawLeaderboardMockup(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, banner: HTMLImageElement) {
  // White bg
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawNavBar(ctx, canvas.width);

  // Banner centered below nav
  const bx = (canvas.width - 728) / 2;
  const by = 56;
  drawAdLabel(ctx, bx, by);
  ctx.drawImage(banner, bx, by, 728, 90);
  drawAnnotation(ctx, bx, by, 728, 90);

  // Article content below
  const cx = (canvas.width - 660) / 2;
  drawHeadline(ctx, cx, by + 120, 660);
  ctx.fillStyle = "#868e96";
  ctx.fillRect(cx, by + 162, 140, 8);
  drawTextLines(ctx, cx, by + 190, 660, 15, 22);
}

function drawRectangleMockup(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, banner: HTMLImageElement) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawNavBar(ctx, canvas.width);

  // Two-column: content left (620px), sidebar right (300px)
  const contentX = 40;
  const sidebarX = canvas.width - 340;

  // Content column
  drawHeadline(ctx, contentX, 70, 580);
  ctx.fillStyle = "#868e96";
  ctx.fillRect(contentX, 112, 140, 8);
  drawTextLines(ctx, contentX, 140, 580, 22, 22);

  // Sidebar
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(sidebarX - 20, 56, 340, canvas.height - 56);
  ctx.fillStyle = "#e9ecef";
  ctx.fillRect(sidebarX - 20, 56, 1, canvas.height - 56);

  // Banner in sidebar
  const by = 80;
  drawAdLabel(ctx, sidebarX, by);
  ctx.drawImage(banner, sidebarX, by, 300, 250);
  drawAnnotation(ctx, sidebarX, by, 300, 250);

  // Sidebar content below ad
  drawTextLines(ctx, sidebarX, by + 280, 280, 6, 18);
}

function drawSkyscraperMockup(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, banner: HTMLImageElement) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawNavBar(ctx, canvas.width);

  // Content left, skyscraper right rail
  const contentX = 40;
  const railX = canvas.width - 200;

  drawHeadline(ctx, contentX, 70, 700);
  ctx.fillStyle = "#868e96";
  ctx.fillRect(contentX, 112, 140, 8);
  drawTextLines(ctx, contentX, 140, 700, 28, 22);

  // Right rail bg
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(railX - 20, 56, 220, canvas.height - 56);
  ctx.fillStyle = "#e9ecef";
  ctx.fillRect(railX - 20, 56, 1, canvas.height - 56);

  // Skyscraper
  const by = 70;
  drawAdLabel(ctx, railX, by);
  ctx.drawImage(banner, railX, by, 160, 600);
  drawAnnotation(ctx, railX, by, 160, 600);
}

function drawMobileMockup(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, banner: HTMLImageElement, bannerH: number) {
  // Phone frame bg
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Screen area
  const sx = 15, sy = 60, sw = canvas.width - 30, sh = canvas.height - 80;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, sx, sy, sw, sh, 16);

  // Status bar
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(sx, sy, sw, 28);
  ctx.fillStyle = "#868e96";
  ctx.font = "11px sans-serif";
  ctx.fillText("9:41", sx + 10, sy + 18);

  // Browser chrome
  ctx.fillStyle = "#f1f3f5";
  ctx.fillRect(sx, sy + 28, sw, 32);
  ctx.fillStyle = "#e9ecef";
  roundRect(ctx, sx + 10, sy + 34, sw - 20, 20, 8);
  ctx.fillStyle = "#adb5bd";
  ctx.font = "10px sans-serif";
  ctx.fillText("example.com/article", sx + 20, sy + 48);

  // Content
  const cy = sy + 72;
  drawHeadline(ctx, sx + 16, cy, sw - 32);
  ctx.fillStyle = "#868e96";
  ctx.fillRect(sx + 16, cy + 42, 100, 8);
  drawTextLines(ctx, sx + 16, cy + 64, sw - 32, 20, 18);

  // Banner at bottom
  const bx = sx + (sw - banner.width * (sw / banner.width)) / 2;
  const by = canvas.height - 80 - bannerH - 10;
  const bw = Math.min(sw, banner.width);
  drawAdLabel(ctx, sx + 10, by);
  ctx.drawImage(banner, sx + (sw - bw) / 2, by, bw, bannerH);
  drawAnnotation(ctx, sx + (sw - bw) / 2, by, bw, bannerH);
}

function drawGenericMockup(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, banner: HTMLImageElement, w: number, h: number) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawNavBar(ctx, canvas.width);

  // Center the banner
  const bx = (canvas.width - w) / 2;
  const by = (canvas.height - h) / 2;
  drawAdLabel(ctx, bx, by);
  ctx.drawImage(banner, bx, by, w, h);
  drawAnnotation(ctx, bx, by, w, h);

  // Surrounding content
  drawTextLines(ctx, 40, 60, canvas.width - 80, 4, 18);
  drawTextLines(ctx, 40, by + h + 30, canvas.width - 80, 6, 18);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

export async function generateDisplayMockup(
  bannerFile: File,
  format: DisplayFormat | null,
  width: number,
  height: number
): Promise<string> {
  const bannerImg = await loadImage(URL.createObjectURL(bannerFile));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const key = format?.key ?? "";

  if (key === "728x90" || key === "468x60") {
    canvas.width = 1000;
    canvas.height = 550;
    drawLeaderboardMockup(ctx, canvas, bannerImg);
  } else if (key === "300x250" || key === "336x280" || key === "250x250") {
    canvas.width = 1000;
    canvas.height = 650;
    drawRectangleMockup(ctx, canvas, bannerImg);
  } else if (key === "160x600") {
    canvas.width = 1000;
    canvas.height = 750;
    drawSkyscraperMockup(ctx, canvas, bannerImg);
  } else if (key === "320x50" || key === "320x100") {
    canvas.width = 390;
    canvas.height = 844;
    drawMobileMockup(ctx, canvas, bannerImg, height);
  } else if (key === "300x600") {
    canvas.width = 1000;
    canvas.height = 750;
    drawRectangleMockup(ctx, canvas, bannerImg); // reuse sidebar layout
  } else if (key === "970x250") {
    canvas.width = 1100;
    canvas.height = 600;
    drawLeaderboardMockup(ctx, canvas, bannerImg);
  } else {
    canvas.width = 1000;
    canvas.height = 650;
    drawGenericMockup(ctx, canvas, bannerImg, width, height);
  }

  return canvas.toDataURL("image/png");
}

// ─── SUITE MOCKUP ───────────────────────────────────────────────────────────

interface SuiteBanner {
  file: File;
  format: DisplayFormat | null;
  score?: number;
}

/** Placement positions for standard formats on a combined news site mockup */
const SUITE_PLACEMENTS: Record<string, { x: number; y: number; w: number; h: number; label: string }> = {
  "728x90":  { x: 336, y: 56,  w: 728, h: 90,  label: "Leaderboard" },
  "468x60":  { x: 466, y: 56,  w: 468, h: 60,  label: "Full Banner" },
  "970x250": { x: 215, y: 56,  w: 970, h: 250, label: "Billboard" },
  "300x250": { x: 1060, y: 170, w: 300, h: 250, label: "Rectangle" },
  "336x280": { x: 1060, y: 170, w: 336, h: 280, label: "Lg Rectangle" },
  "160x600": { x: 1220, y: 170, w: 160, h: 600, label: "Skyscraper" },
  "300x600": { x: 1060, y: 450, w: 300, h: 600, label: "Half Page" },
  "320x50":  { x: 40,  y: 780, w: 320, h: 50,  label: "Mobile Banner" },
  "320x100": { x: 40,  y: 760, w: 320, h: 100, label: "Lg Mobile" },
  "250x250": { x: 1060, y: 170, w: 250, h: 250, label: "Square" },
};

const STANDARD_FORMATS = ["728x90", "300x250", "160x600", "320x50"];

export async function generateSuiteMockup(
  banners: SuiteBanner[]
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d")!;

  // White page bg
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1400, 900);

  // Nav bar
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, 1400, 50);
  ctx.fillStyle = "#e9ecef";
  ctx.fillRect(0, 49, 1400, 1);
  ctx.fillStyle = "#adb5bd";
  ctx.fillRect(20, 15, 100, 20);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "#ced4da";
    ctx.fillRect(180 + i * 80, 18, 56, 12);
  }

  // Content area (center column)
  const cx = 40;
  const cy = 170;
  drawHeadline(ctx, cx, cy, 700);
  ctx.fillStyle = "#868e96";
  ctx.fillRect(cx, cy + 44, 160, 8);
  drawTextLines(ctx, cx, cy + 72, 700, 8, 22);
  // Second content block
  ctx.fillStyle = "#e9ecef";
  ctx.fillRect(cx, cy + 280, 700, 200); // image placeholder
  drawTextLines(ctx, cx, cy + 500, 700, 6, 22);

  // Sidebar bg
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(1040, 56, 360, 844);
  ctx.fillStyle = "#e9ecef";
  ctx.fillRect(1040, 56, 1, 844);

  // Placed formats (keyed set)
  const placedKeys = new Set<string>();

  // Draw each banner
  let idx = 1;
  for (const banner of banners) {
    const key = banner.format?.key ?? "";
    const placement = SUITE_PLACEMENTS[key];
    if (!placement) continue;

    const img = await loadImage(URL.createObjectURL(banner.file));
    ctx.drawImage(img, placement.x, placement.y, placement.w, placement.h);

    // Red dashed border
    ctx.strokeStyle = "rgba(239,68,68,0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(placement.x, placement.y, placement.w, placement.h);
    ctx.setLineDash([]);

    // "Ad" label
    ctx.fillStyle = "#adb5bd";
    ctx.font = "10px sans-serif";
    ctx.fillText("Ad", placement.x + 2, placement.y - 3);

    // Numbered circle
    ctx.fillStyle = "#6366f1";
    ctx.beginPath();
    ctx.arc(placement.x + placement.w - 10, placement.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(idx), placement.x + placement.w - 10, placement.y + 14);
    ctx.textAlign = "start";

    placedKeys.add(key);
    idx++;
  }

  // Draw missing format placeholders
  for (const stdKey of STANDARD_FORMATS) {
    if (placedKeys.has(stdKey)) continue;
    const placement = SUITE_PLACEMENTS[stdKey];
    if (!placement) continue;

    ctx.strokeStyle = "rgba(245,158,11,0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(placement.x, placement.y, placement.w, placement.h);
    ctx.setLineDash([]);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Missing: ${placement.label}`, placement.x + placement.w / 2, placement.y + placement.h / 2 + 4);
    ctx.textAlign = "start";
  }

  // Legend bar at bottom
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 860, 1400, 40);
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "12px sans-serif";
  ctx.fillText(`${banners.length} banner${banners.length > 1 ? "s" : ""} in suite`, 20, 884);

  let lx = 220;
  for (const banner of banners) {
    const label = banner.format?.name ?? "Custom";
    const sc = banner.score != null ? ` ${banner.score}/10` : "";
    ctx.fillStyle = "#52525b";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${label}${sc}`, lx, 884);
    lx += ctx.measureText(`${label}${sc}`).width + 20;
  }

  return canvas.toDataURL("image/png");
}
