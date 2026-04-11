import React from "react";

/**
 * Features section shell — main content removed per landing preview.
 * Preserves #features anchor and visual continuity with background treatment.
 */
export default function CutsheetFeatures() {
  return (
    <section id="features" className="relative w-full bg-[var(--bg)] text-white border-t border-white/5">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-violet-600/10 blur-[110px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    </section>
  );
}
