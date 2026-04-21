// src/pages/app/Deconstructor.tsx — Winning Ad Deconstructor

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Helmet } from "react-helmet-async";
import { useOutletContext } from "react-router-dom";
import {
  ScanSearch,
  Link2,
  AlertCircle,
  Upload,
} from "lucide-react";
import {
  detectSourceType,
  deconstructAd,
  type SourceType,
  type DeconstructResult,
} from "../../lib/deconstructorService";
import { cn } from "../../lib/utils";
import { InlineError } from "../../components/InlineError";
import type { AppSharedContext } from "../../components/AppLayout";
import { SOURCE_PLATFORMS } from "../../components/deconstructor/deconstructorUtils";
import { DeconstructLoadingPanel } from "../../components/deconstructor/DeconstructorLoading";
import { ResultsSplit } from "../../components/deconstructor/DeconstructorResults";

// ─── URL INPUT ────────────────────────────────────────────────────────────────

function UrlInput({
  url,
  onUrlChange,
  onSubmit,
  loading,
  autoFocus = true,
}: {
  url: string;
  onUrlChange: (v: string) => void;
  onSubmit: (url: string, sourceType: SourceType) => void;
  loading: boolean;
  autoFocus?: boolean;
}) {
  const [urlError, setUrlError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlError("Paste a URL to get started.");
      return;
    }
    const sourceType = detectSourceType(trimmed);
    if (!sourceType) {
      setUrlError(
        "Paste a valid Meta Ad Library, TikTok Creative Center, or YouTube URL."
      );
      return;
    }
    setUrlError(null);
    onSubmit(trimmed, sourceType);
  }, [url, onSubmit]);

  const handleKeyDown = (e: { key: string }) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex h-[57px] w-full shrink-0 items-center gap-[13px] rounded-[26px] border px-[18px] transition-[border-color,box-shadow] duration-200",
          "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)]",
          "focus-within:border-[rgba(245,158,11,0.35)] focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]",
        )}
      >
        <div className="flex shrink-0 items-center text-[color:var(--ink-muted)]">
          <Link2 size={15} strokeWidth={1.75} aria-hidden />
        </div>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => {
            onUrlChange(e.target.value);
            if (urlError) setUrlError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a Meta Ad Library, TikTok Creative Center, or YouTube URL"
          className="min-w-0 flex-1 border-none bg-transparent py-2 text-[14px] text-[color:var(--ink)] outline-none placeholder:text-[color:var(--decon-url-pill-mono)] focus-visible:ring-0 disabled:opacity-50"
          disabled={loading}
          autoFocus={autoFocus}
        />
        {!loading && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!url.trim()}
            className={cn(
              "flex h-[39px] shrink-0 items-center justify-center rounded-[74px] px-6 text-[14px] font-medium text-white transition-[transform,opacity,background-color] duration-200",
              "active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(245,158,11,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
            )}
            style={{ backgroundColor: "#f59e0b" }}
          >
            Deconstruct
          </button>
        )}
      </div>

      {urlError && (
        <p className="mt-2 flex items-center gap-1.5 pl-1 text-xs text-red-400">
          <AlertCircle size={12} />
          {urlError}
        </p>
      )}
    </div>
  );
}

// ─── TIKTOK FALLBACK ─────────────────────────────────────────────────────────

