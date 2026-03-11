import { useRef, useState, useCallback, useEffect, type RefObject } from "react";

interface VideoDropzoneProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  disabled?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  isDark?: boolean;
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

  const validate = (f: File): string | null => {
    if (!acceptedTypes.includes(f.type)) {
      return acceptImages
        ? "Unsupported format. Use MP4, WebM, MOV, PNG, JPEG, or WebP."
        : "Unsupported format. Use MP4, WebM, or MOV.";
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Max ${MAX_SIZE_MB}MB.`;
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

  const rgba = (light: string, dark: string) => (isDark ? dark : light);

  // Empty state — dropzone from #screen-analyzer
  if (!file) {
    const formatPills = acceptImages ? ["MP4", "MOV", "AVI", "WEBM", "MKV", "PNG", "JPEG"] : ["MP4", "MOV", "AVI", "WEBM", "MKV"];
    return (
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          aria-label="Upload video file"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) fileInputRef.current?.click();
            }
          }}
          style={{
            border: "1.5px dashed rgba(99,102,241,0.35)",
            borderRadius: "var(--radius-lg)",
            background: isDragging ? "rgba(99,102,241,0.06)" : "var(--surface)",
            padding: "64px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.25s var(--ease-out)",
            userSelect: "none",
            transform: isDragging ? "scale(1.01)" : "scale(1)",
            borderColor: isDragging ? "rgba(99,102,241,0.7)" : undefined,
            boxShadow: isDragging ? "0 0 30px rgba(99,102,241,0.1)" : "none",
          }}
          onMouseEnter={(e) => {
            if (disabled) return;
            e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)";
            e.currentTarget.style.background = "rgba(99,102,241,0.04)";
            e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(99,102,241,0.08), 0 0 20px rgba(99,102,241,0.06)";
          }}
          onMouseLeave={(e) => {
            if (isDragging) return;
            e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
            e.currentTarget.style.background = "var(--surface)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: isDragging ? "scale(1.15) translateY(-2px)" : "scale(1)",
              transition: "transform 0.25s var(--spring)",
            }}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            {acceptImages ? "Drop your creative here" : "Drop your creative here"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-muted)", textAlign: "center", lineHeight: 1.5 }}>
            Drag & drop video files, or click to browse.<br />
            Supports MP4, MOV, AVI up to {MAX_SIZE_MB}MB.
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {formatPills.map((p) => (
              <span
                key={p}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: "var(--surface-el)",
                  border: "1px solid var(--border)",
                  color: "var(--ink-muted)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) fileInputRef.current?.click();
            }}
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 500,
              cursor: disabled ? "not-allowed" : "pointer",
              background: "transparent",
              color: "var(--accent)",
              border: "1px solid rgba(99,102,241,0.3)",
              fontFamily: "var(--sans)",
            }}
            onMouseEnter={(e) => {
              if (!disabled) e.currentTarget.style.background = "rgba(99,102,241,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Browse Files
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "rgba(255,68,68,0.08)",
              border: "1px solid rgba(255,68,68,0.2)",
              borderRadius: 6,
              fontSize: 12,
              color: "#FF6B6B",
              fontFamily: "var(--mono)",
            }}
          >
            {error}
          </div>
        )}

        {onUrlSubmit && (
          <div style={{ width: "100%", display: "flex", gap: 8, marginTop: 4 }}>
            <input
              type="text"
              placeholder="Or paste a video URL..."
              style={{
                flex: 1,
                padding: "9px 14px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--ink)",
                fontFamily: "var(--sans)",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) onUrlSubmit(val);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={onInputChange}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  // Preview state — file loaded
  const fileIsImage = isImageFile(file);
  return (
    <div style={{ position: "relative" }}>
      {/* Preview */}
      <div
        style={{
          borderRadius: "10px",
          overflow: "hidden",
          background: "#000",
          position: "relative",
          border: `1px solid ${rgba("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}`,
        }}
      >
        {fileIsImage ? (
          <img
            src={videoUrl ?? undefined}
            alt={file.name}
            style={{ width: "100%", display: "block", maxHeight: "320px", objectFit: "contain" }}
          />
        ) : (
          <video
            ref={videoElementRef}
            src={videoUrl ?? undefined}
            controls
            style={{ width: "100%", display: "block", maxHeight: "320px", objectFit: "contain" }}
            onLoadedMetadata={() => {
              if (videoElementRef.current) setDuration(videoElementRef.current.duration);
            }}
          />
        )}
      </div>

      {/* File metadata bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "10px",
          padding: "8px 12px",
          background: rgba("rgba(0,0,0,0.03)", "rgba(255,255,255,0.03)"),
          borderRadius: "6px",
          border: `1px solid ${rgba("rgba(0,0,0,0.06)", "rgba(255,255,255,0.06)")}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#00D4AA",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              color: rgba("rgba(10,10,10,0.6)", "rgba(255,255,255,0.6)"),
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.name}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", flexShrink: 0, marginLeft: "12px" }}>
          {!fileIsImage && duration !== null && (
            <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: rgba("rgba(0,0,0,0.35)", "rgba(255,255,255,0.35)") }}>
              {formatDuration(duration)}
            </span>
          )}
          <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: rgba("rgba(0,0,0,0.35)", "rgba(255,255,255,0.35)") }}>
            {formatSize(file.size)}
          </span>
          <button
            onClick={() => {
              onFileSelect(null);
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: rgba("rgba(0,0,0,0.3)", "rgba(255,255,255,0.3)"),
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              padding: 0,
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
