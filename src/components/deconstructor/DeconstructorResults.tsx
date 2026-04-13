// src/components/deconstructor/DeconstructorResults.tsx — Results sub-components

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import {
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  Bookmark,
  Play,
  FileText,
  Link2,
} from "lucide-react";
import {
  parseTeardownSections,
  getSourceLabel,
  isWhyThisAdWorksTitle,
  matchesBriefHeading,
} from "../../lib/deconstructorService";
import type { DeconstructResult, TeardownSection } from "../../lib/deconstructorService";
import { cn } from "../../lib/utils";
import {
  BRIEF_DISPLAY_TITLE,
  BRIEF_SECTION_TITLES,
  resultsRailSourcePillStyle,
  parseHookRangeFromTitle,
  parseTotalDurationSeconds,
  formatSecondsAsMmSs,
  isPacingSectionTitle,
  parsePacingMetricsFromMarkdown,
  stripPacingMetricLines,
  isMessagingSectionTitle,
  splitMessagingCoreClaim,
  creativeFooterMeta,
} from "./deconstructorUtils";

// ─── TEARDOWN SECTION ─────────────────────────────────────────────────────────

/** Figma 263-538 — standard teardown accordion (not the brief block) */
export function TeardownSectionCard({
  section,
  defaultOpen = false,
  totalDurationStr,
}: {
  section: TeardownSection;
  defaultOpen?: boolean;
  /** Total ad length for Hook timeline (e.g. from API meta) */
  totalDurationStr?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hookRange = parseHookRangeFromTitle(section.title);
  const totalSec =
    totalDurationStr != null ? parseTotalDurationSeconds(totalDurationStr) : null;
  const hookBarPct =
    hookRange && totalSec && totalSec > 0
      ? Math.min(100, Math.max(0, (hookRange.endSec / totalSec) * 100))
      : null;

  const pacingMetrics = useMemo(
    () =>
      isPacingSectionTitle(section.title)
        ? parsePacingMetricsFromMarkdown(section.content)
        : { avgDisplay: null, momentum: null },
    [section.title, section.content],
  );

  const messagingSplit = useMemo(
    () =>
      isMessagingSectionTitle(section.title)
        ? splitMessagingCoreClaim(section.content)
        : { callout: null as { quote: string } | null, rest: section.content },
    [section.title, section.content],
  );

  const markdownBody = useMemo(() => {
    if (isMessagingSectionTitle(section.title)) return messagingSplit.rest;
    if (
      isPacingSectionTitle(section.title) &&
      (pacingMetrics.avgDisplay || pacingMetrics.momentum)
    ) {
      return stripPacingMetricLines(section.content);
    }
    return section.content;
  }, [
    section.title,
    section.content,
    messagingSplit.rest,
    pacingMetrics.avgDisplay,
    pacingMetrics.momentum,
  ]);

  const showPacingRow =
    isPacingSectionTitle(section.title) &&
    (pacingMetrics.avgDisplay != null || pacingMetrics.momentum != null);

  return (
    <div className="overflow-hidden rounded-[15px] border border-[color:var(--border)] bg-[color:var(--surface)]">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex min-h-[50px] w-full items-center justify-between px-[19px] py-0 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
      >
        <span className="pr-3 text-[13px] font-semibold leading-snug text-[color:var(--ink)]">
          {section.title}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-[color:var(--ink-muted)] transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-[19px] pb-5 text-[13px] leading-[22px] teardown-content-figma"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <style>{`
                .teardown-content-figma p { margin: 8px 0; line-height: 22px; }
                .teardown-content-figma p, .teardown-content-figma li { color: var(--decon-markdown-muted); }
                .teardown-content-figma strong { color: var(--ink); font-weight: 600; }
                .teardown-content-figma ul, .teardown-content-figma ol { padding-left: 18px; margin: 8px 0; }
                .teardown-content-figma li { margin: 4px 0; }
                .teardown-content-figma h3, .teardown-content-figma h4 {
                  font-size: 11px; font-weight: 600; text-transform: uppercase;
                  letter-spacing: 0.08em; color: var(--ink-muted);
                  margin: 14px 0 6px;
                }
                .teardown-content-figma hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
                .teardown-content-figma blockquote {
                  margin: 12px 0;
                  padding: 12px 16px 12px 19px;
                  border-left: 3px solid var(--decon-accent);
                  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
                  background: var(--decon-accent-soft);
                }
                .teardown-content-figma blockquote p { margin: 4px 0; color: var(--ink); }
              `}</style>
              <div className="pt-4">
                {hookRange && totalSec != null && hookBarPct != null && (
                  <div className="mb-5 flex items-center gap-2">
                    <div
                      className="h-[5px] min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-[color:var(--decon-accent)] transition-[width] duration-300"
                        style={{ width: `${hookBarPct}%` }}
                      />
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1.5 font-mono text-[9.5px] tabular-nums leading-[15px]">
                      <span className="font-bold text-[color:var(--decon-accent-light)]">
                        {hookRange.labelStart} — {hookRange.labelEnd}
                      </span>
                      <span className="text-[color:var(--decon-url-pill-mono)]">
                        / {formatSecondsAsMmSs(totalSec)}
                      </span>
                    </div>
                  </div>
                )}

                {showPacingRow && (
                  <div
                    className={cn(
                      "mb-4 flex min-h-[67px] items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2",
                      pacingMetrics.avgDisplay ? "justify-between" : "justify-end",
                    )}
                  >
                    {pacingMetrics.avgDisplay && (
                      <div className="flex flex-col gap-1">
                        <p className="text-[23px] font-bold leading-none tracking-tight text-[color:var(--ink)]">
                          {pacingMetrics.avgDisplay}
                        </p>
                        <p className="text-[11.5px] text-[color:var(--ink-muted)]">
                          avg scene length
                        </p>
                      </div>
                    )}
                    {pacingMetrics.momentum && (
                      <span
                        className="rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
                        style={{
                          background: "var(--decon-momentum-bg)",
                          color: "var(--decon-momentum-text)",
                          borderColor: "var(--decon-momentum-border)",
                        }}
                      >
                        Momentum: {pacingMetrics.momentum}
                      </span>
                    )}
                  </div>
                )}

                {messagingSplit.callout && (
                  <div
                    className="mb-4 flex flex-col gap-1.5 rounded-3xl py-3 pl-5 pr-4"
                    style={{
                      background: "var(--decon-accent-soft)",
                      border: "1px solid var(--decon-core-claim-ring)",
                      borderLeftWidth: 3,
                      borderLeftColor: "var(--decon-accent)",
                    }}
                  >
                    <span className="text-[8.5px] font-semibold uppercase tracking-[0.043em] text-[color:var(--decon-accent-light)]">
                      Core claim
                    </span>
                    <p className="text-[13px] font-semibold leading-snug text-[color:var(--ink)]">
                      {messagingSplit.callout.quote}
                    </p>
                  </div>
                )}

                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {markdownBody}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── WHY IT WORKS CARD ────────────────────────────────────────────────────────

export function WhyItWorksCard({ content }: { content: string }) {
  return (
    <div
      className="flex shrink-0 flex-col gap-[11px] rounded-[15px] border px-5 pb-5 pt-5"
      style={{
        background: "var(--decon-accent-soft)",
        borderColor: "var(--decon-accent-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="size-[5.75px] shrink-0 rounded-full bg-[color:var(--decon-accent)]"
          aria-hidden
        />
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--decon-accent-light)]">
          Why it works
        </span>
      </div>
      <div className="why-works-md text-[13px] leading-[22px] text-[color:var(--decon-body-muted)]">
        <style>{`
          .why-works-md p { margin: 0; }
          .why-works-md p + p { margin-top: 10px; }
          .why-works-md strong { color: var(--ink); font-weight: 600; }
        `}</style>
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

// ─── STEAL THIS BRIEF CARD ────────────────────────────────────────────────────

/** Figma 263-535 — dedicated brief card below teardown sections */
export function StealThisBriefCard({ content }: { content: string }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="mb-6 shrink-0 overflow-hidden rounded-[15px] border"
      style={{
        background: "var(--decon-accent-softer)",
        borderColor: "var(--decon-accent-border-strong)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[50px] w-full items-center justify-between px-5 py-0 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
      >
        <div className="flex items-center gap-2">
          <div
            className="size-[5.75px] shrink-0 rounded-full bg-[color:var(--decon-accent)]"
            aria-hidden
          />
          <span className="text-[13px] font-semibold text-[color:var(--decon-accent-label)]">
            {BRIEF_DISPLAY_TITLE}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-[color:var(--decon-accent-light)]/50 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className="border-t px-5 pb-5 pt-4"
              style={{ borderColor: "var(--decon-accent-border-muted)" }}
            >
              <div
                className="mb-4 flex items-center justify-between border-b pb-3"
                style={{ borderColor: "var(--decon-accent-border-muted)" }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[color:var(--decon-accent-light)]" aria-hidden />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--decon-accent-light)]">
                    Steal-this brief
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleCopy();
                  }}
                  className="flex items-center gap-1.5 rounded-[6px] bg-[color:var(--decon-copy-btn-bg)] px-2.5 py-1 text-[11.5px] text-[color:var(--decon-accent-light)] transition-[background-color,opacity] duration-200 hover:bg-[color:var(--decon-copy-btn-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div
                className="brief-body-markdown font-mono text-[11.5px] leading-[1.7]"
                style={{ color: "var(--decon-brief-mono)" }}
              >
                <style>{`
                  .brief-body-markdown p { margin: 0.5em 0; line-height: 1.7; }
                  .brief-body-markdown ul, .brief-body-markdown ol { padding-left: 1.1em; margin: 0.5em 0; }
                  .brief-body-markdown strong { font-weight: 600; color: var(--decon-accent-light); }
                `}</style>
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FIGMA 263-535 — TWO-COLUMN RESULTS ───────────────────────────────────────

export function ResultsSplit({
  result,
  submittedUrl,
  onReset,
  onSaveToSwipeFile,
}: {
  result: DeconstructResult;
  submittedUrl: string;
  onReset: () => void;
  onSaveToSwipeFile: () => void;
}) {
  const sections = parseTeardownSections(result.teardown);
  const whySection = sections.find((s) => isWhyThisAdWorksTitle(s.title));
  const withoutWhy = sections.filter((s) => !isWhyThisAdWorksTitle(s.title));
  const briefSection = withoutWhy.find((s) =>
    matchesBriefHeading(s.title, BRIEF_SECTION_TITLES),
  );
  const middleSections = withoutWhy.filter(
    (s) => !matchesBriefHeading(s.title, BRIEF_SECTION_TITLES),
  );
  const footerMeta = creativeFooterMeta(result);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-0 w-full max-h-[calc(100dvh-48px-68px)] flex-1 flex-col overflow-hidden md:max-h-[calc(100dvh-48px)] lg:min-h-[calc(100dvh-48px)] lg:flex-row"
      data-ad-breakdown-results="figma-263-416"
    >
      {/* Left — creative + meta (Figma 263:660) */}
      <div className="flex w-full shrink-0 flex-col overflow-y-auto border-b border-white/[0.04] bg-[color:var(--bg)] lg:w-[min(22.8125rem,100%)] lg:max-w-[380px] lg:border-b-0 lg:border-r lg:border-white/[0.04]">
        <div className="border-b border-[color:var(--border)] px-4 pb-3 pt-4">
          <h1 className="mb-3 text-[13px] font-medium leading-tight text-[color:var(--ink)] md:hidden">
            Ad Breakdown
          </h1>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span
                className="w-fit rounded-full border px-2.5 py-0.5 text-[9.5px] font-semibold uppercase leading-tight tracking-wide"
                style={resultsRailSourcePillStyle(result.sourceType)}
              >
                {getSourceLabel(result.sourceType)}
              </span>
              <h3 className="line-clamp-3 text-[13px] font-medium leading-snug text-[color:var(--ink)]">
                {result.adTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="flex shrink-0 items-center gap-1 pt-0.5 text-[11.5px] text-[color:var(--ink-muted)] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>Analyze another</span>
            </button>
          </div>
          {submittedUrl ? (
            <p
              className="mt-2 truncate font-mono text-[11px] leading-snug text-[color:var(--decon-url-pill-mono)]"
              title={submittedUrl}
            >
              {submittedUrl}
            </p>
          ) : null}
        </div>

        <div className="group relative mx-4 mt-4 flex flex-col overflow-hidden rounded-[15px] border border-[color:var(--border)] bg-[color:var(--card)]">
          <div className="relative flex aspect-[9/16] w-full items-center justify-center overflow-hidden bg-black">
            {result.thumbnailUrl ? (
              <>
                <img
                  src={result.thumbnailUrl}
                  alt={result.adTitle}
                  className="h-full w-full object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-60"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-[border-color,background-color] duration-200"
                    style={{
                      borderColor: "var(--border-strong)",
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Play className="ml-0.5 h-5 w-5 text-[color:var(--ink)]" fill="currentColor" aria-hidden />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--ink-muted)]">
                No preview
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-[color:var(--border)] bg-black/40 px-3 py-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[10.5px] font-medium text-[color:var(--ink-secondary)]">
                {footerMeta.placement}
              </span>
              <span
                className="size-1 shrink-0 rounded-full"
                style={{ background: "var(--elevated)" }}
              />
              <span className="shrink-0 text-[10.5px] text-[color:var(--ink-muted)]">
                {footerMeta.aspect}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="font-mono text-[10.5px] text-[color:var(--ink-muted)] tabular-nums">
                {footerMeta.duration}
              </span>
              <ChevronDown
                className="size-3 shrink-0 text-[color:var(--ink-faint)] opacity-70"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSaveToSwipeFile}
          className="mx-4 mb-6 mt-3 flex h-10 items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[13px] text-[color:var(--ink-secondary)] transition-[transform,opacity,background-color,border-color] duration-200 hover:bg-[color:var(--surface-el)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] active:scale-[0.99]"
        >
          <Bookmark className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span>Save to Library</span>
        </button>
      </div>

      {/* Right — URL + why + sections + brief (Figma 263-538) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-[color:var(--bg)] px-5 py-5 lg:px-6">
        <div className="mx-auto flex w-full max-w-[51rem] flex-col gap-5">
        <div className="flex min-h-9 items-center justify-between gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-1">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-muted)]" aria-hidden />
            <span className="truncate font-mono text-[11.5px] text-[color:var(--decon-url-pill-mono)]">
              {submittedUrl}
            </span>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="flex shrink-0 items-center gap-1 text-[11.5px] text-[color:var(--ink-muted)] transition-colors hover:text-[color:var(--ink-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>New</span>
          </button>
        </div>

        {whySection && (
          <div className="shrink-0">
            <WhyItWorksCard content={whySection.content} />
          </div>
        )}

        <div className="flex shrink-0 flex-col gap-[7.69px]">
          {middleSections.map((section, i) => (
            <TeardownSectionCard
              key={section.title}
              section={section}
              defaultOpen={i === 0}
              totalDurationStr={footerMeta.duration}
            />
          ))}
        </div>

        {briefSection && <StealThisBriefCard content={briefSection.content} />}

        <p className="mt-auto pb-4 pt-8 text-center font-mono text-[10.5px] leading-[15.9px] text-[color:var(--decon-footer-attribution)]">
          Powered by Gemini + Claude
        </p>
        </div>
      </div>
    </motion.div>
  );
}
