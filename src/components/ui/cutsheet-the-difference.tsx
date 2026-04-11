import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FadeInSection } from "./fade-in";

/** Figma 369:182 "Product 1" — raster in public/ (1280×697 frame) */
const DIFFERENCE_MOCK_SRC = "/Product.png";

function DifferenceProductMock() {
  return (
    /*
     * Figma 369:182: container 1064×699, image at w=120.63% left=-10.32%
     * The image bleeds beyond the container on both sides and overflow:hidden clips
     * it cleanly, letting the dark edges fade into the section background.
     */
    <figure
      className="relative w-full shrink-0 overflow-hidden rounded-xl sm:rounded-2xl"
      style={{ aspectRatio: "1064 / 699" }}
    >
      <img
        src={DIFFERENCE_MOCK_SRC}
        alt="Paid Ad Analyzer preview: navigation sidebar, ad creative preview, score breakdown, and predicted performance."
        className="absolute max-w-none"
        style={{
          width: "120.63%",
          height: "100.07%",
          left: "-10.32%",
          top: "-0.03%",
        }}
        width={1280}
        height={697}
        decoding="async"
        loading="lazy"
      />
    </figure>
  );
}

/** Scroll-triggered screenshot reveal with subtle scale. */
function AnimatedScreenshot() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className="w-full"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
    >
      <DifferenceProductMock />
    </motion.div>
  );
}

/**
 * Figma 297:2828 — "The Difference": header (297:2829) + product mock (369:182).
 */
export default function CutsheetTheDifference() {
  return (
    <section
      id="the-difference"
      className="relative w-full overflow-hidden font-sans text-white"
      style={{
        backgroundColor: "var(--bg)",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-center gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-20 lg:gap-16 lg:px-8 lg:py-[112px] xl:px-[109px]">
        <FadeInSection>
          <header className="flex w-full flex-col items-center gap-3 text-center xl:px-[173px]">
            <p
              className="text-center text-[12.1px] font-semibold uppercase text-[var(--landing-eyebrow)]"
              style={{
                fontFamily: "var(--sans)",
                letterSpacing: "2.42px",
                lineHeight: "18.15px",
              }}
            >
              THE DIFFERENCE
            </p>
            <h2
              className="text-balance text-center text-[24px] font-bold leading-[1.2] text-[var(--ink)] sm:text-[32px] sm:leading-[1.15] lg:text-[36px] lg:leading-[54px] lg:whitespace-nowrap"
              style={{ fontFamily: "var(--sans)" }}
            >
              Every other tool analyzes your ads after they run.
            </h2>
            <p
              className="text-center text-[15px] font-normal leading-6 text-[var(--landing-difference-sub)] sm:text-[16px] lg:whitespace-nowrap"
              style={{ fontFamily: "var(--sans)" }}
            >
              Cutsheet analyzes them before you spend a dollar.
            </p>
          </header>
        </FadeInSection>

        <AnimatedScreenshot />
      </div>
    </section>
  );
}
