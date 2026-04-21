// src/components/organic/OrganicEmptyState.tsx
import { TrendingUp } from "lucide-react";
import { VideoDropzone } from "../VideoDropzone";

const PILLS = ["Platform optimization", "Hashtag suggestions", "Algorithm scoring"];

interface OrganicEmptyStateProps {
  onFileSelect: (f: File | null) => void;
  onUrlSubmit?: (url: string) => void;
}

export function OrganicEmptyState({ onFileSelect, onUrlSubmit }: OrganicEmptyStateProps) {
  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-[62px] min-h-[min(100%,calc(100vh-120px))]"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--analyzer-idle-ambient-organic)" }}
        aria-hidden
      />

      <div className="relative z-[1] flex w-full max-w-[731px] flex-col items-center gap-[22px]">
        {/* Icon tile */}
        <div
          className="flex size-[76px] shrink-0 items-center justify-center rounded-[16px] border"
          style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)" }}
        >
          <TrendingUp className="size-[31px] text-[color:var(--organic-accent)]" strokeWidth={1.75} aria-hidden />
        </div>

        {/* Heading + subtitle + pills */}
        <div className="flex flex-col items-center gap-[12px]">
          <div className="flex flex-col items-center gap-[6px]">
            <h1 className="m-0 text-center text-[19px] font-semibold leading-tight text-[color:var(--ink)]">
              Score your organic content
            </h1>
            <p className="m-0 max-w-[276px] text-center text-[13.5px] leading-[1.6] text-[color:var(--ink-muted)]">
              Upload a video or static creative. Get a full AI breakdown in 30 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded-full border px-3 py-1 text-[11.5px] font-normal leading-[15px]"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  borderColor: "rgba(16,185,129,0.2)",
                  color: "#10b981",
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div className="w-full">
          <VideoDropzone
            onFileSelect={onFileSelect}
            file={null}
            onUrlSubmit={onUrlSubmit}
            acceptImages
            heading="Drop your ad here"
            layoutVariant="hero"
            heroAccent="organic"
            wrapperClassName="max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
