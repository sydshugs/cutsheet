// src/components/AnimateToHtml5Takeover.tsx — Full-screen takeover for HTML5 animation generation

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Sparkles,
  X,
  ArrowDown,
  Zap,
  Activity,
  Eye,
  AlertTriangle,
  Play,
  Download,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { fileToBase64 } from "../lib/visualizeService";

// ── Types ───────────────────────────────────────────────────────────────────

type AnimationStyle = "entrance" | "pulse" | "reveal";

export interface AnimateToHtml5TakeoverProps {
  onClose: () => void;
  imageSrc: string;
  imageFile: File;
  format: string;
  formatLabel: string;
  fileName: string;
  onAnalyzeVersion?: () => void;
}

// ── Style Options ───────────────────────────────────────────────────────────

const STYLE_OPTIONS: {
  id: AnimationStyle;
  label: string;
  desc: string;
  icon: typeof Zap;
}[] = [
  { id: "entrance", label: "Entrance", desc: "Fade + slide in", icon: Zap },
  { id: "pulse", label: "Pulse", desc: "CTA highlight", icon: Activity },
  { id: "reveal", label: "Reveal", desc: "Logo + offer appear", icon: Eye },
];

// ── Component ───────────────────────────────────────────────────────────────

export function AnimateToHtml5Takeover({
  onClose,
  imageSrc,
  imageFile,
  format,
  formatLabel,
  fileName,
  onAnalyzeVersion,
}: AnimateToHtml5TakeoverProps) {
  const [activeStyle, setActiveStyle] = useState<AnimationStyle>("entrance");
  const [duration, setDuration] = useState(15);
  const [isLooping, setIsLooping] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [zipBase64, setZipBase64] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const width = parseInt(format.split("x")[0]) || 300;
  const height = parseInt(format.split("x")[1]) || 250;

  // ── Generate ────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setHasGenerated(false);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const imageBase64 = await fileToBase64(imageFile, 2000, 0.9);

      const response = await fetch("/api/animate-html5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64,
          style: activeStyle,
          duration,
          loop: isLooping,
          width,
          height,
          mimeType: "image/jpeg",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "PRO_REQUIRED") {
          throw new Error("Animate to HTML5 requires a Pro subscription.");
        }
        if (data.error === "CREDIT_LIMIT_REACHED") {
          throw new Error(`Monthly animate limit reached (${data.used}/${data.limit}). Resets ${new Date(data.resetDate).toLocaleDateString()}.`);
        }
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedHtml(data.html);
      setZipBase64(data.zipBase64);
      setFileSize(data.fileSize);
      setHasGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }, [imageFile, activeStyle, duration, isLooping, width, height]);

  // ── Download ────────────────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!zipBase64) return;
    const bytes = Uint8Array.from(atob(zipBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, "")}_animated.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [zipBase64, fileName]);

  // ── Format file size ──────────────────────────────────────────────────

  const fileSizeLabel = fileSize > 0
    ? fileSize > 1024 * 1024
      ? `${(fileSize / (1024 * 1024)).toFixed(1)}MB`
      : `${Math.round(fileSize / 1024)}KB`
    : "";

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-full h-full font-[var(--sans)] z-20 relative bg-[var(--bg)]">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg)]">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Back to results
        </button>

        <div className="flex items-center absolute left-1/2 -translate-x-1/2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/[0.12] flex items-center justify-center">
            <Sparkles className="w-[14px] h-[14px] text-[#06b6d4]" />
          </div>
          <span className="text-sm font-semibold text-[var(--ink)] ml-2">Animate to HTML5</span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] text-[10px] text-[var(--ink-muted)] px-2.5 py-1 ml-3 whitespace-nowrap">
            {format} · {formatLabel}
          </span>
        </div>

        <button onClick={onClose} className="p-1 hover:bg-[var(--surface-el)] rounded-lg transition-colors">
          <X className="w-4 h-4 text-[var(--ink-muted)]" />
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex gap-6 px-6 py-6 w-full h-full overflow-hidden relative z-10">
        {/* LEFT COLUMN */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center pb-20">
          <div className="w-full max-w-[500px] flex flex-col">
            {/* ORIGINAL */}
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)] mb-2">
              ORIGINAL
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">
              <div
                className="w-full bg-[var(--bg)] flex items-center justify-center p-4 relative"
                style={{ aspectRatio: `${width}/${height}` }}
              >
                <img src={imageSrc} alt="Original Banner" className="w-full h-full object-contain" />
              </div>
              <div className="px-3 py-2 border-t border-[var(--border)] flex justify-between items-center bg-[var(--surface-el)]">
                <span className="text-[11px] font-mono text-[var(--ink-faint)] truncate">{fileName}</span>
                <span className="text-[11px] text-[var(--ink-faint)] whitespace-nowrap ml-4">Static · {format}</span>
              </div>
            </div>

            <div className="my-3 flex justify-center text-[var(--ink-faint)]">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* ANIMATED PREVIEW */}
            <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-600 mb-2">
              ANIMATED PREVIEW
            </div>
            <div
              className={`rounded-2xl border bg-[var(--surface)] overflow-hidden flex flex-col transition-colors ${
                hasGenerated ? "border-cyan-500/20" : "border-[var(--border)]"
              }`}
            >
              <div
                className="w-full bg-[var(--bg)] relative flex flex-col items-center justify-center p-4"
                style={{ aspectRatio: `${width}/${height}` }}
              >
                {isGenerating ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-6 h-6 text-[#06b6d4] animate-spin" />
                    <span className="text-sm text-[var(--ink-muted)] mt-3">Generating animation...</span>
                    <span className="text-xs text-[var(--ink-faint)] mt-1">This usually takes 15-30 seconds</span>
                  </div>
                ) : hasGenerated && generatedHtml ? (
                  <iframe
                    srcDoc={generatedHtml}
                    width={Math.min(width, 460)}
                    height={Math.min(height, Math.round(460 * (height / width)))}
                    style={{ border: "none", borderRadius: 8 }}
                    sandbox="allow-scripts"
                    title="Animated preview"
                  />
                ) : (
                  <div className="text-sm text-[var(--ink-faint)]">Click Generate to preview</div>
                )}
              </div>
              {(hasGenerated || isGenerating) && (
                <div className="px-3 py-2 border-t border-[var(--border)] flex justify-between items-center bg-[var(--surface-el)]">
                  <span className="text-[11px] font-mono text-[var(--ink-faint)]">
                    HTML5 · {format}{fileSizeLabel ? ` · ${fileSizeLabel}` : ""}
                  </span>
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating || !zipBase64}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-el)] text-xs text-[var(--ink-muted)] px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download .zip</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 rounded-xl bg-red-500/[0.06] border border-red-500/15 px-3 py-2.5 flex gap-2 items-start">
                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-[1px]" />
                <span className="text-xs text-red-300 leading-tight">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Settings Panel */}
        <div className="w-[380px] shrink-0 bg-[var(--surface-el)] rounded-2xl border border-[var(--border)] flex flex-col h-fit p-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)] mb-2">
            ANIMATION STYLE
          </div>

          <div className="grid grid-cols-3 gap-2">
            {STYLE_OPTIONS.map((opt) => {
              const isActive = activeStyle === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveStyle(opt.id)}
                  className={`rounded-xl border p-3 flex flex-col gap-1.5 items-center text-center transition-colors ${
                    isActive
                      ? "border-cyan-500/30 bg-cyan-500/[0.06]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#06b6d4]" : "text-[var(--ink-muted)]"}`} />
                  <span className={`text-xs font-medium ${isActive ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-[var(--ink-faint)] leading-tight">{opt.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)] mb-3">
              SETTINGS
            </div>

            <div className="flex flex-col gap-4">
              {/* Duration slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--ink-muted)]">Duration</span>
                  <span className="text-xs font-mono text-[var(--ink)]">{duration}s</span>
                </div>
                <div className="relative w-full h-[12px] flex items-center group">
                  <div className="absolute w-full h-[3px] rounded-full bg-[var(--border)]" />
                  <div
                    className="absolute h-[3px] rounded-full bg-[#06b6d4]"
                    style={{ width: `${(duration / 30) * 100}%` }}
                  />
                  <div
                    className="absolute w-[10px] h-[10px] bg-white rounded-full shadow pointer-events-none"
                    style={{ left: `calc(${(duration / 30) * 100}% - 5px)` }}
                  />
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Loop toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--ink-muted)]">Loop</span>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`w-[28px] h-[16px] rounded-full relative transition-colors ${
                    isLooping ? "bg-[#06b6d4]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className={`absolute top-[2px] w-[12px] h-[12px] bg-white rounded-full transition-all duration-200 ${
                      isLooping ? "left-[14px]" : "left-[2px]"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* GDN compliance warning */}
            <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/15 px-3 py-2.5 mt-3 flex gap-2 items-start">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-[1px]" />
              <span className="text-xs text-[var(--ink-muted)] leading-tight">
                GDN limits: 30s max, 3 loops, 150KB file size
              </span>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-5 rounded-xl bg-cyan-500/[0.10] border border-cyan-500/25 hover:bg-cyan-500/[0.15] py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-[14px] h-[14px] text-[#06b6d4] animate-spin" />
            ) : (
              <Sparkles className="w-[14px] h-[14px] text-[#06b6d4]" />
            )}
            <span className="text-sm font-medium text-cyan-300">
              {isGenerating ? "Generating..." : "Generate HTML5 Animation"}
            </span>
          </button>

          {/* Analyze This Version */}
          {hasGenerated && onAnalyzeVersion && (
            <motion.button
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              onClick={onAnalyzeVersion}
              className="w-full rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium py-2.5 flex items-center justify-center gap-2 transition-colors overflow-hidden"
            >
              <Sparkles className="w-[14px] h-[14px]" />
              Analyze This Version
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
