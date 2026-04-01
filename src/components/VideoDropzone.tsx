import { useRef, useState, useCallback, useEffect, type RefObject } from "react";
import { CloudUpload, Video, Image } from "lucide-react";
import { sanitizeFileName } from "../utils/sanitize";

interface VideoDropzoneProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  disabled?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  isDark?: boolean;  // Preserved for out-of-scope views. Always renders dark.
  acceptImages?: boolean;
  onUrlSubmit?: (url: string) => void;
}

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 200;

function isImageFile(f: File): boolean {
  return f.type.startsWith("image/");
}

export function VideoDropzone({ onFileSelect, file, disabled = false, videoRef, isDark = true, acceptImages = false, onUrlSubmit }: VideoDropzoneProps) {
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
    const hintText = acceptImages ? "MP4 · MOV · JPG · PNG · up to 500MB" : "MP4 · MOV · WEBM · up to 500MB";
    return (
      <div className="w-full max-w-[640px] mx-auto">
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          aria-label="Drop your ad here to upload"
          aria-describedby="dropzone-hints"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) fileInputRef.current?.click();
            }
          }}
          className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl px-8 py-12 flex flex-col items-center gap-3 transition-[border-color,box-shadow] cursor-pointer select-none text-center ${
            isDragging
              ? 'border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.12)]'
              : 'hover:border-white/[0.10]'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <CloudUpload
            size={28}
            className={`transition-transform ${isDragging ? 'scale-110 -translate-y-0.5 text-indigo-400' : 'text-zinc-500'}`}
          />

          <div className="text-base font-medium text-white">Drop your ad here</div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) fileInputRef.current?.click();
            }}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded"
          >
            or browse files
          </button>

          <p className="text-xs text-zinc-500">{hintText}</p>

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
              className="flex-1 bg-white/5 rounded-xl text-sm text-white px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 border border-white/10 focus:border-indigo-500/50"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (pastedUrl && onUrlSubmit) onUrlSubmit(pastedUrl);
                setPastedUrl(null);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
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
