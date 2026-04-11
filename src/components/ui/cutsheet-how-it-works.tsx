import React, { useState } from "react";
import { motion } from "framer-motion";
import { FadeInSection } from "./fade-in";

// Figma asset URLs — refreshed 2026-04-10
const UPLOAD_ICON_IMG = "https://www.figma.com/api/mcp/asset/1448d814-2e4a-49ac-95cf-774705718907";
const UPLOAD_PTR_IMG  = "https://www.figma.com/api/mcp/asset/3607f84f-b9e1-4c18-a968-d7fb435d7bd0";
const UPLOAD_JPG_IMG  = "https://www.figma.com/api/mcp/asset/3d7a2905-1c12-4ab6-8fbc-f9bf484fe147";
const SCORE_MOCK_IMG  = "https://www.figma.com/api/mcp/asset/b11bb6c3-68c2-4b85-bc2b-bfc98ea3e1e2";
const FIX_MOCK_IMG    = "https://www.figma.com/api/mcp/asset/66d03963-4afc-4698-bd48-020f1b066d49";

// Figma 295:3219 — exact bento sizing
const ACTIVE_W = 516.8;
const NARROW_W = 255.36;
const CARD_H   = 344.415;
const GAP      = 4.618;
const EASE     = [0.16, 1, 0.3, 1] as const;

// ── Mockup: Step 01 — Upload UI ───────────────────────────────────────────────
function UploadMock() {
  return (
    <div className="relative shrink-0" style={{ width: 262.453, height: 296.664 }}>
      {/* Dark panel */}
      <div
        className="absolute rounded-[14.224px]"
        style={{ backgroundColor: "#09090b", left: 36.48, bottom: 0, width: 225.973, height: 296.664 }}
      />
      {/* Title */}
      <p
        className="absolute font-semibold text-white"
        style={{ fontFamily: "var(--sans)", left: 77.06, top: 15.24, width: 145.552, fontSize: 16.294, lineHeight: "24.441px" }}
      >
        Score your paid ad
      </p>
      {/* Subtitle */}
      <p
        className="absolute text-center"
        style={{ fontFamily: "var(--sans)", left: 54.57, top: 40.74, width: 190.691, fontSize: 9.332, lineHeight: "14.931px", color: "#71717b" }}
      >
        Upload a video or static creative. Get a full AI breakdown in 30 seconds.
      </p>
      {/* Dropzone */}
      <div
        className="absolute rounded-[14.63px]"
        style={{ left: 49.65, top: 79.25, width: 199.627, height: 199.131, backgroundColor: "rgba(255,255,255,0.02)", border: "0.914px solid rgba(255,255,255,0.06)" }}
      >
        <img
          src={UPLOAD_ICON_IMG} alt="" aria-hidden draggable={false}
          className="absolute select-none pointer-events-none"
          style={{ left: 89.33, top: 40.64, width: 23.042, height: 23.042 }}
        />
        <p
          className="absolute font-medium text-white"
          style={{ fontFamily: "var(--sans)", left: 49.62, top: 83.02, fontSize: 12.344, lineHeight: "18.516px", whiteSpace: "nowrap" }}
        >
          Drop your ad here
        </p>
        <p
          className="absolute"
          style={{ fontFamily: "var(--sans)", left: 64.84, top: 106.89, fontSize: 10.698, lineHeight: "16.047px", color: "#818cf8", whiteSpace: "nowrap" }}
        >
          or browse files
        </p>
        <p
          className="absolute"
          style={{ fontFamily: "var(--sans)", left: 15.57, top: 142.68, fontSize: 9.875, lineHeight: "14.813px", color: "#52525c", whiteSpace: "nowrap" }}
        >
          MP4 · MOV · JPG · PNG · up to 500MB
        </p>
      </div>
      {/* Cursor arrow */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 8.38, top: 100.26, width: 34.359, height: 34.449 }}
      >
        <img
          src={UPLOAD_PTR_IMG} alt="" aria-hidden draggable={false}
          className="select-none pointer-events-none"
          style={{ width: 24.353, height: 24.351, transform: "rotate(132.36deg) skewX(-0.15deg)" }}
        />
      </div>
      {/* JPG badge */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 0, right: 180.95, bottom: 84.03, height: 93.764 }}
      >
        <img
          src={UPLOAD_JPG_IMG} alt="" aria-hidden draggable={false}
          className="select-none pointer-events-none"
          style={{ width: 79.909, height: 62.457, transform: "rotate(105.48deg) skewX(-0.08deg)" }}
        />
      </div>
    </div>
  );
}