function TikTokFallback({
  onMediaUrl,
}: {
  onMediaUrl: (url: string) => void;
}) {
  const [embedUrl, setEmbedUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="w-full max-w-2xl mx-auto mt-4 rounded-xl p-4"
      style={{
        background: "rgba(105,201,208,0.05)",
        border: "1px solid rgba(105,201,208,0.15)",
      }}
    >
      <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
        <span style={{ color: "#69C9D0" }} className="font-semibold">
          TikTok
        </span>{" "}
        — TikTok&apos;s API requires manual access. Optionally provide a
        screenshot or embed URL for visual analysis.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={embedUrl}
          onChange={(e) => setEmbedUrl(e.target.value)}
          placeholder="Paste embed/direct image URL (optional)"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-500 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:border-white/20"
        />
        <button
          type="button"
          onClick={() => embedUrl.trim() && onMediaUrl(embedUrl.trim())}
          className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          Use URL
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1.5"
        >
          <Upload size={12} />
          Screenshot
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            // Convert to object URL for Gemini (server will fetch it as base64)
            const objectUrl = URL.createObjectURL(f);
            onMediaUrl(objectUrl);
          }
        }}
      />
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Deconstructor() {
  const { addSwipeItem, onUpgradeRequired, isPro } =
    useOutletContext<AppSharedContext>();

  const deconstructRunId = useRef(0);
  const [urlInput, setUrlInput] = useState("");
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState<{
    url: string;
    source: SourceType;
  } | null>(null);
  const [result, setResult] = useState<DeconstructResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<SourceType | null>(null);
  const [tiktokMediaUrl, setTikTokMediaUrl] = useState<string | null>(null);
  const [infoToast, setInfoToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setInfoToast(msg);
    setTimeout(() => setInfoToast(null), 2500);
  };

  const handleSubmit = useCallback(
    async (url: string, sourceType: SourceType, mediaUrl?: string) => {
      setError(null);
      setResult(null);

      // If TikTok with no media yet, prompt the fallback
      if (sourceType === "tiktok" && !mediaUrl && !tiktokMediaUrl) {
        setPendingUrl(url);
        setPendingSource(sourceType);
        return;
      }

      const runId = ++deconstructRunId.current;
      setLoading(true);
      setLoadingJob({ url, source: sourceType });
      try {
        const data = await deconstructAd(
          url,
          sourceType,
          mediaUrl ?? tiktokMediaUrl ?? undefined
        );
        if (runId !== deconstructRunId.current) return;
        setLastSubmittedUrl(url);
        setResult(data);
        setPendingUrl(null);
        setPendingSource(null);
        setTikTokMediaUrl(null);
      } catch (err) {
        if (runId !== deconstructRunId.current) return;
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        if (msg.startsWith("RATE_LIMITED:")) {
          const wait = msg.replace("RATE_LIMITED:", "");
          setError(
            isPro
              ? `Rate limit reached — try again in ${wait}.`
              : `You've used all 3 free deconstructions today. Try again in ${wait} or upgrade to Pro for unlimited.`
          );
          if (!isPro) onUpgradeRequired("deconstruct");
        } else {
          setError(msg);
        }
      } finally {
        if (runId === deconstructRunId.current) {
          setLoading(false);
          setLoadingJob(null);
        }
      }
    },
    [tiktokMediaUrl, isPro, onUpgradeRequired]
  );

  const handleCancelDeconstruct = useCallback(() => {
    deconstructRunId.current += 1;
    setLoading(false);
    setLoadingJob(null);
  }, []);

  const handleTikTokMediaUrl = (url: string) => {
    setTikTokMediaUrl(url);
    if (pendingUrl && pendingSource) {
      handleSubmit(pendingUrl, pendingSource, url);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPendingUrl(null);
    setPendingSource(null);
    setTikTokMediaUrl(null);
    setUrlInput("");
    setLastSubmittedUrl("");
  };

  const handleSaveToSwipeFile = () => {
    if (!result) return;
    addSwipeItem({
      fileName: result.adTitle,
      timestamp: new Date().toISOString(),
      scores: null,
      markdown: result.teardown,
      brand: "",
      format: "video",
      niche: "",
      platform: result.sourceType,
      tags: ["deconstruction"],
      notes: "",
    });
    showToast("Saved to your library");
  };

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col bg-[color:var(--bg)]",
        !(result && !loading) && "overflow-auto",
      )}
      style={
        !(result && !loading)
          ? { minHeight: "calc(100vh - 120px)" }
          : undefined
      }
      data-cutsheet-page="ad-breakdown"
      data-deconstructor-build="figma-263-416"
    >
      <Helmet>
        <title>Ad Breakdown — Cutsheet</title>
        <meta
          name="description"
          content="Paste any ad URL. Get a full teardown: hook analysis, psychological triggers, structure breakdown, and a ready-to-use creative brief."
        />
        <link
          rel="canonical"
          href="https://cutsheet.xyz/app/deconstructor"
        />
      </Helmet>

      {!result && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 38%, rgba(245, 158, 11, 0.1) 0%, transparent 75%)",
          }}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col",
          result && !loading && "min-h-0 overflow-hidden",
        )}
      >
        {result && !loading ? (
          <ResultsSplit
            result={result}
            submittedUrl={lastSubmittedUrl}
            onReset={handleReset}
            onSaveToSwipeFile={handleSaveToSwipeFile}
          />
        ) : (
          <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-[62px]">
            <div className="flex w-full max-w-[732px] flex-col items-center gap-[22px]">
            {/* Figma 454-1007 — hero only on idle */}
            {!result && !loading && (
              <>
                {/* Icon tile */}
                <div
                  className="flex size-[76px] shrink-0 items-center justify-center rounded-[16px] border"
                  style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)" }}
                >
                  <ScanSearch size={36} color="#f59e0b" strokeWidth={1.5} aria-hidden />
                </div>

                {/* Heading + subtitle + pills */}
                <div className="flex flex-col items-center gap-[12px]">
                  <div className="flex flex-col items-center gap-[6px]">
                    <h1 className="m-0 text-center text-[24px] font-bold leading-tight tracking-[-0.025em] text-[color:var(--ink)]">
                      Ad Breakdown
                    </h1>
                    <p className="m-0 max-w-[334px] text-center text-[14px] leading-[1.6] text-[color:var(--ink-muted)]">
                      Paste any ad URL. Get a full AI breakdown in 30 seconds.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {SOURCE_PLATFORMS.map(({ type, label }) => (
                      <span
                        key={type}
                        className="rounded-full border px-3 py-1 text-[11.5px] font-normal leading-[15px]"
                        style={{
                          color: "#f59e0b",
                          background: "rgba(245,158,11,0.04)",
                          borderColor: "rgba(245,158,11,0.2)",
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!result && (
              <>
                <UrlInput
                  url={urlInput}
                  onUrlChange={setUrlInput}
                  onSubmit={(u, st) => handleSubmit(u, st)}
                  loading={loading}
                />
                {!loading && pendingSource === "tiktok" && (
                  <TikTokFallback onMediaUrl={handleTikTokMediaUrl} />
                )}
              </>
            )}

            {loading && loadingJob && (
              <DeconstructLoadingPanel
                url={loadingJob.url}
                source={loadingJob.source}
                onCancel={handleCancelDeconstruct}
              />
            )}

            {loading && (
              <p className="mt-8 pb-8 text-center font-mono text-[11px] text-[color:var(--decon-footer-attribution)]">
                Powered by Gemini + Claude Sonnet
              </p>
            )}

            {error && !loading && (
              <div className="w-full">
                <InlineError
                  severity="red"
                  message={error}
                  dismissible
                  onDismiss={() => setError(null)}
                  primaryAction={
                    error.includes("3 free") || error.includes("Rate limit")
                      ? undefined
                      : { label: "Try again", onClick: handleReset }
                  }
                />
              </div>
            )}
            </div>{/* end max-w-[732px] gap container */}
          </div>
        )}
      </div>

      {/* Toast */}
      {infoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl text-xs font-mono text-zinc-300 shadow-lg z-[100]"
        >
          {infoToast}
        </div>
      )}
    </div>
  );
}
