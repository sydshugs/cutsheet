// src/components/SafeZonePreview.tsx
// Premium safe zone preview component — realistic phone frame + platform overlays

import { useState } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type Platform =
  | "tiktok"
  | "instagram_reels"
  | "instagram_stories"
  | "youtube_shorts"
  | "facebook_reels"
  | "universal";

export type Mode = "organic" | "paid";

export interface SafeZoneConfig {
  top: number;    // % from top that is danger zone
  bottom: number; // % from bottom that is danger zone
  left: number;   // % from left that is danger zone
  right: number;  // % from right that is danger zone
}

export interface SafeZonePreviewProps {
  imageUrl: string;
  platform: Platform;
  mode: Mode;
  safeZoneConfig?: SafeZoneConfig;
}

// ─── PLATFORM CONFIG ─────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram_reels: "IG Reels",
  instagram_stories: "IG Stories",
  youtube_shorts: "YT Shorts",
  facebook_reels: "FB Reels",
  universal: "Universal",
};

type UiElement = {
  label: string;
  zone: "top" | "bottom";
  offsetPct?: number; // % within the danger zone, 0=edge 100=inner
};

const PLATFORM_UI_ELEMENTS: Record<Platform, Record<Mode, UiElement[]>> = {
  tiktok: {
    organic: [
      { label: "Status bar", zone: "top", offsetPct: 15 },
      { label: "Profile + likes", zone: "bottom", offsetPct: 55 },
      { label: "Caption bar", zone: "bottom", offsetPct: 25 },
    ],
    paid: [
      { label: "Status bar", zone: "top", offsetPct: 15 },
      { label: "Profile + likes", zone: "bottom", offsetPct: 65 },
      { label: "Caption bar", zone: "bottom", offsetPct: 45 },
      { label: "CTA button", zone: "bottom", offsetPct: 15 },
    ],
  },
  instagram_reels: {
    organic: [
      { label: "Back + audio", zone: "top", offsetPct: 20 },
      { label: "Like / Comment", zone: "bottom", offsetPct: 60 },
      { label: "Caption", zone: "bottom", offsetPct: 30 },
    ],
    paid: [
      { label: "Back + audio", zone: "top", offsetPct: 20 },
      { label: "Like / Comment", zone: "bottom", offsetPct: 65 },
      { label: "Caption", zone: "bottom", offsetPct: 40 },
      { label: "Sponsored CTA", zone: "bottom", offsetPct: 15 },
    ],
  },
  instagram_stories: {
    organic: [
      { label: "Progress bar", zone: "top", offsetPct: 70 },
      { label: "Profile handle", zone: "top", offsetPct: 20 },
      { label: "Reply box", zone: "bottom", offsetPct: 20 },
    ],
    paid: [
      { label: "Progress bar", zone: "top", offsetPct: 70 },
      { label: "Sponsored", zone: "top", offsetPct: 25 },
      { label: "Swipe Up / CTA", zone: "bottom", offsetPct: 30 },
    ],
  },
  youtube_shorts: {
    organic: [
      { label: "Status bar", zone: "top", offsetPct: 15 },
      { label: "Subscribe", zone: "bottom", offsetPct: 60 },
      { label: "Title", zone: "bottom", offsetPct: 30 },
    ],
    paid: [
      { label: "Status bar", zone: "top", offsetPct: 15 },
      { label: "Subscribe", zone: "bottom", offsetPct: 65 },
      { label: "Title", zone: "bottom", offsetPct: 40 },
      { label: "Visit site", zone: "bottom", offsetPct: 15 },
    ],
  },
  facebook_reels: {
    organic: [
      { label: "Status bar", zone: "top", offsetPct: 20 },
      { label: "React / Share", zone: "bottom", offsetPct: 55 },
      { label: "Caption", zone: "bottom", offsetPct: 20 },
    ],
    paid: [
      { label: "Status bar", zone: "top", offsetPct: 20 },
      { label: "React / Share", zone: "bottom", offsetPct: 65 },
      { label: "Caption", zone: "bottom", offsetPct: 40 },
      { label: "Shop Now", zone: "bottom", offsetPct: 12 },
    ],
  },
  universal: {
    organic: [
      { label: "Status bar", zone: "top", offsetPct: 20 },
      { label: "UI controls", zone: "bottom", offsetPct: 50 },
      { label: "Caption area", zone: "bottom", offsetPct: 20 },
    ],
    paid: [
      { label: "Status bar", zone: "top", offsetPct: 20 },
      { label: "UI controls", zone: "bottom", offsetPct: 65 },
      { label: "Caption area", zone: "bottom", offsetPct: 40 },
      { label: "CTA button", zone: "bottom", offsetPct: 12 },
    ],
  },
};

