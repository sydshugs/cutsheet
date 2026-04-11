import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ChevronDown, Play } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { FadeInSection } from "./fade-in";

function EyebrowHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="flex w-full max-w-[900px] flex-col items-center gap-3 text-center">
      <p
        className="text-[12.1px] font-semibold uppercase text-[color:var(--landing-eyebrow)]"
        style={{ letterSpacing: "2.42px", lineHeight: "18.15px" }}
      >
        {eyebrow}
      </p>
      <h2
        className="text-balance text-center text-[24px] font-bold leading-[1.2] text-[color:var(--ink)] sm:text-[30px] lg:text-[36px] lg:leading-[54px]"
        style={{ fontFamily: "var(--sans)" }}
      >
        {title}
      </h2>
      <p
        className="text-center text-base font-normal leading-6 text-[color:var(--landing-difference-sub)]"
        style={{ fontFamily: "var(--sans)" }}
      >
        {subtitle}
      </p>
    </header>
  );
}

function CheckList({
  items,
  iconColor,
  className,
}: {
  items: readonly string[];
  iconColor: string;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((line) => (
        <li key={line} className="flex items-start gap-2">
          <span
            className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full"
            style={{ color: iconColor }}
          >
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
          </span>
          <span
            className="text-sm leading-5 text-[color:var(--landing-hero-sub)]"
            style={{ fontFamily: "var(--sans)" }}
          >
            {line}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DimRow({
  label,
  value,
  fillPct,
  valueTone,
  index,
  isInView,
}: {
  label: string;
  value: string;
  fillPct: number;
  valueTone: "success" | "amber";
  index: number;
  isInView: boolean;
}) {
  const valueColor =
    valueTone === "success" ? "var(--organic-pill-text)" : "var(--landing-score-amber)";
  const barColor =
    valueTone === "success" ? "var(--organic-pill-text)" : "var(--landing-score-amber-bar)";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold text-[color:var(--landing-hero-sub)]"
          style={{ fontFamily: "var(--sans)" }}
        >
          {label}
        </span>
        {/* 5. Dimension score — fades in as its bar fills */}
        <motion.span
          className="text-xs font-semibold"
          style={{ color: valueColor, fontFamily: "var(--sans)" }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 + index * 0.15, duration: 0.3 }}
        >
          {value}
        </motion.span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--landing-bar-track)" }}
      >
        {/* 4. Bar — fills from 0% to target width, staggered by index */}
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ width: "0%" }}
          animate={isInView ? { width: `${fillPct}%` } : {}}
          transition={{ delay: 0.5 + index * 0.15, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

const SCORECARD_DIMS = [
  { label: "Visual Hook",    value: "—",   fillPct: 100, valueTone: "success" as const },
  { label: "Key Message",    value: "8.5", fillPct: 88,  valueTone: "success" as const },
  { label: "Brand Fit",      value: "7.2", fillPct: 72,  valueTone: "success" as const },
  { label: "Call to Action", value: "5.3", fillPct: 45,  valueTone: "amber"   as const },
];

function ScorecardMock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayScore, setDisplayScore] = useState(0);

  // 2. Score counter — counts from 0 to 7.2 over 1s with 0.3s delay
  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      let start = 0;
      const end = 7.2;
      const stepTime = 30;
      const steps = 1000 / stepTime;
      const increment = end / steps;
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayScore(end);
          clearInterval(timer);
        } else {
          setDisplayScore(Math.round(start * 10) / 10);
        }
      }, stepTime);
    }, 300);
    return () => clearTimeout(timeout);
  }, [isInView]);

  return (
    // 1. Card container — fades in and slides up
    <motion.div
      ref={ref}
      className="w-full max-w-[480px] rounded-2xl border p-6 shadow-[var(--landing-mock-shadow)]"
      style={{
        backgroundColor: "var(--landing-mock-surface)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="text-center">
        {/* 2. Score number — counts up */}
        <p className="text-[52px] font-bold leading-[52px]" style={{ fontFamily: "var(--sans)" }}>
          <span style={{ color: "var(--success)" }}>{displayScore.toFixed(1)}</span>
          <span className="text-2xl text-[color:var(--landing-eyebrow)]">/10</span>
        </p>

        {/* 3. Verdict badge — fades in after score finishes */}
        <motion.div
          className="mx-auto mt-2 inline-flex rounded border px-2 py-0.5"
          style={{
            backgroundColor: "rgba(var(--decon-accent-rgb), 0.1)",
            borderColor: "rgba(var(--decon-accent-rgb), 0.2)",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.3 }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.5px] text-[color:var(--decon-accent-label)]"
            style={{ fontFamily: "var(--sans)" }}
          >
            Good Potential
          </span>
        </motion.div>
      </div>

      {/* 4 + 5. Dimension bars and scores — staggered by index */}
      <div className="mt-8 flex flex-col gap-4">
        {SCORECARD_DIMS.map((dim, i) => (
          <DimRow key={dim.label} {...dim} index={i} isInView={isInView} />
        ))}
      </div>

      {/* 6. Benchmark pill — slides in last */}
      <motion.div
        className="mx-auto mt-6 flex h-[25px] w-fit items-center justify-center rounded-full border px-3"
        style={{ borderColor: "rgba(var(--organic-accent-rgb), 0.2)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.5, duration: 0.3 }}
      >
        <span
          className="text-[10px] font-medium text-[color:var(--success)]"
          style={{ fontFamily: "var(--sans)" }}
        >
          +0.8 pts vs Meta avg
        </span>
      </motion.div>
    </motion.div>
  );
}

const BRIEF_ROWS = ["Hook Direction", "Key Message", "Call to Action"] as const;

function BriefMock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    // 1. Card container — fades in and slides up
    <motion.div
      ref={ref}
      className="w-full max-w-[480px] rounded-2xl border p-6 shadow-[var(--landing-mock-shadow)]"
      style={{
        backgroundColor: "var(--landing-mock-surface)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* 2. "CREATIVE BRIEF" label — fades in first */}
      <motion.p
        className="text-[11px] font-semibold uppercase tracking-[1.32px] text-[color:var(--landing-difference-sub)]"
        style={{ fontFamily: "var(--sans)" }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Creative Brief
      </motion.p>

      <div className="mt-4 flex flex-col gap-3">
        {BRIEF_ROWS.map((label, i) => (
          // 3. Row — slides in from the left, staggered
          <motion.div
            key={label}
            className="flex h-12 items-center justify-between rounded-2xl border px-4"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "rgba(255,255,255,0.04)",
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 + i * 0.2, duration: 0.4, ease: "easeOut" }}
          >
            <span
              className="text-sm font-medium text-[color:var(--decon-body-muted)]"
              style={{ fontFamily: "var(--sans)" }}
            >
              {label}
            </span>
            {/* 4. Chevron — fades in slightly after its row */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 + i * 0.2, duration: 0.3 }}
            >
              <ChevronDown className="size-4 text-[color:var(--ink-muted)]" aria-hidden />
            </motion.span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

const LEADERBOARD_ROWS = [
  { scoreVal: 9.2, name: "Variation B - Fast Paced",        status: "WOULD SCALE", tone: "good" as const },
  { scoreVal: 8.8, name: "Variation A - Direct Testimonial", status: "WOULD SCALE", tone: "good" as const },
  { scoreVal: 6.5, name: "Variation C - Lifestyle",          status: "NEEDS REWORK", tone: "bad"  as const },
];

function LeaderboardMock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayScores, setDisplayScores] = useState([0, 0, 0]);

  // 3. Per-row score counters, each starting at delay 0.5 + (i * 0.2)s
  useEffect(() => {
    if (!isInView) return;
    const cleanups: (() => void)[] = [];

    LEADERBOARD_ROWS.forEach((row, i) => {
      const timeout = setTimeout(() => {
        let start = 0;
        const end = row.scoreVal;
        const stepTime = 30;
        const steps = 800 / stepTime;
        const increment = end / steps;
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setDisplayScores((prev) => {
              const next = [...prev];
              next[i] = end;
              return next;
            });
            clearInterval(timer);
          } else {
            setDisplayScores((prev) => {
              const next = [...prev];
              next[i] = Math.round(start * 10) / 10;
              return next;
            });
          }
        }, stepTime);
        cleanups.push(() => clearInterval(timer));
      }, (0.5 + i * 0.2) * 1000);
      cleanups.push(() => clearTimeout(timeout));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [isInView]);

  return (
    // 1. Card container — fades in and slides up
    <motion.div
      ref={ref}
      className="w-full max-w-[480px] rounded-2xl border p-4 shadow-[var(--landing-mock-shadow)]"
      style={{
        backgroundColor: "var(--landing-mock-surface)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-3">
        {LEADERBOARD_ROWS.map((row, i) => (
          // 2. Row — slides in from the right, staggered
          <motion.div
            key={row.name}
            className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "rgba(255,255,255,0.05)",
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.2, duration: 0.4, ease: "easeOut" }}
          >
            <div className="flex min-w-0 items-center gap-3">
              {/* 3. Score circle — counts up */}
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-[color:var(--ink)]"
                style={{ backgroundColor: "var(--surface-el)" }}
              >
                {displayScores[i].toFixed(1)}
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-[12px] font-semibold leading-[18px] text-[color:var(--ink)]"
                  style={{ fontFamily: "var(--sans)" }}
                >
                  {row.name}
                </p>
                {/* 4. Status label — fades in after score lands */}
                <motion.p
                  className={cn(
                    "mt-0.5 text-[10px] font-bold uppercase tracking-[0.25px]",
                    row.tone === "good"
                      ? "text-[color:var(--organic-pill-text)]"
                      : "text-[color:var(--warn)]",
                  )}
                  style={{ fontFamily: "var(--sans)" }}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 1.0 + i * 0.15, duration: 0.3 }}
                >
                  {row.status}
                </motion.p>
              </div>
            </div>
            {/* 5. Play button — fades in last, all together */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 1.4, duration: 0.3 }}
            >
              <Play className="size-3 shrink-0 text-[color:var(--ink-muted)]" aria-hidden />
            </motion.span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Figma 297:169 — WHO IT'S FOR (replaces legacy comparison grid).
 */
export default function CutsheetWhy() {
  return (
    <section
      id="who-its-for"
      className="relative w-full overflow-hidden border-t font-sans text-white"
      style={{
        backgroundColor: "var(--bg)",
        borderColor: "rgba(255,255,255,0.04)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-10 px-4 py-16 sm:gap-14 sm:px-6 sm:py-20 md:px-8 lg:gap-20 lg:px-8 lg:py-[112px] xl:px-[109px]">
        <FadeInSection>
          <EyebrowHeader
            eyebrow="WHO IT'S FOR"
            title="Built for performance marketers who ship weekly"
            subtitle="For the marketers who live in the ad accounts"
          />
        </FadeInSection>

        {/* Media buyers — text left, mock right */}
        <div className="grid w-full items-center gap-3 grid-cols-2 sm:gap-10 md:gap-12 lg:gap-16">
          <FadeInSection delay={0.1} className="flex flex-col gap-2 sm:gap-6 sm:max-w-xl">
            <div
              className="inline-flex h-[20px] sm:h-[25px] w-fit items-center rounded-full border px-2 sm:px-3"
              style={{
                backgroundColor: "rgba(var(--decon-accent-rgb), 0.08)",
                borderColor: "rgba(var(--decon-accent-rgb), 0.2)",
              }}
            >
              <span
                className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.5px] text-[color:var(--decon-accent-label)]"
                style={{ fontFamily: "var(--sans)" }}
              >
                Media Buyers
              </span>
            </div>
            <h3
              className="text-[12px] font-bold leading-[1.2] text-[color:var(--ink)] sm:text-[22px] sm:leading-[1.2] lg:text-[28px] lg:leading-[35px]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Running creatives every week? Stop finding out what didn&apos;t work
              after you&apos;ve already spent.
            </h3>
            <p
              className="hidden sm:block text-base leading-[26px] text-[color:var(--landing-difference-sub)]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Cutsheet scores every creative before it goes live. Platform
              benchmarks, dimension breakdown, and a ranked priority fix list.
              Know before you spend.
            </p>
            <CheckList
              iconColor="var(--decon-accent-light)"
              className="hidden sm:flex"
              items={[
                "Score any platform — Meta, TikTok, YouTube, Display",
                "Benchmark vs. real platform averages",
                "Priority fix list ranked by impact",
              ]}
            />
          </FadeInSection>
          <div className="flex max-h-[220px] overflow-hidden justify-center md:max-h-none md:overflow-visible md:justify-end">
            <div className="scale-[0.45] origin-top md:scale-100" style={{ minWidth: 320 }}>
              <ScorecardMock />
            </div>
          </div>
        </div>

        {/* Creative strategists — mock left, text right */}
        <div className="grid w-full items-center gap-3 grid-cols-2 sm:gap-10 md:gap-12 lg:gap-16">
          <div className="flex max-h-[220px] overflow-hidden justify-center md:max-h-none md:overflow-visible md:justify-start">
            <div className="scale-[0.45] origin-top md:scale-100" style={{ minWidth: 320 }}>
              <BriefMock />
            </div>
          </div>
          <FadeInSection delay={0.1} className="flex flex-col gap-2 sm:gap-6 sm:max-w-xl">
            <div
              className="inline-flex h-[20px] sm:h-[25px] w-fit items-center rounded-full border px-2 sm:px-3"
              style={{
                backgroundColor: "var(--landing-strategist-badge-bg)",
                borderColor: "var(--landing-strategist-badge-border)",
              }}
            >
              <span
                className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.5px] text-[color:var(--landing-score-amber)]"
                style={{ fontFamily: "var(--sans)" }}
              >
                Creative Strategists
              </span>
            </div>
            <h3
              className="text-[12px] font-bold leading-[1.2] text-[color:var(--ink)] sm:text-[22px] sm:leading-[1.2] lg:text-[28px] lg:leading-[35px]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Brief better. Know what actually works before the shoot.
            </h3>
            <p
              className="hidden sm:block text-base leading-[26px] text-[color:var(--landing-difference-sub)]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Stop briefing on gut feel. Cutsheet tells you which format your
              audience responds to — before a single frame is shot
            </p>
            <CheckList
              iconColor="var(--warn)"
              className="hidden sm:flex"
              items={[
                "AI-generated creative brief from your scorecard",
                "Hook direction, key message, CTA recommendations",
                "Platform and niche-specific guidance",
              ]}
            />
          </FadeInSection>
        </div>

        {/* DTC founders — text left, mock right */}
        <div className="grid w-full items-center gap-3 grid-cols-2 sm:gap-10 md:gap-12 lg:gap-16">
          <FadeInSection delay={0.1} className="flex flex-col gap-2 sm:gap-6 sm:max-w-xl">
            <div
              className="inline-flex h-[20px] sm:h-[25px] w-fit items-center rounded-full border px-2 sm:px-3"
              style={{
                backgroundColor: "var(--landing-dtc-badge-bg)",
                borderColor: "var(--landing-dtc-badge-border)",
              }}
            >
              <span
                className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-[0.5px] text-[color:var(--organic-pill-text)]"
                style={{ fontFamily: "var(--sans)" }}
              >
                DTC Founders
              </span>
            </div>
            <h3
              className="text-[12px] font-bold leading-[1.2] text-[color:var(--ink)] sm:text-[22px] sm:leading-[1.2] lg:text-[28px] lg:leading-[35px]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Your budget is too small to test 10 variations. Rank them first.
            </h3>
            <p
              className="hidden sm:block text-base leading-[26px] text-[color:var(--landing-difference-sub)]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Upload 3–10 variations. Cutsheet ranks them by predicted performance
              — before you burn budget finding out the hard way.
            </p>
            <CheckList
              iconColor="var(--organic-pill-text)"
              className="hidden sm:flex"
              items={[
                "Score all variations simultaneously",
                "Ranked leaderboard — test the top 2–3 only",
                "Know which creative to scale before you spend",
              ]}
            />
          </FadeInSection>
          <div className="flex max-h-[220px] overflow-hidden justify-center md:max-h-none md:overflow-visible md:justify-end">
            <div className="scale-[0.45] origin-top md:scale-100" style={{ minWidth: 320 }}>
              <LeaderboardMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
