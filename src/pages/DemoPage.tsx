import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DemoUploadToAnalysis } from "../components/demo/DemoUploadToAnalysis";
import { DemoScorecardDeepDive } from "../components/demo/DemoScorecardDeepDive";
import { DemoPreFlight } from "../components/demo/DemoPreFlight";
import { DemoBatchMode } from "../components/demo/DemoBatchMode";
import { Pause, Play } from "lucide-react";

const SEQUENCE_MAP: Record<string, React.FC<{ playing?: boolean }>> = {
  "1": DemoUploadToAnalysis,
  "2": DemoScorecardDeepDive,
  "3": DemoPreFlight,
  "4": DemoBatchMode,
};

const SEQUENCE_LABELS: Record<string, string> = {
  "1": "Upload to Analysis",
  "2": "Scorecard Deep Dive",
  "3": "A/B Pre-Flight",
  "4": "Batch Mode",
};

export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const seq = searchParams.get("seq");
  const [playing, setPlaying] = useState(true);

  // Single sequence mode — fullscreen for Puppeteer capture
  if (seq && SEQUENCE_MAP[seq]) {
    const Demo = SEQUENCE_MAP[seq];
    return (
      <div className="w-screen h-screen overflow-hidden" style={{ background: "var(--bg, #08080F)" }}>
        <Demo playing={playing} />
      </div>
    );
  }

  // Preview grid — all 4 sequences in a 2x2 layout
  return (
    <div className="min-h-screen p-8" style={{ background: "var(--bg, #08080F)" }}>
      <div className="flex items-center justify-between mb-8 max-w-[1400px] mx-auto">
        <div>
          <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--sans)" }}>
            Demo Sequences
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            4 animated sequences for landing page GIFs
          </p>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl px-4 py-2 transition-colors"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "Pause All" : "Play All"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-[1400px] mx-auto">
        {Object.entries(SEQUENCE_MAP).map(([key, Demo]) => (
          <div
            key={key}
            className="rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "var(--surface, rgba(255,255,255,0.03))" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-xs font-mono text-zinc-500">
                Sequence {key}: {SEQUENCE_LABELS[key]}
              </span>
              <span className="text-[10px] font-mono text-zinc-600">
                {key === "1" || key === "4" ? "3s" : "4s"} loop
              </span>
            </div>
            <div className="aspect-video relative overflow-hidden">
              <Demo playing={playing} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