const DEFAULT_SAFE_ZONE_CONFIGS: Record<Platform, Record<Mode, SafeZoneConfig>> = {
  tiktok: {
    organic: { top: 12, bottom: 30, left: 0, right: 0 },
    paid: { top: 12, bottom: 42, left: 0, right: 0 },
  },
  instagram_reels: {
    organic: { top: 10, bottom: 28, left: 0, right: 0 },
    paid: { top: 10, bottom: 38, left: 0, right: 0 },
  },
  instagram_stories: {
    organic: { top: 14, bottom: 18, left: 0, right: 0 },
    paid: { top: 18, bottom: 22, left: 0, right: 0 },
  },
  youtube_shorts: {
    organic: { top: 10, bottom: 30, left: 0, right: 12 },
    paid: { top: 10, bottom: 40, left: 0, right: 12 },
  },
  facebook_reels: {
    organic: { top: 10, bottom: 28, left: 0, right: 0 },
    paid: { top: 10, bottom: 38, left: 0, right: 0 },
  },
  universal: {
    organic: { top: 12, bottom: 28, left: 0, right: 0 },
    paid: { top: 12, bottom: 38, left: 0, right: 0 },
  },
};

// ─── PLATFORM TABS ────────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
  "tiktok",
  "instagram_reels",
  "instagram_stories",
  "youtube_shorts",
  "facebook_reels",
  "universal",
];

// ─── UI ELEMENT CHIP ─────────────────────────────────────────────────────────

function UiChip({ label, zone, offsetPct = 50, dangerHeightPct }: {
  label: string;
  zone: "top" | "bottom";
  offsetPct: number;
  dangerHeightPct: number;
}) {
  // Position the chip within the danger zone
  const positionStyle: React.CSSProperties =
    zone === "top"
      ? { top: `${dangerHeightPct * (offsetPct / 100)}%` }
      : { bottom: `${dangerHeightPct * (offsetPct / 100)}%` };

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={positionStyle}
    >
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/40 text-rose-300/80 border border-rose-500/20 backdrop-blur-sm whitespace-nowrap">
        <span className="w-1 h-1 rounded-full bg-rose-400/60 inline-block" />
        {label}
      </span>
    </div>
  );
}

// ─── PHONE FRAME ─────────────────────────────────────────────────────────────

