// src/components/MotionPreviewPlayer.tsx — Shared video preview for all Kling animation scenarios
import { useEffect, useState, useRef } from "react";
import { Loader2, Play } from "lucide-react";

// ── Staged loading messages ─────────────────────────────────────────────────

const STAGED_MESSAGES = [
  { after: 0,  text: "Sending to Kling..." },
  { after: 5,  text: "Generating your 5s clip..." },
  { after: 15, text: "Still working — Kling clips take 1–2 minutes..." },
  { after: 40, text: "Almost there — this is normal for motion generation..." },
  { after: 90, text: "Taking longer than usual — still running..." },
] as const;

const PHASE_CONFIG = [
  { label: "Opening",    activateAt: 0  },
  { label: "Transition", activateAt: 20 },
  { label: "Payoff",     activateAt: 50 },
] as const;

function useElapsedSeconds(isActive: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!isActive) { setElapsed(0); return; }
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  return elapsed;
}

function getStagedMessage(elapsed: number): string {
  let msg = STAGED_MESSAGES[0].text;
  for (const stage of STAGED_MESSAGES) {
    if (elapsed >= stage.after) msg = stage.text;
  }
  return msg;
}

// ── Props ───────────────────────────────────────────────────────────────────

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
  onAnimate,
  buttonLabel,
  error,
}: MotionPreviewPlayerProps) {
  const elapsed = useElapsedSeconds(isLoading);

  // ── Result: video ready ─────────────────────────────────────────────────
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

        {stillFrameUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#52525b",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Still frame
            </span>
            <div style={{
              borderRadius: 12, overflow: "hidden",
              background: "#18181b", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <img src={stillFrameUrl} alt="Still frame"
                style={{ width: "100%", display: "block", objectFit: "contain" }} />
            </div>
          </div>
        )}

        <span style={{ fontSize: 11, color: "#52525b", textAlign: "right" }}>
          Powered by Kling v2.1
        </span>
      </div>
    );
  }

  // ── Loading: staged messages + animated timeline cards ───────────────────
  if (isLoading) {
    return (
      <div style={{
        borderRadius: 12, background: "#18181b",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        {/* Spinner + staged message */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 10, padding: "28px 20px 20px",
        }}>
          <Loader2
            size={20} color="#6366f1"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <span style={{ fontSize: 13, color: "#71717a", textAlign: "center", transition: "opacity 300ms" }}>
            {getStagedMessage(elapsed)}
          </span>
        </div>

        {/* Animated timeline cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 16px 16px" }}>
          {PHASE_CONFIG.map((phase) => {
            const isLit = elapsed >= phase.activateAt;
            return (
              <div
                key={phase.label}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${isLit ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.06)"}`,
                  background: isLit ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)",
                  transition: "border-color 600ms ease, background-color 600ms ease",
                }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: isLit ? "#818cf8" : "#52525b",
                  transition: "color 600ms ease",
                }}>
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Elapsed timer */}
        <div style={{
          display: "flex", justifyContent: "center", paddingBottom: 16,
        }}>
          <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "#3f3f46" }}>
            {elapsed}s elapsed
          </span>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
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

  // ── Pre-generation: show animate button ─────────────────────────────────
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
