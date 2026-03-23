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

  // ── Loading: enhanced visual presentation ───────────────────
  if (isLoading) {
    // Calculate progress percentage (estimate based on typical 90s generation)
    const estimatedTotal = 90;
    const progressPercent = Math.min((elapsed / estimatedTotal) * 100, 95);
    
    return (
      <div style={{
        borderRadius: 16, 
        background: "linear-gradient(180deg, rgba(24,24,27,0.98) 0%, rgba(24,24,27,1) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Subtle animated gradient overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          animation: "pulse-glow 3s ease-in-out infinite",
        }} />

        {/* Main content */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 16, padding: "32px 24px 24px",
          position: "relative",
        }}>
          {/* Animated spinner with ring */}
          <div style={{ position: "relative", width: 48, height: 48 }}>
            {/* Outer ring - slow rotation */}
            <svg 
              width="48" height="48" 
              style={{ 
                position: "absolute", 
                animation: "spin-slow 8s linear infinite",
              }}
            >
              <circle
                cx="24" cy="24" r="22"
                fill="none"
                stroke="rgba(99,102,241,0.15)"
                strokeWidth="2"
                strokeDasharray="8 4"
              />
            </svg>
            {/* Inner spinner */}
            <svg 
              width="48" height="48" 
              style={{ 
                position: "absolute",
                animation: "spin 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
              }}
            >
              <circle
                cx="24" cy="24" r="16"
                fill="none"
                stroke="url(#spinner-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="70 30"
              />
              <defs>
                <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center dot pulse */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 8, height: 8,
              borderRadius: "50%",
              background: "#818cf8",
              animation: "pulse-dot 2s ease-in-out infinite",
            }} />
          </div>

          {/* Status message with fade transition */}
          <div style={{ textAlign: "center" }}>
            <p style={{ 
              fontSize: 14, 
              fontWeight: 500, 
              color: "#e4e4e7", 
              marginBottom: 4,
              animation: "fade-in 0.3s ease-out",
            }}>
              {getStagedMessage(elapsed)}
            </p>
            <p style={{ fontSize: 12, color: "#52525b" }}>
              This typically takes 1-2 minutes
            </p>
          </div>
        </div>

        {/* Progress bar section */}
        <div style={{ padding: "0 24px 20px" }}>
          {/* Progress bar track */}
          <div style={{
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
            marginBottom: 16,
          }}>
            {/* Progress bar fill with shimmer */}
            <div style={{
              height: "100%",
              borderRadius: 2,
              background: "linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #6366f1 100%)",
              backgroundSize: "200% 100%",
              width: `${progressPercent}%`,
              transition: "width 1s ease-out",
              animation: "shimmer 2s ease-in-out infinite",
              position: "relative",
            }}>
              {/* Glow effect */}
              <div style={{
                position: "absolute",
                right: 0,
                top: -2,
                bottom: -2,
                width: 20,
                background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.6))",
                filter: "blur(4px)",
              }} />
            </div>
          </div>

          {/* Phase cards */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr 1fr", 
            gap: 10,
          }}>
            {PHASE_CONFIG.map((phase, index) => {
              const isLit = elapsed >= phase.activateAt;
              const isActive = isLit && (index === PHASE_CONFIG.length - 1 || elapsed < PHASE_CONFIG[index + 1].activateAt);
              const phaseColors = ["#3b82f6", "#eab308", "#ef4444"]; // blue, yellow, red
              const color = phaseColors[index];
              
              return (
                <div
                  key={phase.label}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${isActive ? `${color}50` : isLit ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                    background: isActive 
                      ? `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)` 
                      : isLit 
                        ? "rgba(255,255,255,0.03)" 
                        : "rgba(255,255,255,0.01)",
                    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Active phase indicator dot */}
                  {isActive && (
                    <div style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: color,
                      animation: "pulse-dot 1.5s ease-in-out infinite",
                    }} />
                  )}
                  <span style={{
                    fontSize: 11, 
                    fontWeight: 600, 
                    textTransform: "uppercase", 
                    letterSpacing: "0.06em",
                    color: isActive ? color : isLit ? "#a1a1aa" : "#52525b",
                    transition: "color 0.5s ease",
                  }}>
                    {phase.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with elapsed time */}
        <div style={{
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: 8,
          padding: "12px 24px 16px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: "#22c55e",
            animation: "pulse-dot 2s ease-in-out infinite",
          }} />
          <span style={{ 
            fontSize: 12, 
            fontFamily: "var(--mono)", 
            color: "#52525b",
            letterSpacing: "0.02em",
          }}>
            {elapsed}s elapsed
          </span>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes spin-slow { to { transform: rotate(-360deg) } }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
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
