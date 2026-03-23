// src/components/MotionPreviewPlayer.tsx — Shared video preview for all Kling animation scenarios
import { Loader2, Play } from "lucide-react";

export interface MotionPreviewPlayerProps {
  videoUrl?: string | null;
  stillFrameUrl?: string;
  isLoading: boolean;
  loadingLabel?: string;
  onAnimate?: () => void;
  buttonLabel?: string;
  error?: string | null;
}

export function MotionPreviewPlayer({
  videoUrl,
  stillFrameUrl,
  isLoading,
  loadingLabel = "Generating 5s video clip...",
  onAnimate,
  buttonLabel,
  error,
}: MotionPreviewPlayerProps) {
  // ── Result: video ready ───────────────────────────────────────────────────
  if (videoUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{
          borderRadius: 12,
          overflow: "hidden",
          background: "#18181b",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <video
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: "100%", display: "block" }}
          />
        </div>

        {/* Still frame fallback */}
        {stillFrameUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#52525b",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Still frame
            </span>
            <div style={{
              borderRadius: 12,
              overflow: "hidden",
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <img
                src={stillFrameUrl}
                alt="Still frame"
                style={{ width: "100%", display: "block", objectFit: "contain" }}
              />
            </div>
          </div>
        )}

        {/* Attribution */}
        <span style={{ fontSize: 11, color: "#52525b", textAlign: "right" }}>
          Powered by Kling v2.1
        </span>
      </div>
    );
  }

  // ── Loading: generating video ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 12, padding: "32px 20px",
        borderRadius: 12, background: "#18181b",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Loader2
          size={20}
          color="#6366f1"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span style={{ fontSize: 13, color: "#a1a1aa" }}>{loadingLabel}</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "20px", borderRadius: 12,
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.15)",
        textAlign: "center",
      }}>
        <span style={{ fontSize: 13, color: "#fca5a5" }}>
          Video generation failed. The still frame is still available above.
        </span>
      </div>
    );
  }

  // ── Pre-generation: show animate button ───────────────────────────────────
  if (onAnimate) {
    return (
      <button
        type="button"
        onClick={onAnimate}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "10px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, cursor: "pointer",
          fontSize: 13, fontWeight: 500, color: "#a1a1aa",
          transition: "all 150ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(99,102,241,0.08)";
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
          e.currentTarget.style.color = "#818cf8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          e.currentTarget.style.color = "#a1a1aa";
        }}
      >
        <Play size={14} />
        {buttonLabel ?? "Generate Motion Preview"}
      </button>
    );
  }

  return null;
}
