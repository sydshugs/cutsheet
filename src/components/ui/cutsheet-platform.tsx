import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeInSection } from "./fade-in";
import { Swords, Trophy, TrendingUp, Wand2, Zap } from "lucide-react";

type TabId = "paid" | "competitor" | "rank" | "rewrite";

/** Per-tab card images — Figma 295:3040 */
const TAB_IMAGES: Record<TabId, string> = {
  paid:       "/landing-platform-product.png",
  competitor: "/Competitor.png",
  rank:       "/RankCreative.png",
  rewrite:    "/AI_Rewrite.png",
};

/**
 * Per-tab image zoom/position — Figma 295:3040.
 * Each image overflows slightly so no transparent edge shows at the rounded corners.
 */
const TAB_IMAGE_STYLE: Record<TabId, React.CSSProperties> = {
  paid:       { position: "absolute", height: "105.44%", left: "-2.42%",  top: "-2.89%",  width: "104.76%", maxWidth: "none" },
  competitor: { position: "absolute", height: "102.27%", left: "-0.84%",  top: "-1.12%",  width: "101.61%", maxWidth: "none" },
  rank:       { position: "absolute", height: "106.34%", left: "-4.39%",  top: "-3.17%",  width: "105.65%", maxWidth: "none" },
  rewrite:    { position: "absolute", height: "103.44%", left: "-1.5%",   top: "-1.72%",  width: "102.77%", maxWidth: "none" },
};

/**
 * Per-tab accent colors — Figma 295:2879
 * Paid Ad: indigo · Competitor: sky · Rank Creatives: amber · AI Rewrite: emerald
 */
const TAB_ACCENTS: Record<TabId, { bg: string; bgOff: string; border: string; borderOff: string; icon: string }> = {
  paid:       { bg: "rgba(97,95,255,0.1)",  bgOff: "rgba(97,95,255,0)",  border: "rgba(97,95,255,0.5)",  borderOff: "rgba(97,95,255,0)",  icon: "rgba(97,95,255,1)"  },
  competitor: { bg: "rgba(14,165,233,0.1)", bgOff: "rgba(14,165,233,0)", border: "rgba(14,165,233,0.5)", borderOff: "rgba(14,165,233,0)", icon: "rgba(14,165,233,1)" },
  rank:       { bg: "rgba(245,158,11,0.1)", bgOff: "rgba(245,158,11,0)", border: "rgba(245,158,11,0.5)", borderOff: "rgba(245,158,11,0)", icon: "rgba(245,158,11,1)" },
  rewrite:    { bg: "rgba(16,185,129,0.1)", bgOff: "rgba(16,185,129,0)", border: "rgba(16,185,129,0.5)", borderOff: "rgba(16,185,129,0)", icon: "rgba(16,185,129,1)" },
};

const TABS: { id: TabId; label: string; icon: typeof Zap }[] = [
  { id: "paid",       label: "Paid Ad",        icon: Zap    },
  { id: "competitor", label: "Competitor",      icon: Swords },
  { id: "rank",       label: "Rank Creatives",  icon: Trophy },
  { id: "rewrite",    label: "AI Rewrite",      icon: Wand2  },
];

/** Copy sourced from Figma 295:3040 */
const TAB_COPY: Record<TabId, { badge: string; title: React.ReactNode; body: string }> = {
  paid: {
    badge: "Paid Ad Analyzer",
    title: "Stop paying to test bad ads",
    body:  "Upload any paid creative — Meta, TikTok, YouTube, Display. Get a score, platform benchmark, and a ranked list of what to fix before you spend a dollar.",
  },
  competitor: {
    badge: "Competitor Analysis",
    title: (
      <>
        See exactly where<br />they&apos;re beating you
      </>
    ),
    body: "Upload your ad alongside a competitor's. Cutsheet scores both, identifies the gap, and builds a prioritized action plan to close it.",
  },
  rank: {
    badge: "Rank Creative",
    title: "Test fewer. Win more.",
    body:  "Upload 5–10 variations. Cutsheet scores them all in parallel and tells you which 2–3 are worth testing — before you burn budget finding out the hard way.",
  },
  rewrite: {
    badge: "AI Rewrite",
    title: "Fix it in seconds, not days",
    body:  "One click rewrites your hook, body copy, and CTA — matched to your platform, format, and brand voice. Paste it straight into your creative brief.",
  },
};

