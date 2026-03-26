// BatchPage.tsx — Thin wrapper for BatchView with AppSharedContext

import { Helmet } from 'react-helmet-async';
import { useOutletContext } from "react-router-dom";
import { BatchView } from "../../components/BatchView";
import { themes } from "../../theme";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze

export default function BatchPage() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, addHistoryEntry } =
    useOutletContext<AppSharedContext>();

  return (
    <>
      <Helmet>
        <title>Rank Creatives — Cutsheet</title>
        <meta name="description" content="Upload up to 10 ad variations. Get them ranked by AI so you know which 2-3 to test before spending." />
        <link rel="canonical" href="https://cutsheet.xyz/app/batch" />
      </Helmet>
      <h1 className="sr-only">Rank Creatives</h1>
      <BatchView
      isDark={true}
      apiKey={API_KEY}
      addHistoryEntry={addHistoryEntry}
      t={themes.dark}
      canAnalyze={canAnalyze}
      isPro={isPro}
      increment={increment}
      FREE_LIMIT={FREE_LIMIT}
    />
    </>
  );
}
