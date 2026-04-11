import React from "react";
import { UploadCloud, Monitor } from "lucide-react";

interface DisplayUploadStateProps {
  onFileSelect?: () => void;
}

export default function DisplayUploadState({ onFileSelect }: DisplayUploadStateProps) {
  return (
    <div className="relative flex flex-col items-center w-full min-h-full font-['Geist',sans-serif]">
      {/* Radial glow — cyan */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(6,182,212,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative flex flex-col items-center w-full max-w-[760px] mx-auto pt-16 pb-20">
        {/* Page Icon Tile — 76×76, rounded-2xl */}
        <div className="w-[76px] h-[76px] rounded-2xl bg-cyan-500/[0.12] border border-cyan-500/20 flex items-center justify-center mb-6">
          <Monitor size={28} color="#06b6d4" strokeWidth={1.5} />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-[20px] font-semibold text-white mb-2">
          Score your display ad
        </h1>
        <p className="text-[14px] text-zinc-500 text-center max-w-[380px] mb-5 leading-[1.6]">
          Upload a banner ad. Get format detection, placement scoring, and a real-life mockup in 30 seconds.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {["Format detection", "Placement mockup", "GDN compliance"].map((label) => (
            <span
              key={label}
              className="rounded-full border px-3 py-1 text-xs text-cyan-400"
              style={{ background: "rgba(6,182,212,0.08)", borderColor: "rgba(6,182,212,0.2)" }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Main Dropzone */}
        <div
          onClick={onFileSelect}
          className="w-full h-[320px] rounded-[16px] border border-white/[0.06] bg-white/[0.02] flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.04] transition-all duration-300"
        >
          <UploadCloud size={28} className="text-zinc-500 mb-6" strokeWidth={1.5} />
          
          <h2 className="text-[15px] font-medium text-white mb-1.5">
            Drop your banner here
          </h2>
          
          <span className="text-[13px] text-cyan-400/80 mb-6">
            or browse files
          </span>
          
          <p className="text-[12px] text-zinc-600">
            JPG · PNG · GIF · HTML5 · up to 500MB
          </p>
        </div>
      </div>
    </div>
  );
}