function PhoneFrame({
  imageUrl,
  safeZone,
  platform,
  mode,
}: {
  imageUrl: string;
  safeZone: SafeZoneConfig;
  platform: Platform;
  mode: Mode;
}) {
  const uiElements = PLATFORM_UI_ELEMENTS[platform][mode];
  const topElements = uiElements.filter((e) => e.zone === "top");
  const bottomElements = uiElements.filter((e) => e.zone === "bottom");

  return (
    // Phone outer shell
    <div className="relative mx-auto" style={{ width: 260 }}>
      {/* Subtle glow behind phone */}
      <div className="absolute inset-0 rounded-[44px] bg-white/[0.03] blur-2xl scale-110 pointer-events-none" />

      {/* Phone body */}
      <div
        className="relative rounded-[40px] overflow-hidden shadow-2xl shadow-black/60"
        style={{
          background: "linear-gradient(160deg, #27272a 0%, #18181b 60%, #09090b 100%)",
          border: "1.5px solid rgba(255,255,255,0.10)",
          padding: "3px",
        }}
      >
        {/* Inner bezel */}
        <div
          className="relative rounded-[38px] overflow-hidden"
          style={{
            aspectRatio: "9/19.5",
            background: "#000",
          }}
        >
          {/* Ad image fills the screen */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Ad creative"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
              <span className="text-zinc-600 text-xs">No image</span>
            </div>
          )}

          {/* ── Dynamic island / notch ── */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
            <div className="w-24 h-[13px] rounded-full bg-black" />
          </div>

          {/* ── TOP danger zone overlay ── */}
          {safeZone.top > 0 && (
            <div
              className="absolute left-0 right-0 top-0 z-20 pointer-events-none"
              style={{ height: `${safeZone.top}%` }}
            >
              {/* Red fill */}
              <div className="absolute inset-0 bg-rose-500/[0.13]" />
              {/* Dashed bottom border */}
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: 0,
                  borderBottom: "1.5px dashed rgba(251,113,133,0.55)",
                }}
              />
              {/* UI element chips */}
              <div className="absolute inset-0">
                {topElements.map((el) => (
                  <UiChip
                    key={el.label}
                    label={el.label}
                    zone="top"
                    offsetPct={el.offsetPct ?? 50}
                    dangerHeightPct={safeZone.top}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── BOTTOM danger zone overlay ── */}
          {safeZone.bottom > 0 && (
            <div
              className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none"
              style={{ height: `${safeZone.bottom}%` }}
            >
              {/* Red fill */}
              <div className="absolute inset-0 bg-rose-500/[0.13]" />
              {/* Dashed top border */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: 0,
                  borderTop: "1.5px dashed rgba(251,113,133,0.55)",
                }}
              />
              {/* UI element chips */}
              <div className="absolute inset-0">
                {bottomElements.map((el) => (
                  <UiChip
                    key={el.label}
                    label={el.label}
                    zone="bottom"
                    offsetPct={el.offsetPct ?? 50}
                    dangerHeightPct={safeZone.bottom}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── RIGHT danger zone overlay (YT Shorts sidebar) ── */}
          {safeZone.right > 0 && (
            <div
              className="absolute top-0 bottom-0 right-0 z-20 pointer-events-none"
              style={{ width: `${safeZone.right}%` }}
            >
              <div className="absolute inset-0 bg-rose-500/[0.13]" />
              <div
                className="absolute top-0 bottom-0 left-0"
                style={{
                  width: 0,
                  borderLeft: "1.5px dashed rgba(251,113,133,0.55)",
                }}
              />
            </div>
          )}

          {/* ── SAFE ZONE border ── */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              top: `${safeZone.top}%`,
              bottom: `${safeZone.bottom}%`,
              left: `${safeZone.left}%`,
              right: `${safeZone.right}%`,
              border: "1.5px dashed rgba(134,239,172,0.50)",
              boxShadow: "0 0 0 1px rgba(134,239,172,0.06) inset",
            }}
          />

          {/* ── Safe zone label ── */}
          <div
            className="absolute z-30 pointer-events-none"
            style={{ top: `${safeZone.top + 1.5}%`, left: 8 }}
          >
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider text-green-300/70 bg-black/30 backdrop-blur-sm border border-green-400/20">
              <span className="w-1 h-1 rounded-full bg-green-400/70 inline-block" />
              Safe zone
            </span>
          </div>
        </div>

        {/* Side buttons — purely decorative */}
        <div className="absolute -right-[1.5px] top-[22%] w-[3px] h-8 rounded-r-full bg-zinc-600/60" />
        <div className="absolute -left-[1.5px] top-[18%] w-[3px] h-6 rounded-l-full bg-zinc-600/60" />
        <div className="absolute -left-[1.5px] top-[25%] w-[3px] h-10 rounded-l-full bg-zinc-600/60" />
        <div className="absolute -left-[1.5px] top-[38%] w-[3px] h-10 rounded-l-full bg-zinc-600/60" />
      </div>
    </div>
  );
}

// ─── LEGEND ──────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center justify-center gap-5 mt-6">
      <div className="flex items-center gap-2">
        <span className="w-6 h-0 border-t border-dashed border-rose-400/60" />
        <span className="text-[11px] text-zinc-500">Danger zone</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-6 h-0 border-t border-dashed border-green-400/50" />
        <span className="text-[11px] text-zinc-500">Safe zone</span>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function SafeZonePreview({
  imageUrl,
  platform: platformProp,
  mode: modeProp,
  safeZoneConfig,
}: SafeZonePreviewProps) {
  const [platform, setPlatform] = useState<Platform>(platformProp);
  const [mode, setMode] = useState<Mode>(modeProp);

  const resolvedConfig =
    safeZoneConfig ?? DEFAULT_SAFE_ZONE_CONFIGS[platform][mode];

  return (
    <div className="bg-zinc-950 rounded-2xl border border-white/[0.06] p-6 flex flex-col items-center gap-5">
      {/* ── Platform tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-white/[0.05] flex-wrap justify-center">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={[
              "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150",
              platform === p
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300",
            ].join(" ")}
          >
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ── Organic / Paid toggle ── */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-900 border border-white/[0.05]">
        {(["organic", "paid"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={[
              "px-4 py-1 rounded-full text-[11px] font-semibold capitalize transition-all duration-150",
              mode === m
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300",
            ].join(" ")}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ── Phone frame ── */}
      <PhoneFrame
        imageUrl={imageUrl}
        safeZone={resolvedConfig}
        platform={platform}
        mode={mode}
      />

      {/* ── Legend ── */}
      <Legend />
    </div>
  );
}
