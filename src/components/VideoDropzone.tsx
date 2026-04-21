import { useRef, useState, useCallback, useEffect, type RefObject } from "react";
import { CloudUpload, Video, Image } from "lucide-react";
import { cn } from "../lib/utils";
import { sanitizeFileName } from "../utils/sanitize";

interface VideoDropzoneProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  disabled?: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
  isDark?: boolean;  // Preserved for out-of-scope views. Always renders dark.
  acceptImages?: boolean;
  onUrlSubmit?: (url: string) => void;
  /** Override the dropzone heading text (default: "Drop your ad here") */
  heading?: string;
  /** Override the small format line under the heading (default by acceptImages) */
  formatHint?: string;
  /** Extra classes on the outer wrapper (e.g. max-w-none for two-column layouts) */
  wrapperClassName?: string;
  /** default | hero (single-column analyzers) | competitor (Figma 263-1483 dual slot, no browse link) */
  layoutVariant?: "default" | "hero" | "competitor";
  /** Hero dropzone accent: paid (indigo), display (cyan), organic (emerald Figma 295-300) */
  heroAccent?: "indigo" | "display" | "organic";
}

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 200;

function isImageFile(f: File): boolean {
  return f.type.startsWith("image/");
}

export function VideoDropzone({
  onFileSelect,
  file,
  disabled = false,
  videoRef,
  isDark = true,
  acceptImages = false,
  onUrlSubmit,
  heading = "Drop your ad here",
  formatHint,
  wrapperClassName,
  layoutVariant = "default",
  heroAccent = "indigo",
}: VideoDropzoneProps) {
  const acceptedTypes = acceptImages ? [...VIDEO_TYPES, ...IMAGE_TYPES] : VIDEO_TYPES;
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [pastedUrl, setPastedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoElementRef = videoRef ?? internalVideoRef;

  // Create object URL for preview
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [file]);

  // Global paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text')?.trim();
      if (text && /^https?:\/\//.test(text)) {
        setPastedUrl(text);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const validate = (f: File): string | null => {
    // Get extension for clearer error messages
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!acceptedTypes.includes(f.type)) {
      return `We can't read .${ext} files — upload as ${acceptImages ? "MP4, MOV, WEBM, JPG, PNG, or WEBP" : "MP4, MOV, or WEBM"}`;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `This file is too large — ${MAX_SIZE_MB}MB max. Compress your video or trim it to under 30 seconds`;
    }
    return null;
  };

  const handleFile = useCallback(
    (f: File) => {
      const err = validate(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFileSelect(f);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile, disabled]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Empty state — dropzone
  if (!file) {
    const hintText =
      formatHint ??
      (acceptImages ? "MP4 · MOV · JPG · PNG · up to 500MB" : "MP4 · MOV · WEBM · up to 500MB");
    const isHero = layoutVariant === "hero";
    const isCompetitor = layoutVariant === "competitor";
    const isDisplayHero = isHero && heroAccent === "display";
    const isOrganicHero = isHero && heroAccent === "organic";
    return (
      <div
        className={cn(
          "w-full",
          isHero || isCompetitor ? "mx-auto" : "mx-auto max-w-[640px]",
          wrapperClassName
        )}
      >
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          aria-label={`${heading} — choose file to upload`}
          aria-describedby="dropzone-hints"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) fileInputRef.current?.click();
            }
          }}
          className={cn(
            "flex flex-col items-center cursor-pointer select-none text-center border transition-[border-color,box-shadow]",
            "bg-[var(--surface)] border-[color:var(--border)]",
            isCompetitor
              ? "min-h-[269px] rounded-[15px] px-2 py-6 gap-3 justify-center"
              : isHero
                ? "min-h-[308px] rounded-[15px] px-8 py-10 gap-4 justify-center"
                : "rounded-2xl px-8 py-12 gap-3",
            isDragging
              ? isCompetitor
                ? "border-[color:var(--competitor-slot-drag-border)] shadow-[var(--shadow-glow-competitor)]"
                : isDisplayHero
                  ? "border-[color:var(--display-border-strong)] shadow-[var(--shadow-glow-display)]"
                  : isOrganicHero
                    ? "border-[color:var(--organic-border-strong)] shadow-[var(--shadow-glow-organic)]"
                    : "border-[color:var(--accent-border-strong)] shadow-[var(--shadow-glow)]"
              : "hover:border-[color:var(--border-hover)] active:border-[color:var(--border-hover)]",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <CloudUpload
            size={isCompetitor ? 19 : isHero ? 27 : 28}
            strokeWidth={isCompetitor ? 2 : isHero ? 1.75 : 2}
            className={cn(
              "transition-transform shrink-0 text-[color:var(--ink-muted)]",
              isDragging &&
                (isCompetitor
                  ? "scale-110 -translate-y-0.5 text-[color:var(--competitor-tile-icon)]"
                  : isDisplayHero
                    ? "scale-110 -translate-y-0.5 text-[color:var(--display-cloud-active)]"
                    : isOrganicHero
                      ? "scale-110 -translate-y-0.5 text-[color:var(--organic-cloud-active)]"
                      : "scale-110 -translate-y-0.5 text-[color:var(--accent-light)]")
            )}
          />

          <div
            className={cn(
              "font-medium",
              isCompetitor
                ? "text-[12.5px] leading-tight text-[color:var(--decon-body-muted)]"
                : isHero
                  ? "text-[14.5px] leading-snug text-[color:var(--ink)]"
                  : "text-base text-[color:var(--ink)]"
            )}
          >
            {heading}
          </div>

          {!isCompetitor && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) fileInputRef.current?.click();
              }}
              className={cn(
                "font-normal transition-opacity focus-visible:outline-none focus-visible:ring-2 rounded-md",
                isDisplayHero
                  ? "focus-visible:ring-[rgb(var(--display-accent-rgb)/0.35)] text-[color:var(--display-browse)]"
                  : isOrganicHero
                    ? "focus-visible:ring-[rgb(var(--organic-accent-rgb)/0.35)] text-[color:var(--organic-browse)]"
                    : "focus-visible:ring-[rgb(var(--accent-rgb)/0.35)] text-[color:var(--accent)]",
                "hover:opacity-90 active:opacity-80",
                isHero ? "text-[12.5px] leading-normal" : "text-sm"
              )}
            >
              or browse files
            </button>
          )}

          <p
            className={cn(
              isCompetitor
                ? "text-[11.5px] leading-[15px] text-[color:var(--decon-url-pill-mono)]"
                : "text-[color:var(--ink-muted)] opacity-[0.85]",
              !isCompetitor && (isHero ? "text-[11.5px] leading-tight" : "text-xs")
            )}
          >
            {hintText}
          </p>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        {/* Pasted URL input — appears when URL is pasted */}
        {pastedUrl && (
          <div className="mt-4 flex gap-2 animate-[fadeIn_0.2s_ease-out]">
            <input
              type="text"
              value={pastedUrl}
              onChange={(e) => setPastedUrl(e.target.value)}
              className={cn(
                "flex-1 bg-[var(--surface-el)] rounded-xl text-sm text-[color:var(--ink)] px-4 py-2.5 outline-none focus-visible:ring-2 border border-[color:var(--border)]",
                isDisplayHero
                  ? "focus-visible:ring-[rgb(var(--display-accent-rgb)/0.35)] focus:border-[color:var(--display-border-strong)]"
                  : isOrganicHero
                    ? "focus-visible:ring-[rgb(var(--organic-accent-rgb)/0.35)] focus:border-[color:var(--organic-border-strong)]"
                    : "focus-visible:ring-[rgb(var(--accent-rgb)/0.35)] focus:border-[color:var(--accent-border-strong)]"
              )}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (pastedUrl && onUrlSubmit) onUrlSubmit(pastedUrl);
                setPastedUrl(null);
              }}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-opacity hover:opacity-95 active:opacity-90"
            >
              Go
            </button>
          </div>
        )}

        <span id="dropzone-hints" className="sr-only">
          Accepts {acceptImages ? "MP4, MOV, WEBM, JPG, PNG, WEBP" : "MP4, MOV, WEBM"}. Max 500MB per file.
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={onInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Preview state — file loaded
  const fileIsImage = isImageFile(file);
  return (
    <div className="relative">
      <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-white/5">
        {fileIsImage ? (
          <img
            src={videoUrl ?? undefined}
            alt={sanitizeFileName(file.name)}
            className="w-full block max-h-[320px] object-contain"
          />
        ) : (
          <video
            ref={videoElementRef}
            src={videoUrl ?? undefined}
            controls
            className="w-full block max-h-[320px] object-contain"
            onLoadedMetadata={() => {
              if (videoElementRef.current) setDuration(videoElementRef.current.duration);
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5 mt-2.5">
        <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-mono text-zinc-400 truncate">{sanitizeFileName(file.name)}</span>
          </div>
          <div className="flex gap-3 shrink-0 ml-3">
            {!fileIsImage && duration !== null && (
              <span className="text-xs font-mono text-zinc-400">{formatDuration(duration)}</span>
            )}
            <span className="text-xs font-mono text-zinc-400">{formatSize(file.size)}</span>
            <button
              onClick={() => {
                onFileSelect(null);
                setError(null);
              }}
              className="text-xs font-mono text-zinc-500 hover:text-white transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 text-xs text-zinc-500">
          {fileIsImage ? (
            <>
              <Image className="h-3 w-3" />
              <span>Analyzing as static creative</span>
            </>
          ) : (
            <>
              <Video className="h-3 w-3" />
              <span>Analyzing as video creative</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
