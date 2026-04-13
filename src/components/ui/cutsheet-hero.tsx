import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

/** Figma node 297:2654 — Hero 2 product mock */
const HERO_IMG = "/Hero_2.png";

/**
 * Marketing hero — Figma node 297:2654 (frame "03").
 * Left: decon badge, headline, subcopy, indigo-outline CTA.
 * Right: product mock screenshot.
 * Mobile: single column stack, full-width CTA and image.
 */
const CutsheetHero = memo(function CutsheetHero() {
  return (
    <section
      className="relative w-full overflow-hidden font-sans text-white"
      style={{ backgroundColor: "var(--bg)" }}
      aria-labelledby="cutsheet-hero-heading"
    >
      <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-center gap-8 px-4 pb-12 pt-[calc(91px+2rem)] sm:gap-10 sm:px-6 sm:pb-16 md:flex-row md:items-center md:gap-8 md:px-8 md:pb-[112px] md:pt-[calc(91px+2.75rem)] lg:gap-[45px] lg:px-8 xl:px-[109px]">
        {/* Left: copy */}
        <div className="flex w-full shrink-0 flex-col items-center text-center md:items-start md:text-left md:w-[42%] lg:w-[414px]">
          {/* Badge */}
          <div
            className="mb-5 inline-flex w-fit max-w-[239px] items-center gap-[7px] overflow-hidden rounded-full border py-[7px] pl-2 pr-3"
            style={{
              backgroundColor: "rgba(97,95,255,0.08)",
              borderColor: "rgba(97,95,255,0.3)",
            }}
          >
            <span
              className="size-[8.5px] shrink-0 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"
              style={{ backgroundColor: "#7c86ff", opacity: 0.9 }}
              aria-hidden
            />
            <span
              className="text-xs font-medium leading-4 tracking-[0.3px]"
              style={{ color: "#a3b3ff", fontFamily: "var(--sans)" }}
            >
              Score any ad in 30 seconds
            </span>
          </div>

          {/* Headline */}
          <motion.h1
            id="cutsheet-hero-heading"
            className={cn(
              "font-bold text-white",
              "text-[28px] leading-[1.1] tracking-[-0.03em]",
              "sm:text-[36px] sm:leading-[1.08] sm:tracking-[-0.04em]",
              "md:text-[40px] md:max-w-[380px] md:leading-[1.05] md:tracking-[-0.045em]",
              "lg:text-[48px] lg:max-w-[529px]",
              "xl:text-[64px] xl:leading-[67.2px] xl:tracking-[-3.2px]",
            )}
            style={{ fontFamily: "var(--display)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Stop guessing why your ads underperform.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="mt-5 max-w-sm text-sm font-light leading-relaxed sm:mt-6 sm:max-w-[380px] md:mt-8 md:max-w-none md:text-base xl:mt-[46px] xl:text-lg xl:leading-[29.25px]"
            style={{ color: "#9f9fa9", fontFamily: "var(--sans)" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          >
            Upload any ad. Get a score, a priority fix, and an AI rewrite in
            30 seconds. No ad account needed.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="mt-6 flex justify-center sm:mt-10 md:justify-start xl:mt-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <Link
              to="/access"
              className={cn(
                "inline-flex h-[38px] w-auto items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold text-white",
                "sm:h-[47px] sm:gap-2.5 sm:px-5 sm:min-w-[242px] sm:text-[18.38px]",
                "border-[2px] border-solid sm:border-[2.334px]",
                "transition-opacity transition-transform duration-150 ease-out",
                "hover:opacity-95 active:scale-[0.99]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
              )}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderColor: "var(--accent)",
                fontFamily: "var(--sans)",
              }}
            >
              Get Early Access
              <ArrowRight
                className="size-[16px] shrink-0 sm:size-[21px]"
                strokeWidth={2.25}
                aria-hidden
              />
            </Link>
          </motion.div>
        </div>

        {/* Right: product mock — hidden on mobile */}
        <motion.div
          className="relative hidden w-full justify-center md:flex md:justify-end md:flex-1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        >
          <div
            className="w-full max-w-[605px] overflow-hidden rounded-xl md:max-h-[420px] md:rounded-none"
            style={{ aspectRatio: "605 / 627" }}
          >
            <img
              src={HERO_IMG}
              alt="Product preview: ad analyzer showing a food delivery ad with score 7.2/10, priority fix callout, and predicted CTR range."
              className="h-full w-full object-contain object-center"
              width={605}
              height={627}
              decoding="async"
              fetchPriority="high"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default CutsheetHero;
