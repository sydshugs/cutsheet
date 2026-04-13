// DisplayAnalyzerMockup.tsx — Interactive in-situ placement mockup
// Shows the uploaded display ad in a realistic browser/mobile context
// Supports format switching: 300×250, 728×90, 160×600, 300×600, 320×50
// Replaces the server-side canvas mockup with a live client-side preview

import React, { useState } from 'react';
import { Monitor, Download, Plus, Signal, Wifi, BatteryMedium } from 'lucide-react';

const FORMATS = [
  "300×250 Rectangle",
  "728×90 Leaderboard",
  "160×600 Skyscraper",
  "300×600 Half Page",
  "320×50 Mobile",
] as const;

type AdFormat = typeof FORMATS[number];

const FORMAT_KEY_MAP: Record<string, AdFormat> = {
  "300x250": "300×250 Rectangle",
  "728x90":  "728×90 Leaderboard",
  "160x600": "160×600 Skyscraper",
  "300x600": "300×600 Half Page",
  "320x50":  "320×50 Mobile",
};

interface DisplayAnalyzerMockupProps {
  imageSrc: string;
  onDownload?: () => void;
  detectedFormatKey?: string;
  onSwitchToSuite?: () => void;
}

// Per-format metadata
const FORMAT_META: Record<AdFormat, {
  detected: string;
  desc: string;
  pillText: string;
  pillStyle: React.CSSProperties;
  bottomPill: string;
  bottomDesc: string;
}> = {
  "320×50 Mobile": {
    detected: "320×50 detected",
    desc: "Mobile Banner · Sticky bottom placement",
    pillText: "Mobile-first format",
    pillStyle: { background: "rgba(14,165,233,0.08)", color: "#38bdf8" },
    bottomPill: "320×50 · Mobile Banner",
    bottomDesc: "Bottom of mobile screen",
  },
  "300×600 Half Page": {
    detected: "300×600 detected",
    desc: "Half Page · Right column, large format",
    pillText: "Premium placement",
    pillStyle: { background: "rgba(139,92,246,0.08)", color: "#a78bfa" },
    bottomPill: "300×600 · Half Page",
    bottomDesc: "Right column, premium placement",
  },
  "160×600 Skyscraper": {
    detected: "160×600 detected",
    desc: "Wide Skyscraper · Right rail sidebar",
    pillText: "Strong viewability",
    pillStyle: { background: "rgba(16,185,129,0.08)", color: "#34d399" },
    bottomPill: "160×600 · Wide Skyscraper",
    bottomDesc: "Right rail, full height",
  },
  "728×90 Leaderboard": {
    detected: "728×90 detected",
    desc: "Leaderboard · Top of page, above content",
    pillText: "High visibility placement",
    pillStyle: { background: "rgba(16,185,129,0.08)", color: "#34d399" },
    bottomPill: "728×90 · Leaderboard",
    bottomDesc: "Top of page, above content",
  },
  "300×250 Rectangle": {
    detected: "300×250 detected",
    desc: "Medium Rectangle · Right sidebar, mid-article",
    pillText: "Most common GDN format",
    pillStyle: { background: "rgba(16,185,129,0.08)", color: "#34d399" },
    bottomPill: "300×250 · Medium Rectangle",
    bottomDesc: "Right sidebar, mid-article",
  },
};