// ── Mockup: Step 02 — Scorecard ───────────────────────────────────────────────
function ScorecardMock() {
  return (
    <div className="relative shrink-0" style={{ width: 225.973, height: 311.037 }}>
      <div
        className="absolute rounded-[14.224px]"
        style={{ backgroundColor: "#09090b", bottom: 14.37, left: 0, width: 225.973, height: 296.664 }}
      />
      <img
        src={SCORE_MOCK_IMG} alt="" aria-hidden draggable={false}
        className="absolute select-none pointer-events-none"
        style={{ left: 12.8, top: 16.04, width: 199.5, height: 295, objectFit: "cover" }}
      />
    </div>
  );
}

// ── Mockup: Step 03 — Fix Audit ───────────────────────────────────────────────
function FixListMock() {
  return (
    <div className="relative shrink-0" style={{ width: 271.5, height: 296.664 }}>
      <div
        className="absolute rounded-[14.224px]"
        style={{ backgroundColor: "#09090b", left: 31, bottom: 0, width: 225.973, height: 296.664 }}
      />
      <img
        src={FIX_MOCK_IMG} alt="" aria-hidden draggable={false}
        className="absolute select-none pointer-events-none"
        style={{ left: 0, top: 13.38, width: 271.5, height: 269.5, objectFit: "cover" }}
      />
    </div>
  );
}

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  {
    number: "01",
    badgeColor: "#6366f1",
    badgeBg: "rgba(99,102,241,0.15)",
    title: "Upload any creative",
    desc: "Video, static, or GIF. TikTok, Meta, YouTube, Display. Drop it in — Cutsheet auto-detects the format.",
    mockup: <UploadMock />,
    mockupGap: 7.389,
  },
  {
    number: "02",
    badgeColor: "#00d492",
    badgeBg: "rgba(0,212,146,0.15)",
    title: "See how you stack up",
    desc: "Overall score, dimension breakdown, and how you stack up against platform averages. No guessing.",
    mockup: <ScorecardMock />,
    mockupGap: 44.333,
  },
  {
    number: "03",
    badgeColor: "#0ea5e9",
    badgeBg: "rgba(14,165,233,0.15)",
    title: "Know exactly what to fix",
    desc: "Priority fix, AI rewrite, and a full creative brief. Ranked by impact so you know what to tackle first.",
    mockup: <FixListMock />,
    mockupGap: 0,
    absoluteMockup: true,
  },
];

// ── Main component ────────────────────────────────────────────────────────────
/**
 * Figma 295:3219 — HOW IT WORKS section.
 * Desktop: active card expands from 255.36 → 516.8px (framer-motion).
 * Mobile: all cards stacked vertically, mockups always visible.
 */
