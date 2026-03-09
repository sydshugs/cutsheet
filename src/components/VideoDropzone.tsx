// VideoDropzone.tsx
// Drag-and-drop video upload with preview and click-to-seek support
// Drop into src/components/VideoDropzone.tsx

import { useRef, useState, useCallback, useEffect, type RefObject } from "react";

interface VideoDropzoneProps {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  disabled?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  isDark?: boolean;
}

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_SIZE_MB = 200;

export function VideoDropzone({ onFileSelect, file, disabled = false, videoRef, isDark = true }: VideoDropzoneProps) {
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
    if (!ACCEPTED_TYPES.includes(f.type)) return "Unsupported format. Use MP4, WebM, or MOV.";
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

  // Empty state — dropzone
  if (!file) {
    return (
      <div>
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: `1.5px dashed ${isDragging ? "#FF4444" : rgba("rgba(0,0,0,0.12)", "rgba(255,255,255,0.12)")}`,
            borderRadius: "10px",
            padding: "48px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            cursor: disabled ? "not-allowed" : "pointer",
            background: isDragging ? "rgba(255,68,68,0.04)" : rgba("rgba(0,0,0,0.02)", "rgba(255,255,255,0.02)"),
            transition: "all 0.2s ease",
            userSelect: "none",
          }}
        >
          {/* Upload icon */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(255,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,68,68,0.2)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF4444" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "14px",
                fontFamily: "'JetBrains Mono', monospace",
                color: rgba("rgba(10,10,10,0.7)", "rgba(255,255,255,0.7)"),
                marginBottom: "4px",
              }}
            >
              Drop video here
            </div>
            <div style={{ fontSize: "12px", color: rgba("rgba(10,10,10,0.3)", "rgba(255,255,255,0.3)") }}>
              or click to browse · MP4, WebM, MOV · max {MAX_SIZE_MB}MB
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: "8px",
              padding: "8px 12px",
              background: "rgba(255,68,68,0.08)",
              border: "1px solid rgba(255,68,68,0.2)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#FF6B6B",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={onInputChange}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  // Preview state — video loaded
  return (
    <div style={{ position: "relative" }}>
      {/* Video player */}
      <div
        style={{
          borderRadius: "10px",
          overflow: "hidden",
          background: "#000",
          position: "relative",
          border: `1px solid ${rgba("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)")}`,
        }}
      >
        <video
          ref={videoElementRef}
          src={videoUrl ?? undefined}
          controls
          style={{ width: "100%", display: "block", maxHeight: "320px", objectFit: "contain" }}
          onLoadedMetadata={() => {
            if (videoElementRef.current) setDuration(videoElementRef.current.duration);
          }}
        />
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
          {duration !== null && (
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