export const DisplayAnalyzerMockup: React.FC<DisplayAnalyzerMockupProps> = ({ imageSrc, onDownload, detectedFormatKey, onSwitchToSuite }) => {
  const [activeFormat, setActiveFormat] = useState<AdFormat>(
    (detectedFormatKey && FORMAT_KEY_MAP[detectedFormatKey]) || "300×250 Rectangle"
  );
  const [viewMode, setViewMode] = useState<"single" | "suite">("single");
  const meta = FORMAT_META[activeFormat];

  return (
    <div className="w-full flex flex-col gap-4">

      {/* Row 1 — Format tabs (left) + Single/Suite toggle (right) */}
      <div className="flex items-center justify-between gap-4">
        <div className="overflow-x-auto flex gap-2 flex-nowrap shrink" style={{ scrollbarWidth: "none" }}>
          {FORMATS.map((format) => {
            const isActive = activeFormat === format;
            return (
              <button
                key={format}
                onClick={() => setActiveFormat(format)}
                className="whitespace-nowrap px-3 py-1 text-xs rounded-full transition-colors"
                style={isActive ? {
                  background: "rgba(6,182,212,0.10)",
                  border: "1px solid rgba(6,182,212,0.25)",
                  color: "#06b6d4",
                  fontWeight: 500,
                } : {
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#52525b",
                  background: "transparent",
                }}
              >
                {format}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 shrink-0">
          {(["single", "suite"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (m === "suite" && onSwitchToSuite) {
                  onSwitchToSuite();
                } else {
                  setViewMode(m);
                }
              }}
              className="rounded-full px-3 py-1 text-xs transition-colors"
              style={viewMode === m ? {
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#e4e4e7",
              } : {
                border: "1px solid rgba(255,255,255,0.04)",
                color: "#52525b",
                background: "transparent",
              }}
            >
              {m === "single" ? "Single Ad" : "Suite View"}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2 — In-situ mockup */}
      <div>
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "#0f0f12", overflow: "hidden" }}>
          {activeFormat === "320×50 Mobile" ? (
            <MobileMockup imageSrc={imageSrc} />
          ) : (
            <BrowserMockup imageSrc={imageSrc} format={activeFormat} viewMode={viewMode} />
          )}
        </div>

        {/* Below-mockup info + suite chips */}
        <div className="flex flex-col gap-3 mt-3 px-1">
          {viewMode === "suite" && (
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#52525b", marginRight: 4 }}>ADD SIZES:</span>
              {["+ 160×600", "+ 300×600", "+ 320×50"].map((label) => (
                <button
                  key={label}
                  style={{ fontSize: 10, color: "#71717a", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 9999, padding: "4px 10px", background: "transparent", cursor: "pointer", transition: "color 150ms, border-color 150ms" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#d4d4d8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Format detected banner */}
          <div style={{ borderRadius: 12, border: "1px solid rgba(6,182,212,0.20)", background: "rgba(6,182,212,0.04)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <Monitor size={14} color="#06b6d4" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#e4e4e7" }}>{meta.detected}</span>
            <span style={{ fontSize: 12, color: "#71717a" }} className="hidden sm:inline">{meta.desc}</span>
            <span style={{ marginLeft: "auto", whiteSpace: "nowrap", fontSize: 10, borderRadius: 9999, padding: "2px 8px", ...meta.pillStyle }}>
              {meta.pillText}
            </span>
          </div>

          {/* Download row */}
          <div className="flex items-center justify-end">
            <button
              onClick={onDownload}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#71717a", background: "transparent", border: "none", cursor: "pointer", transition: "color 150ms" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#d4d4d8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#71717a"; }}
            >
              <Download size={12} />
              <span>Download mockup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Mobile mockup (320×50) ────────────────────────────────────────────────────

function MobileMockup({ imageSrc }: { imageSrc: string }) {
  return (
    <div className="flex flex-col items-center py-10 px-4 w-full">
      <div style={{
        width: 320, height: 640, borderRadius: 40, border: "8px solid #27272a",
        background: "#f9fafb", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)", flexShrink: 0,
      }}>
        {/* Status bar */}
        <div style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "#f9fafb", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#27272a" }}>9:41</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#27272a" }}>
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Article */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16, flex: 1, overflowY: "auto" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.4, margin: 0 }}>
            Global Markets Rally as Tech Sector Shows Unexpected Growth in Q3
          </h2>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.625, margin: 0 }}>
            As we move further into the decade, digital consumption habits continue to evolve rapidly.
            Users are presented with an unprecedented amount of content.
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.625, margin: 0 }}>
            Publishers and advertisers alike are finding that native integration and context-aware
            placements yield significantly higher engagement rates.
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.625, margin: 0 }}>
            Brands that fail to capture attention within the first three seconds risk losing their
            audience entirely to competitors with more dynamic content strategies.
          </p>
        </div>

        {/* Sticky ad strip */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", background: "white", borderTop: "1px solid #e5e7eb", paddingTop: 4, paddingBottom: 8 }}>
          <span style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 4 }}>ADVERTISEMENT</span>
          <div style={{ width: "100%", height: 50, background: "#18181b", position: "relative" }}>
            <img src={imageSrc} alt="320×50 Ad Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", top: 4, left: 4, fontSize: 7, background: "rgba(255,255,255,0.8)", color: "#6b7280", borderRadius: 3, padding: "1px 4px", fontWeight: 500 }}>Ad</div>
          </div>
          <div style={{ width: 100, height: 4, background: "#d1d5db", borderRadius: 9999, marginTop: 8 }} />
        </div>
      </div>
      <div style={{ marginTop: 20, fontSize: 10, color: "#52525b" }}>Sticky placement · Fixed to bottom of screen</div>
    </div>
  );
}

// ── Browser mockup (all desktop formats) ──────────────────────────────────────

function BrowserMockup({ imageSrc, format, viewMode }: {
  imageSrc: string;
  format: AdFormat;
  viewMode: "single" | "suite";
}) {
  return (
    <>
      {/* Fake browser chrome */}
      <div style={{ background: "#f0f0f0", borderBottom: "1px solid #d4d4d4", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(239,68,68,0.5)" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(245,158,11,0.5)" }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(34,197,94,0.5)" }} />
        </div>
        <div style={{ margin: "0 auto", borderRadius: 4, background: "white", border: "1px solid #e5e7eb", padding: "4px 12px", fontSize: 10, color: "#9ca3af", width: "50%", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          news.example.com/article
        </div>
      </div>

      {/* Article layout */}
      <div style={{ padding: 24, background: "#f9fafb", minHeight: 640 }}>
        {format === "300×600 Half Page" && <HalfPageLayout imageSrc={imageSrc} />}
        {format === "160×600 Skyscraper" && <SkyscraperLayout imageSrc={imageSrc} />}
        {format === "728×90 Leaderboard" && <LeaderboardLayout imageSrc={imageSrc} viewMode={viewMode} />}
        {format === "300×250 Rectangle" && <RectangleLayout imageSrc={imageSrc} viewMode={viewMode} />}
      </div>
    </>
  );
}

// ── Layout variants ────────────────────────────────────────────────────────────

function AdLabel({ style }: { style?: React.CSSProperties }) {
  return (
    <span style={{ position: "absolute", top: 4, left: 4, fontSize: 7, background: "rgba(255,255,255,0.85)", color: "#6b7280", borderRadius: 3, padding: "1px 4px", fontWeight: 500, zIndex: 10, ...style }}>Ad</span>
  );
}

function AdvertisementCaption() {
  return <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", textAlign: "center", display: "block", marginBottom: 4 }}>ADVERTISEMENT</span>;
}

function ArticleBody({ paragraphs = 3 }: { paragraphs?: number }) {
  const texts = [
    "As we move further into the decade, digital consumption habits continue to evolve rapidly. Users are presented with an unprecedented amount of content, leading to a significant decrease in average focus time.",
    "Brands that fail to capture attention within the first three seconds risk losing their audience entirely to competitors with more dynamic content strategies. Marketers are increasingly focusing on \"micro-moments\".",
    "Publishers and advertisers alike are finding that native integration and context-aware placements yield significantly higher engagement rates. The key is providing immediate value.",
    "Furthermore, the rise of short-form video and transient social media formats has conditioned users to expect rapid delivery of information.",
  ];
  return (
    <>
      {texts.slice(0, paragraphs).map((t, i) => (
        <p key={i} style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.625, margin: "0 0 12px" }}>{t}</p>
      ))}
    </>
  );
}

function HalfPageLayout({ imageSrc }: { imageSrc: string }) {
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 8 }}>By Sarah Chen · 4 min read</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.35, margin: "0 0 16px" }}>
          The Evolution of Digital Consumption: Why Short-Form Media is the New Standard
        </h2>
        <ArticleBody paragraphs={4} />
      </div>
      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <AdvertisementCaption />
        <div style={{ width: "100%", aspectRatio: "300/600", borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb", position: "relative", background: "#18181b", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <img src={imageSrc} alt="300×600 Ad" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <AdLabel />
        </div>
        <div style={{ width: "100%", marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Related</div>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 8, cursor: "pointer" }}>How AI is shaping the future of ad creatives in 2026</div>
          <div style={{ height: 1, background: "#e5e7eb", marginBottom: 8 }} />
          <div style={{ fontSize: 10, color: "#6b7280", cursor: "pointer" }}>Top 5 strategies for maintaining consumer attention</div>
        </div>
      </div>
    </div>
  );
}

