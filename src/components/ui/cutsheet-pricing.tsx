import React from "react";
import { CircleCheck } from "lucide-react";
import { FadeInSection } from "./fade-in";

// ─── Feature data ────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  "Single video or static analysis",
  "11-metric scorecard",
  "Improvement suggestions",
  "3 analyses per month",
] as const;

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited analyses",
  "Competitor analysis",
  "Batch ranking (up to 10 files)",
  "A/B testing",
  "Generate creative brief",
  "PDF export & share links",
  "Saved Ads library",
] as const;

const TEAM_FEATURES = [
  "Everything in Pro",
  "Multiple team seats",
  "Priority support",
] as const;

// ─── Sub-components ──────────────────────────────────────────────────────────

function FeatureRow({ label, pro }: { label: string; pro?: boolean }) {
  return (
    <div className="flex items-start gap-1.5 sm:gap-3">
      <CircleCheck
        className="mt-[1.5px] size-3 sm:size-4 shrink-0"
        strokeWidth={1.5}
        style={{ color: pro ? "#615fff" : "#52525c" }}
        aria-hidden
      />
      <span
        className="text-[8px] sm:text-[14px] leading-tight sm:leading-[19.25px] text-[#9f9fa9]"
        style={{ fontFamily: "var(--sans)", fontWeight: 400 }}
      >
        {label}
      </span>
    </div>
  );
}