export default function CutsheetHowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section
      id="how-it-works"
      className="relative w-full overflow-hidden border-t font-sans text-white"
      style={{ backgroundColor: "var(--bg)", borderColor: "rgba(255,255,255,0.04)" }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-20 md:px-8 lg:gap-16 lg:px-8 lg:py-[112px] xl:px-[109px]">

        {/* ── Header ── */}
        <FadeInSection>
          <header className="flex w-full max-w-[934px] flex-col items-center gap-3 text-center">
            <p
              className="text-[12.1px] font-semibold uppercase text-[color:var(--landing-eyebrow)]"
              style={{ letterSpacing: "2.42px", lineHeight: "18.15px" }}
            >
              HOW IT WORKS
            </p>
            <h2
              className="text-balance text-center text-[24px] font-bold leading-[1.2] text-[color:var(--ink)] sm:text-[30px] lg:text-[36px] lg:leading-[54px]"
              style={{ fontFamily: "var(--sans)" }}
            >
              From upload to action in 30 seconds
            </h2>
            <p
              className="text-center text-base font-normal leading-6 text-[color:var(--landing-difference-sub)]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Three steps. Zero guesswork. Know what to change — and why.
            </p>
          </header>
        </FadeInSection>

        {/* ── Mobile stacked layout — hidden on md+ ── */}
        <FadeInSection delay={0.1} className="flex w-full flex-col gap-4 md:hidden">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="overflow-hidden rounded-[15px] border"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.05)",
                height: 174,
              }}
            >
              <div className="flex h-full items-stretch overflow-hidden" style={{ paddingLeft: 16, paddingRight: 8 }}>
                {/* Left: step number + title + desc */}
                <div
                  className="flex shrink-0 flex-col justify-between"
                  style={{ width: 118, paddingTop: 16, paddingBottom: 16 }}
                >
                  {/* Number badge — top */}
                  <div
                    className="inline-flex items-center justify-center rounded-[4px] font-bold uppercase"
                    style={{
                      backgroundColor: step.badgeBg,
                      color: step.badgeColor,
                      height: 22,
                      width: 32,
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    {step.number}
                  </div>
                  {/* Title + desc — bottom */}
                  <div className="flex flex-col gap-1.5">
                    <h3
                      className="font-bold text-white"
                      style={{ fontFamily: "var(--sans)", fontSize: 15, lineHeight: 1.2, letterSpacing: "-0.2px" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{ fontFamily: "var(--sans)", fontSize: 10, lineHeight: 1.4, color: "#b6b6b6" }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
                {/* Right: mockup — scaled to fit */}
                <div className="relative flex-1 overflow-hidden">
                  <div
                    className="pointer-events-none absolute select-none"
                    style={{ top: 8, left: 0, transform: "scale(0.5)", transformOrigin: "top left" }}
                  >
                    {step.mockup}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </FadeInSection>

        {/* ── Desktop bento — hidden below lg ── */}
        <FadeInSection delay={0.15} className="hidden w-full max-w-[1064px] md:block">
          {/* Outer container clips mockup overflow when cards are narrow */}
          <div
            className="overflow-hidden"
            style={{ height: CARD_H }}
            onMouseLeave={() => setActiveStep(0)}
          >
            <div className="flex h-full" style={{ gap: GAP }}>
              {STEPS.map((step, index) => {
                const isActive = activeStep === index;
                return (
                  <motion.div
                    key={step.number}
                    animate={{ width: isActive ? ACTIVE_W : NARROW_W }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="relative shrink-0 overflow-hidden rounded-[15.24px] border shadow-[0px_3.694px_3.694px_0px_rgba(0,0,0,0.1)] flex items-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.05)",
                      height: CARD_H,
                      gap: step.absoluteMockup ? 0 : step.mockupGap,
                      paddingTop: 20.319,
                      paddingBottom: 23.09,
                      paddingLeft: 11.083,
                      paddingRight: 24.938,
                    }}
                    onMouseEnter={() => setActiveStep(index)}
                  >
                    {/* Text — flex child, shrink-0, gap pushes badge up and text down */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 132.076,
                        flexShrink: 0,
                        width: 210.81,
                      }}
                    >
                      {/* Number badge */}
                      <div
                        className="inline-flex items-center justify-center rounded-[4.47px] font-bold uppercase"
                        style={{
                          backgroundColor: step.badgeBg,
                          color: step.badgeColor,
                          height: 24.587,
                          width: 33.527,
                          fontSize: 21.598,
                          letterSpacing: "0.6479px",
                          lineHeight: 1,
                        }}
                      >
                        {step.number}
                      </div>
                      {/* Title + description */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 21.243,
                          width: "100%",
                        }}
                      >
                        <h3
                          className="font-bold text-white"
                          style={{
                            fontFamily: "var(--sans)",
                            fontSize: 26.415,
                            lineHeight: 1.1,
                            letterSpacing: "-0.3962px",
                            margin: 0,
                            width: "100%",
                          }}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="font-medium"
                          style={{
                            color: "#b6b6b6",
                            fontFamily: "var(--sans)",
                            fontSize: 14.224,
                            lineHeight: 1.25,
                            letterSpacing: "-0.0711px",
                            margin: 0,
                            width: "100%",
                          }}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </div>

                    {step.absoluteMockup ? (
                      /* Card 03 — mockup absolutely positioned at Figma coords (295:3237) */
                      <div
                        className="pointer-events-none"
                        style={{
                          position: "absolute",
                          left: 235.19,
                          top: 22.69,
                          width: 271.5,
                          height: 296.664,
                          opacity: isActive ? 1 : 0,
                          transition: isActive
                            ? "opacity 0.3s ease 0.15s"
                            : "opacity 0.15s ease",
                        }}
                      >
                        {step.mockup}
                      </div>
                    ) : (
                      /* Cards 01 & 02 — mockup as flex sibling after text */
                      <div
                        className="pointer-events-none shrink-0 flex items-end self-end"
                        style={{
                          opacity: isActive ? 1 : 0,
                          transition: isActive
                            ? "opacity 0.3s ease 0.15s"
                            : "opacity 0.15s ease",
                        }}
                      >
                        {step.mockup}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </FadeInSection>

      </div>
    </section>
  );
}
