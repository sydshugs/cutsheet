import { lazy, Suspense, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { DemoUploadToAnalysis } from "../components/demo/DemoUploadToAnalysis";
import { DemoScorecardDeepDive } from "../components/demo/DemoScorecardDeepDive";
import { DemoPreFlight } from "../components/demo/DemoPreFlight";
import { DemoBatchMode } from "../components/demo/DemoBatchMode";
import { ArrowLeft } from "lucide-react";

const RemotionDemoPlayer = lazy(() => import("../components/remotion/RemotionDemoPlayer"));

const SEQUENCE_MAP: Record<string, React.FC<{ playing?: boolean }>> = {
  "1": DemoUploadToAnalysis,
  "2": DemoScorecardDeepDive,
  "3": DemoPreFlight,
  "4": DemoBatchMode,
};

export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const seq = searchParams.get("seq");
  const [playing] = useState(true);

  // Single sequence mode — fullscreen for Puppeteer capture
  if (seq && SEQUENCE_MAP[seq]) {
    const Demo = SEQUENCE_MAP[seq];
    return (
      <div className="w-screen h-screen overflow-hidden" style={{ background: "transparent" }}>
        <Demo playing={playing} />
      </div>
    );
  }

  // Default: Remotion product demo
  return (
    <div
      className="min-h-screen flex flex-col items-center pt-16 sm:justify-center sm:pt-0 px-3 py-6 sm:p-8"
      style={{ background: "#08080F" }}
    >
      <Link
        to="/"
        className="text-sm text-zinc-500 hover:text-white transition-colors mb-4 sm:mb-8 flex items-center gap-1.5"
      >
        <ArrowLeft size={14} />
        Back to home
      </Link>

      <Suspense
        fallback={
          <div className="text-zinc-500 text-sm font-mono">Loading demo...</div>
        }
      >
        <RemotionDemoPlayer />
      </Suspense>
    </div>
  );
}