function GhostButton({
  onClick,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-full border py-1.5 sm:py-[13px] text-[9px] sm:text-[14px] font-medium leading-5 text-[#d4d4d8] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        borderColor: "rgba(255,255,255,0.1)",
        fontFamily: "var(--sans)",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function CutsheetPricing() {
  function scrollToWaitlist(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      id="pricing"
      className="relative w-full overflow-hidden border-t"
      style={{
        backgroundColor: "var(--bg)",
        borderColor: "rgba(255,255,255,0.04)",
        fontFamily: "var(--sans)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-10 px-4 py-16 sm:gap-12 sm:px-6 sm:py-20 lg:gap-16 lg:px-8 lg:py-[112px] xl:px-[109px]">

        {/* ── Header ── */}
        <FadeInSection>
        <div className="flex flex-col items-center gap-3 text-center">
          <p
            className="text-[12.1px] font-semibold uppercase text-[#52525c]"
            style={{ letterSpacing: "2.42px", lineHeight: "18.15px" }}
          >
            PRICING
          </p>
          <h2
            className="text-[24px] font-bold leading-[1.2] text-[#f4f4f5] sm:text-[30px] lg:text-[36px] lg:leading-[54px]"
          >
            Simple pricing. No surprises.
          </h2>
          <p
            className="text-[16px] font-normal text-[#71717b]"
            style={{ lineHeight: "24px" }}
          >
            Early access pricing — locked in for life when you join now.
          </p>
        </div>
        </FadeInSection>

        {/* ── Cards ── */}
        <div className="flex w-full max-w-[960px] flex-row items-stretch gap-2 sm:gap-4 lg:gap-6">

          {/* Free */}
          <FadeInSection delay={0.1} className="flex-1">
          <div
            className="w-full rounded-xl sm:rounded-[16px] border p-2.5 sm:p-6"
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <h3
              className="text-[13px] sm:text-[24px] font-semibold leading-tight sm:leading-[36px] text-[#f4f4f5]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Free
            </h3>
            <p
              className="mt-0.5 sm:mt-1 text-[9px] sm:text-[14px] font-medium leading-tight sm:leading-5 text-[#9f9fa9]"
              style={{ fontFamily: "var(--sans)" }}
            >
              3 analyses / month
            </p>
            <p
              className="mt-2 sm:mt-4 text-[13px] sm:text-[32px] font-bold text-[#f4f4f5]"
              style={{ lineHeight: 1.2, fontFamily: "var(--sans)" }}
            >
              Free forever
            </p>
            <p
              className="mt-1 sm:mt-[11px] text-[8px] sm:text-[14px] font-normal leading-tight sm:leading-[21px] text-[#71717b]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Try Cutsheet risk-free. No card, no commitment.
            </p>
            <div className="mt-3 sm:mt-6">
              <GhostButton onClick={scrollToWaitlist}>Get Early Access</GhostButton>
            </div>
            <div className="mt-3 sm:mt-6 flex flex-col gap-1.5 sm:gap-4">
              {FREE_FEATURES.map((f) => (
                <FeatureRow key={f} label={f} />
              ))}
            </div>
          </div>
          </FadeInSection>

          {/* Pro — featured, taller */}
          <FadeInSection delay={0.2} className="flex-1">
          <div
            className="relative w-full overflow-hidden rounded-xl sm:rounded-[16px] border"
            style={{
              backgroundColor: "rgba(97,95,255,0.06)",
              borderColor: "rgba(97,95,255,0.2)",
              boxShadow: "0px 0px 30px -5px rgba(99,102,241,0.15)",
            }}
          >
            {/* Blur orb at top */}
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
              style={{
                top: "-116px",
                width: "233px",
                height: "233px",
                background: "rgba(97,95,255,0.2)",
                filter: "blur(60px)",
                opacity: 0.66,
              }}
            />

            <div className="relative p-2.5 sm:p-6">
              <h3
                className="text-[13px] sm:text-[24px] font-semibold leading-tight sm:leading-[36px] text-[#f4f4f5]"
                style={{ fontFamily: "var(--sans)" }}
              >
                Pro
              </h3>
              <p
                className="mt-0.5 sm:mt-1 text-[9px] sm:text-[14px] font-medium leading-tight sm:leading-5"
                style={{ color: "rgba(163,179,255,0.8)", fontFamily: "var(--sans)" }}
              >
                Unlimited analyses
              </p>
              <p
                className="mt-2 sm:mt-4 text-[13px] sm:text-[32px] font-bold text-[#f4f4f5]"
                style={{ lineHeight: 1.2, fontFamily: "var(--sans)" }}
              >
                Early access
              </p>
              <p
                className="mt-1 sm:mt-[11px] text-[8px] sm:text-[14px] font-normal leading-tight sm:leading-[21px] text-[#9f9fa9]"
                style={{ fontFamily: "var(--sans)" }}
              >
                For performance marketers and creative teams shipping weekly.
              </p>
              <button
                onClick={scrollToWaitlist}
                className="mt-3 sm:mt-6 w-full rounded-full py-1.5 sm:py-3 text-[9px] sm:text-[14px] font-semibold leading-5 text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                style={{
                  backgroundColor: "#615fff",
                  boxShadow: "0px 0px 20px 0px rgba(99,102,241,0.4)",
                  fontFamily: "var(--sans)",
                }}
              >
                Get Early Access
              </button>
              <div className="mt-3 sm:mt-6 flex flex-col gap-1.5 sm:gap-4">
                {PRO_FEATURES.map((f) => (
                  <FeatureRow key={f} label={f} pro />
                ))}
              </div>
            </div>
          </div>
          </FadeInSection>

          {/* Team */}
          <FadeInSection delay={0.3} className="flex-1">
          <div
            className="w-full rounded-xl sm:rounded-[16px] border p-2.5 sm:p-6"
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <h3
              className="text-[13px] sm:text-[24px] font-semibold leading-tight sm:leading-[36px] text-[#f4f4f5]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Team
            </h3>
            <p
              className="mt-0.5 sm:mt-1 text-[9px] sm:text-[14px] font-medium leading-tight sm:leading-5 text-[#9f9fa9]"
              style={{ fontFamily: "var(--sans)" }}
            >
              Unlimited + team seats
            </p>
            <p
              className="mt-2 sm:mt-4 text-[13px] sm:text-[32px] font-bold text-[#f4f4f5]"
              style={{ lineHeight: 1.2, fontFamily: "var(--sans)" }}
            >
              Contact us
            </p>
            <p
              className="mt-1 sm:mt-[11px] text-[8px] sm:text-[14px] font-normal leading-tight sm:leading-[21px] text-[#71717b]"
              style={{ fontFamily: "var(--sans)" }}
            >
              For agencies and in-house teams reviewing high-volume campaigns.
            </p>
            <div className="mt-3 sm:mt-6">
              <GhostButton onClick={scrollToWaitlist}>Get Early Access</GhostButton>
            </div>
            <div className="mt-3 sm:mt-6 flex flex-col gap-1.5 sm:gap-4">
              {TEAM_FEATURES.map((f) => (
                <FeatureRow key={f} label={f} />
              ))}
            </div>
          </div>
          </FadeInSection>

        </div>
      </div>
    </section>
  );
}