/**
 * Figma 297:1021 — THE PLATFORM section.
 * Tab bar: per-tab accent pill (295:2879). Active icon = accent color, inactive = #71717b.
 * Card: unified dark surface (rgba(255,255,255,0.02)) with absolute-positioned image + copy (295:3040).
 */
export default function CutsheetPlatform() {
  const [active, setActive] = useState<TabId>("paid");
  const copy    = TAB_COPY[active];
  const accent  = TAB_ACCENTS[active];
  const ActiveIcon = TABS.find((t) => t.id === active)!.icon;

  return (
    <section
      id="platform"
      className="relative w-full overflow-hidden border-t text-white"
      style={{
        backgroundColor: "var(--bg)",
        borderColor: "rgba(255,255,255,0.04)",
        fontFamily: "var(--sans)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-20 lg:gap-16 lg:px-8 lg:py-[112px] xl:px-[109px]">

        {/* ── Header — Figma 297:1022 ─────────────────────────────────────── */}
        <FadeInSection>
        <header className="flex w-full flex-col items-center gap-3 text-center">
          <p style={{
            fontFamily: "var(--sans)", fontWeight: 600, fontSize: "12.1px",
            lineHeight: "18.15px", letterSpacing: "2.42px", color: "var(--landing-eyebrow)",
            textTransform: "uppercase",
          }}>
            THE PLATFORM
          </p>
          <h2 className="text-balance text-center text-[24px] font-bold leading-[1.2] sm:text-[30px] lg:text-[36px] lg:leading-[54px]" style={{
            fontFamily: "var(--sans)", color: "#f4f4f5",
          }}>
            Everything you need to ship better ads
          </h2>
          <p style={{
            fontFamily: "var(--sans)", fontWeight: 400, fontSize: "16px",
            lineHeight: "24px", color: "#a1a1aa", textAlign: "center",
          }}>
            Score it. Fix it. Rank it. Compare it. All before you spend.
          </p>
        </header>
        </FadeInSection>

        {/* ── Tab bar — Figma 295:2879 ──────────────────────────────────────── */}
        <FadeInSection delay={0.1} className="w-full flex justify-center">
          {/* Mobile tab bar (< lg): Figma 393:2547 — compact pill, all 4 tabs */}
          <div
            className="flex lg:hidden rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "0.961px" }}
            role="tablist"
            aria-label="Platform tools"
          >
            {TABS.map((tab) => {
              const Icon      = tab.icon;
              const isOn      = active === tab.id;
              const tabAccent = TAB_ACCENTS[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isOn}
                  onClick={() => setActive(tab.id)}
                  className="relative flex cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
                  style={{ gap: "2.401px", paddingTop: "4.083px", paddingBottom: "4.083px", paddingLeft: "10.326px", paddingRight: "10.567px" }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{ backgroundColor: isOn ? tabAccent.bg : tabAccent.bgOff, borderColor: isOn ? tabAccent.border : tabAccent.borderOff }}
                    style={{ border: "0.24px solid", boxShadow: "0px 0.48px 0.24px rgba(0,0,0,0.1)" }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                  />
                  <Icon aria-hidden className="relative z-10 shrink-0" style={{ width: "6.277px", height: "6.277px", color: isOn ? tabAccent.icon : "#71717b", transition: "color 0.18s ease" }} />
                  <span className="relative z-10 whitespace-nowrap" style={{ fontFamily: "var(--sans)", fontWeight: 400, fontSize: "6.59px", lineHeight: "normal", color: isOn ? "#ffffff" : "#71717b", transition: "color 0.18s ease" }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop tab bar (lg+): larger proportions */}
          <div
            className="hidden lg:flex w-full max-w-[769px] rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "2.887px" }}
            role="tablist"
            aria-label="Platform tools"
          >
            {TABS.map((tab) => {
              const Icon      = tab.icon;
              const isOn      = active === tab.id;
              const tabAccent = TAB_ACCENTS[tab.id];
              return (
                <button
                  key={`desktop-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isOn}
                  onClick={() => setActive(tab.id)}
                  className="relative flex flex-1 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                  style={{ gap: "6px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px" }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{ backgroundColor: isOn ? tabAccent.bg : tabAccent.bgOff, borderColor: isOn ? tabAccent.border : tabAccent.borderOff }}
                    style={{ border: "0.722px solid", boxShadow: "0px 1.443px 0.722px rgba(0,0,0,0.1)" }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                  />
                  <Icon aria-hidden className="relative z-10 shrink-0" style={{ width: "15px", height: "15px", color: isOn ? tabAccent.icon : "#71717b", transition: "color 0.18s ease" }} />
                  <span className="relative z-10 whitespace-nowrap text-[19.812px]" style={{ fontFamily: "var(--sans)", fontWeight: 400, lineHeight: "normal", color: isOn ? "#ffffff" : "#71717b", transition: "color 0.18s ease" }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </FadeInSection>

        {/* ── Card — Figma 295:3040 ─────────────────────────────────────────── */}
        <FadeInSection delay={0.2} className="w-full flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            role="tabpanel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full max-w-[1064px]"
            style={{ background: "rgba(255,255,255,0.02)", borderRadius: "16.48px" }}
          >

            {/* ── Mobile layout (< lg): Figma 393:2548 — compact 297×109px card ── */}
            <div className="flex lg:hidden" style={{ borderRadius: "16.48px", overflow: "hidden", height: "108.9px", maxWidth: "297px", margin: "0 auto" }}>
              {/* Left: image fills ~49% */}
              <div className="relative overflow-hidden" style={{ width: "49.4%", borderRadius: "16.48px 0 0 16.48px" }}>
                <img
                  src={TAB_IMAGES[active]}
                  alt={`${copy.badge} feature preview`}
                  className="absolute inset-0 size-full object-cover pointer-events-none"
                  style={{ height: "151.77%", left: "-38.91%", top: "-30.48%", width: "142.65%", maxWidth: "none" }}
                  decoding="async"
                />
              </div>
              {/* Right: copy — Figma 393:2548 right panel */}
              <div
                className="flex flex-1 flex-col items-start justify-center"
                style={{ gap: "7.808px", padding: "2.51% 0 2.38% 8.366px", minWidth: 0 }}
              >
                {/* Badge */}
                <div
                  className="inline-flex items-center"
                  style={{
                    gap: "3.145px",
                    height: "6.414px",
                    paddingLeft: "5.996px", paddingRight: "6.135px",
                    paddingTop: "2.37px", paddingBottom: "2.37px",
                    backgroundColor: accent.bg,
                    border: `0.139px solid ${accent.border}`,
                    borderRadius: "249.765px",
                    boxShadow: "0px 0.279px 0.139px rgba(0,0,0,0.1)",
                    flexShrink: 0,
                  }}
                >
                  <ActiveIcon aria-hidden style={{ width: "3.645px", height: "4.049px", flexShrink: 0, color: accent.icon }} />
                  <span style={{ fontFamily: "var(--sans)", fontWeight: 400, fontSize: "3.45px", lineHeight: "normal", color: "white", whiteSpace: "nowrap" }}>
                    {copy.badge}
                  </span>
                </div>
                {/* Title + body */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3.068px", minWidth: 0 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: "8.78px", lineHeight: 1.1, letterSpacing: "-0.132px", color: "white", margin: 0 }}>
                    {copy.title}
                  </h3>
                  <p style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "4.72px", lineHeight: 1.25, letterSpacing: "-0.024px", color: "#b6b6b6", margin: 0, maxWidth: "114.617px" }}>
                    {copy.body}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Desktop layout — exact Figma absolute positioning ──────────── */}
            <div className="relative hidden lg:block" style={{ height: "390.133px" }}>

              {/* Image — Figma: absolute left-7px top-9px, 528.5×372.55px */}
              <div
                className="absolute overflow-hidden"
                style={{ left: "7px", top: "9px", width: "528.5px", height: "372.55px", borderRadius: "16.48px" }}
              >
                <img
                  src={TAB_IMAGES[active]}
                  alt={`${copy.badge} feature preview`}
                  style={TAB_IMAGE_STYLE[active]}
                  decoding="async"
                  loading="eager"
                />

                {/* ── Paid Ad stats overlay — Figma 295:953 ─────────────────── */}
                {active === "paid" && (
                  <>
                    {/* PREDICTED PERFORMANCE + High confidence badge — 295:992
                        Grid offset: ml-39.96px mt-27.2px → absolute (39.96, 27.2) */}
                    <div
                      className="absolute flex items-center justify-between"
                      style={{ left: "39.96px", top: "27.2px", width: "255.566px", height: "23.353px" }}
                    >
                      <span style={{
                        fontFamily: "var(--sans)", fontWeight: 600, fontSize: "8.813px",
                        color: "white", letterSpacing: "1.0575px", textTransform: "uppercase",
                        lineHeight: "13.219px", whiteSpace: "nowrap",
                      }}>PREDICTED PERFORMANCE</span>
                      <div style={{
                        background: "rgba(0,188,125,0.1)", border: "0.881px solid rgba(0,188,125,0.2)",
                        borderRadius: "5.288px", height: "23.353px", width: "92.973px",
                        display: "flex", alignItems: "center", paddingLeft: "7.05px",
                      }}>
                        <span style={{
                          fontFamily: "var(--sans)", fontWeight: 500, fontSize: "9.694px",
                          color: "#00d492", letterSpacing: "0.2423px", whiteSpace: "nowrap",
                        }}>High confidence</span>
                      </div>
                    </div>

                    {/* EST. CTR label + value — 295:974
                        Grid: 295:953 at ml-24.98 mt-61.89; 295:974 at left-14.99 top-(-11.99)
                        Absolute: (24.98+14.99, 61.89-11.99) = (39.97, 49.9) */}
                    <div className="absolute" style={{ left: "39.97px", top: "49.9px", width: "255.566px" }}>
                      <span style={{
                        display: "block", fontFamily: "var(--sans)", fontWeight: 600,
                        fontSize: "9.694px", color: "white", letterSpacing: "1.1633px",
                        textTransform: "uppercase", lineHeight: "14.541px",
                      }}>EST. CTR</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "7.05px", position: "relative" }}>
                        <span style={{
                          fontFamily: "var(--sans)", fontWeight: 700, fontSize: "28.2px",
                          color: "#f4f4f5", letterSpacing: "-0.705px", lineHeight: "28.2px", whiteSpace: "nowrap",
                        }}>
                          0.8%{" "}
                          <span style={{ fontWeight: 500, fontSize: "21.15px" }}>–</span>
                          {" "}1.4%
                        </span>
                        {/* 295:981: left-162.5 top-30.4 within 295:974 */}
                        <span style={{
                          position: "absolute", left: "162.5px", top: "30.4px",
                          fontFamily: "var(--sans)", fontWeight: 500, fontSize: "10.575px",
                          color: "white", lineHeight: "15.863px", whiteSpace: "nowrap",
                        }}>YouTube avg · 0.6%</span>
                      </div>
                    </div>

                    {/* Progress bar 0%→3%+ — 295:984
                        Absolute: (39.97, 113.79) */}
                    <div className="absolute" style={{ left: "39.97px", top: "113.79px", width: "255.566px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "8.813px", color: "white", lineHeight: "13.219px" }}>0%</span>
                        <span style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "8.813px", color: "#00d492", lineHeight: "13.219px" }}>3%+</span>
                      </div>
                      <div style={{ position: "relative", marginTop: "8.931px", height: "3.525px", borderRadius: "999px", background: "rgba(255,255,255,0.5)" }}>
                        <div style={{ position: "absolute", left: "67.98px", top: 0, width: "51.113px", height: "3.525px", background: "#6366f1", borderRadius: "999px" }} />
                        <div style={{ position: "absolute", left: "51.11px", top: "-3.525px", width: "1.763px", height: "10.575px", background: "white" }} />
                      </div>
                    </div>

                    {/* Right stat cards: Creative Fatigue + CVR Potential — 295:954
                        Absolute: (415.61, 31.92) */}
                    <div
                      className="absolute flex flex-col"
                      style={{ left: "415.61px", top: "31.92px", width: "99.779px", gap: "17.983px" }}
                    >
                      <div style={{
                        background: "rgba(39,39,42,0.2)", border: "0.5px solid rgba(255,255,255,0.1)",
                        borderRadius: "17.48px", padding: "12.153px",
                        display: "flex", flexDirection: "column", gap: "5.827px",
                        height: "74.288px", boxSizing: "border-box",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4.37px" }}>
                          <Zap aria-hidden style={{ width: "7px", height: "10px", color: "white", flexShrink: 0 }} />
                          <span style={{
                            fontFamily: "var(--sans)", fontWeight: 600, fontSize: "8.011px",
                            color: "white", letterSpacing: "0.9614px", textTransform: "uppercase", lineHeight: "12.017px",
                          }}>CREATIVE FATIGUE</span>
                        </div>
                        <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: "13.11px", color: "#e4e4e7", lineHeight: "19.665px" }}>~14 days</span>
                      </div>
                      <div style={{
                        background: "rgba(39,39,42,0.2)", border: "0.5px solid rgba(255,255,255,0.1)",
                        borderRadius: "17.48px", padding: "12.153px",
                        display: "flex", flexDirection: "column", gap: "5.827px",
                        height: "74.288px", boxSizing: "border-box",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4.37px" }}>
                          <TrendingUp aria-hidden style={{ width: "9px", height: "10px", color: "white", flexShrink: 0 }} />
                          <span style={{
                            fontFamily: "var(--sans)", fontWeight: 600, fontSize: "8.011px",
                            color: "white", letterSpacing: "0.9614px", textTransform: "uppercase", lineHeight: "12.017px",
                          }}>CVR POTENTIAL</span>
                        </div>
                        <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: "13.11px", color: "#e4e4e7", lineHeight: "19.665px" }}>1.2% – 2.1%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ── Copy panel — Figma 295:3040 right panel ───────────────────── */}
              {/* Absolute: left-535.5px top-8.74px, 521.51×372.65px */}
              <div
                className="absolute flex flex-col items-start justify-center"
                style={{
                  left: "535.5px", top: "8.74px",
                  width: "521.51px", height: "372.65px",
                  padding: "0 29.972px",
                  gap: "27.974px",
                }}
              >
                {/* Badge pill — Figma 295:942 */}
                <div
                  className="inline-flex items-center"
                  style={{
                    gap: "4.496px", height: "22.978px",
                    paddingLeft: "21.48px", paddingRight: "21.979px",
                    paddingTop: "8.492px", paddingBottom: "8.492px",
                    backgroundColor: accent.bg, border: `0.5px solid ${accent.border}`,
                    borderRadius: "249.765px", boxShadow: "0px 0.999px 0.5px rgba(0,0,0,0.1)",
                    flexShrink: 0,
                  }}
                >
                  <ActiveIcon aria-hidden style={{ width: "13.058px", height: "14.507px", flexShrink: 0, color: accent.icon }} />
                  <span style={{ fontFamily: "var(--sans)", fontWeight: 400, fontSize: "12.342px", lineHeight: "normal", color: "white" }}>
                    {copy.badge}
                  </span>
                </div>

                {/* Text block — Figma 295:946 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10.99px" }}>
                  <h3 style={{
                    fontFamily: "var(--sans)", fontWeight: 700, fontSize: "31.46px",
                    lineHeight: 1.1, letterSpacing: "-0.4719px", color: "white",
                  }}>
                    {copy.title}
                  </h3>
                  <p style={{
                    fontFamily: "var(--sans)", fontWeight: 500, fontSize: "16.924px",
                    lineHeight: 1.25, letterSpacing: "-0.0846px",
                    color: "#b6b6b6", maxWidth: "410.614px",
                  }}>
                    {copy.body}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
        </FadeInSection>

      </div>
    </section>
  );
}
