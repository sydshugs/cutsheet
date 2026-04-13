// src/components/organic/OrganicEmptyState.tsx
import { TrendingUp } from "lucide-react";
import { VideoDropzone } from "../VideoDropzone";
import { cn } from "../../lib/utils";

const PILLS = ["Platform optimization", "Hashtag suggestions", "Algorithm scoring"];

interface OrganicEmptyStateProps {
  onFileSelect: (f: File | null) => void;
  onUrlSubmit?: (url: string) => void;
}

export function OrganicEmptyState({ onFileSelect, onUrlSubmit }: OrganicEmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8",
        "min-h-[min(100%,calc(100vh-120px))]"
      )}
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--analyzer-idle-ambient-organic)" }}
        aria-hidden
      />
      <div className="relative z-[1] flex w-full max-w-[731px] flex-col items-center">
        <div
          className={cn(
            "flex size-[73px] shrink-0 items-center justify-center rounded-[15px] border border-[color:var(--organic-border)]",
            "bg-[var(--organic-tile-bg)]"
          )}
        >
          <TrendingUp className="size-[27px] text-[color:var(--organic-accent)]" strokeWidth={1.75} aria-hidden />
        </div>

        <h1 className="mt-[23px] mb-0 text-center text-[19px] font-semibold leading-tight text-[color:var(--ink)]">
          Score your organic content
        </h1>
        <p className="mt-2.5 mb-0 max-w-[276px] text-center text-[13.5px] leading-[1.6] text-[color:var(--ink-muted)]">
          Upload a video or static creative. Get a full AI breakdown in 30 seconds.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className={cn(
                "rounded-full border border-[color:var(--organic-border)] bg-[var(--organic-pill-bg)]",
                "px-3 py-1 text-[11.5px] font-normal leading-[15px] text-[color:var(--organic-pill-text)]"
              )}
            >
              {pill}
            </span>
          ))}
        </div>

        <div className="mt-8 w-full max-w-[731px]">
          <VideoDropzone
            onFileSelect={onFileSelect}
            file={null}
            onUrlSubmit={onUrlSubmit}
            acceptImages
            heading="Drop your content here"
            layoutVariant="hero"
            heroAccent="organic"
            wrapperClassName="max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
