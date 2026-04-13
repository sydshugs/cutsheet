// src/components/AnimateToHtml5Takeover.tsx — Full-page takeover for HTML5 animation generation

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
import { cn } from "../lib/utils";

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
    <div className="absolute inset-0 z-20 flex flex-col bg-[var(--bg)]">
      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 h-[57px] shrink-0 border-b border-white/[0.06] bg-[var(--bg)]">
        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-[#71717b] hover:text-[var(--ink)] transition-opacity"
          aria-label="Back to results"
        >
          <ChevronLeft className="w-3 h-3" />
          Back to results
        </button>

        {/* Center title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-[rgba(0,184,219,0.12)] flex items-center justify-center">
            <Sparkles className="size-3.5 text-[#06b6d4]" />
          </div>
          <span className="text-sm font-semibold text-[#f4f4f5]">Animate to HTML5</span>
          <span className="rounded-full border border-white/[0.06] bg-white/[0.02] text-[10px] text-[#71717b] px-2.5 py-1 whitespace-nowrap">
            {format} · {formatLabel}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="size-6 rounded-full flex items-center justify-center hover:bg-white/[0.04] transition-opacity"
          aria-label="Close"
        >
          <X className="size-4 text-[#71717b]" />
        </button>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-6 px-6 pt-6 overflow-hidden">
        {/* LEFT COLUMN — Image previews */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="flex flex-col items-center pb-12">
            <div className="w-full max-w-[500px] flex flex-col">
              {/* ── ORIGINAL ─────────────────────────────────────── */}
              <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#52525c] mb-2">
                ORIGINAL
              </p>
              <div className="rounded-2xl border border-white/[0.06] bg-[#18181b] overflow-hidden">
                {/* Image area */}
                <div
                  className="w-full bg-[var(--bg)] flex items-center justify-center p-4"
                  style={{ aspectRatio: `${width}/${height}` }}
                >
                  <img
                    src={imageSrc}
                    alt="Original banner"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                {/* Footer */}
                <div className="px-3 py-2 border-t border-white/[0.06] bg-[#18181b] flex justify-between items-center">
                  <span className="text-[11px] font-mono text-[#52525c] truncate">{fileName}</span>
                  <span className="text-[11px] text-[#3f3f47] whitespace-nowrap ml-4">Static · {format}</span>
                </div>
              </div>

              {/* Down arrow */}
              <div className="my-3 flex justify-center">
                <ArrowDown className="size-4 text-[#52525c]" />
              </div>

              {/* ── ANIMATED PREVIEW ─────────────────────────────── */}
              <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#0092b8] mb-2">
                ANIMATED PREVIEW
              </p>
              <div
                className={cn(
                  "rounded-2xl border bg-[#18181b] overflow-hidden",
                  hasGenerated ? "border-[rgba(0,184,219,0.2)]" : "border-white/[0.06]"
                )}
              >
                {/* Preview area */}
                <div
                  className="w-full bg-[var(--bg)] relative flex items-center justify-center"
                  style={{ aspectRatio: `${width}/${height}` }}
                >
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-6 text-[#06b6d4] animate-spin" />
                      <span className="text-sm text-[var(--ink-muted)]">Generating animation...</span>
                      <span className="text-xs text-[var(--ink-faint)]">This usually takes 15-30 seconds</span>
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
                    <>
                      {/* Dimmed original as placeholder */}
                      <img
                        src={imageSrc}
                        alt="Preview placeholder"
                        className="max-w-full max-h-full object-contain opacity-80"
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="size-12 rounded-full bg-[rgba(0,184,219,0.2)] border border-[rgba(0,184,219,0.3)] flex items-center justify-center">
                          <Play className="size-5 text-[#06b6d4] ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* Footer — always visible once generated or generating */}
                {(hasGenerated || isGenerating) && (
                  <div className="px-3 py-2.5 border-t border-white/[0.06] bg-[#18181b] flex justify-between items-center">
                    <span className="text-[11px] font-mono text-[#52525c]">
                      HTML5 · {format}{fileSizeLabel ? ` · ${fileSizeLabel}` : ""}
                    </span>
                    <button
                      onClick={handleDownload}
                      disabled={isGenerating || !zipBase64}
                      className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-xs text-[#9f9fa9] px-3 py-1.5 transition-opacity disabled:opacity-40"
                    >
                      <Download className="size-3" />
                      <span>Download .zip</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 rounded-xl bg-red-500/[0.06] border border-red-500/15 px-3 py-2.5 flex gap-2 items-start">
                  <AlertTriangle className="size-3 text-red-400 shrink-0 mt-[1px]" />
                  <span className="text-xs text-red-300 leading-tight">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Settings Panel */}
        <div className="w-[380px] shrink-0 h-fit">
          <div className="rounded-2xl border border-white/[0.06] bg-[#18181b] p-6">
            {/* ── ANIMATION STYLE ──────────────────────────────── */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#52525c] mb-3">
              ANIMATION STYLE
            </p>

            <div className="grid grid-cols-3 gap-2">
              {STYLE_OPTIONS.map((opt) => {
                const isActive = activeStyle === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveStyle(opt.id)}
                    className={cn(
                      "rounded-[24px] border p-3 flex flex-col gap-1.5 items-center text-center transition-colors",
                      isActive
                        ? "border-[rgba(97,95,255,0.3)] bg-[rgba(97,95,255,0.06)]"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    )}
                  >
                    <Icon className={cn("size-4", isActive ? "text-[#e4e4e7]" : "text-[#9f9fa9]")} />
                    <span className={cn("text-xs font-medium", isActive ? "text-[#e4e4e7]" : "text-[#9f9fa9]")}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-[#52525c] leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* ── SETTINGS ─────────────────────────────────────── */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#52525c] mt-6 mb-3">
              SETTINGS
            </p>

            <div className="flex flex-col gap-4">
              {/* Duration slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9f9fa9]">Duration</span>
                  <span className="text-xs font-mono text-[#d4d4d8]">{duration}s</span>
                </div>
                <div className="relative w-full h-3 flex items-center">
                  <div className="absolute w-full h-[3px] rounded-full bg-white/[0.06]" />
                  <div
                    className="absolute h-[3px] rounded-full bg-[#6366f1]"
                    style={{ width: `${((duration - 1) / 29) * 100}%` }}
                  />
                  <div
                    className="absolute size-2.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1)] pointer-events-none"
                    style={{ left: `calc(${((duration - 1) / 29) * 100}% - 5px)` }}
                  />
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                    aria-label="Animation duration"
                  />
                </div>
              </div>

              {/* Loop toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9f9fa9]">Loop</span>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={cn(
                    "w-7 h-4 rounded-full relative transition-colors",
                    isLooping ? "bg-[#6366f1]" : "bg-white/[0.06]"
                  )}
                  role="switch"
                  aria-checked={isLooping}
                  aria-label="Toggle loop"
                >
                  <div
                    className={cn(
                      "absolute top-[2px] size-3 bg-white rounded-full transition-transform duration-200",
                      isLooping ? "translate-x-[14px]" : "translate-x-[2px]"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* GDN compliance warning */}
            <div className="mt-4 rounded-[24px] bg-[rgba(254,154,0,0.04)] border border-[rgba(254,154,0,0.15)] px-3 py-2.5 flex gap-2 items-start">
              <AlertTriangle className="size-3 text-amber-500 shrink-0 mt-[1px]" />
              <span className="text-xs text-[#71717b] leading-tight">
                GDN limits: 30s max, 3 loops, 150KB file size
              </span>
            </div>

            {/* ── ACTION BUTTONS ────────────────────────────────── */}

            {/* Generate HTML5 Animation */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-5 rounded-[24px] bg-[rgba(0,184,219,0.1)] border border-[rgba(0,184,219,0.25)] hover:bg-[rgba(0,184,219,0.15)] h-[46px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 text-[#53eafd] animate-spin" />
              ) : (
                <Sparkles className="size-3.5 text-[#53eafd]" />
              )}
              <span className="text-sm font-medium text-[#53eafd]">
                {isGenerating ? "Generating..." : "Generate HTML5 Animation"}
              </span>
            </button>

            {/* Analyze This Version — always visible */}
            <button
              onClick={onAnalyzeVersion ?? onClose}
              className="w-full mt-3 rounded-[24px] bg-[#6366f1] hover:bg-[var(--accent-hover)] h-10 flex items-center justify-center gap-2 transition-opacity overflow-hidden"
            >
              <Sparkles className="size-3.5 text-white" />
              <span className="text-sm font-medium text-white">Analyze This Version</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
