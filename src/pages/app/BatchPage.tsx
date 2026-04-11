// BatchPage.tsx — Rank Creatives: shared batch state + index / full scorecard routes

import { Helmet } from "react-helmet-async";
import { Route, Routes, useOutletContext } from "react-router-dom";
import { lazy, Suspense } from "react";
import { BatchView } from "../../components/BatchView";
import { themes } from "../../theme";
import type { AppSharedContext } from "../../components/AppLayout";
import { RankBatchProvider } from "../../context/RankBatchContext";

const RankScorecardPage = lazy(() => import("./RankScorecardPage.tsx"));

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze

function BatchIndex() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Rank Creatives — Cutsheet</title>
        <meta name="description" content="Upload up to 10 ad variations. Get them ranked by AI so you know which 2-3 to test before spending." />
        <link rel="canonical" href="https://cutsheet.xyz/app/batch" />
      </Helmet>
      <h1 className="sr-only">Rank Creatives</h1>
      <BatchView />
    </div>
  );
}

function ScorecardRouteFallback() {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-[color:var(--bg)]">
      <div
        className="size-8 rounded-full border-2 border-[color:var(--accent)]/30 border-t-[color:var(--accent)]"
        style={{ animation: "spin 0.65s linear infinite" }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function BatchPage() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, addHistoryEntry } = useOutletContext<AppSharedContext>();

  return (
    <RankBatchProvider
      isDark
      apiKey={API_KEY}
      addHistoryEntry={addHistoryEntry}
      t={themes.dark}
      canAnalyze={canAnalyze}
      isPro={isPro}
      increment={increment}
      FREE_LIMIT={FREE_LIMIT}
    >
      <Routes>
        <Route index element={<BatchIndex />} />
        <Route
          path="scorecard/:itemId"
          element={
            <Suspense fallback={<ScorecardRouteFallback />}>
              <RankScorecardPage />
            </Suspense>
          }
        />
      </Routes>
    </RankBatchProvider>
  );
}