function SkyscraperLayout({ imageSrc }: { imageSrc: string }) {
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.35, margin: "0 0 20px" }}>
          The Evolution of Digital Consumption: Why Short-Form Media is the New Standard
        </h2>
        <ArticleBody paragraphs={4} />
      </div>
      <div style={{ width: 160, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        <AdvertisementCaption />
        <div style={{ width: "100%", aspectRatio: "160/600", borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb", position: "relative", background: "#18181b", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <img src={imageSrc} alt="160×600 Ad" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <AdLabel />
        </div>
        <div style={{ width: 2, height: 48, background: "linear-gradient(to bottom, #e5e7eb, transparent)", marginTop: 8 }} />
      </div>
    </div>
  );
}

function LeaderboardLayout({ imageSrc, viewMode }: { imageSrc: string; viewMode: "single" | "suite" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <AdvertisementCaption />
        <div style={{ width: "100%", height: 60, borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb", position: "relative", background: "#18181b" }}>
          <img src={imageSrc} alt="728×90 Ad" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <AdLabel />
        </div>
      </div>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", lineHeight: 1.35, margin: "0 0 12px" }}>
          Global Markets Rally as Tech Sector Shows Unexpected Growth in Q3
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#6b7280", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: "8px 0", marginBottom: 16 }}>
          {["News", "Sports", "Finance", "Tech"].map((tab, i) => (
            <React.Fragment key={tab}>
              {i > 0 && <div style={{ width: 1, height: 12, background: "#d1d5db" }} />}
              <span style={{ cursor: "pointer", fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#111827" : undefined }}>{tab}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          {[100, 100, 80, 100, 100, 90, 100, 60].map((w, i) => (
            <div key={i} style={{ height: 12, background: "#e5e7eb", borderRadius: 2, marginBottom: 12, width: `${w}%` }} />
          ))}
        </div>
        <div style={{ width: 160, flexShrink: 0 }}>
          {viewMode === "suite" ? (
            <div style={{ width: "100%", aspectRatio: "300/250", border: "1px dashed #d1d5db", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(243,244,246,0.5)", cursor: "pointer" }}>
              <Plus style={{ width: 16, height: 16, color: "#9ca3af", marginBottom: 4 }} />
              <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 500, textAlign: "center", padding: "0 8px" }}>Add rectangle<br />(300×250)</span>
            </div>
          ) : (
            <div style={{ width: "100%", aspectRatio: "300/250", background: "#e5e7eb", borderRadius: 4 }} />
          )}
          <div style={{ width: "100%", height: 100, background: "#e5e7eb", borderRadius: 4, marginTop: 16 }} />
        </div>
      </div>
    </div>
  );
}

function RectangleLayout({ imageSrc, viewMode }: { imageSrc: string; viewMode: "single" | "suite" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {viewMode === "suite" && (
        <div style={{ width: "100%", height: 90, border: "1px dashed #d1d5db", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(243,244,246,0.5)", cursor: "pointer" }}>
          <Plus style={{ width: 16, height: 16, color: "#9ca3af", marginBottom: 4 }} />
          <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 500 }}>Add leaderboard (728×90)</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.35, margin: "0 0 16px" }}>
            Why consumer attention spans are shorter than ever in 2026
          </h2>
          <ArticleBody paragraphs={4} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", margin: "0 0 12px" }}>The Shift to Micro-Moments</h3>
          <ArticleBody paragraphs={2} />
        </div>
        <div style={{ width: 160, flexShrink: 0, paddingTop: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <AdvertisementCaption />
          <div style={{ width: "100%", aspectRatio: "300/250", borderRadius: 2, overflow: "hidden", border: "1px solid #e5e7eb", position: "relative", background: "#18181b" }}>
            <img src={imageSrc} alt="300×250 Ad" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            <AdLabel />
          </div>
        </div>
      </div>
    </div>
  );
}
