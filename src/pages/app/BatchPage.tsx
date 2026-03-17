// BatchPage.tsx — Thin wrapper for BatchView with AppSharedContext

import { useOutletContext } from "react-router-dom";
import { BatchView } from "../../components/BatchView";
import { themes } from "../../theme";
import type { AppSharedContext } from "../../components/AppLayout";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export default function BatchPage() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, addHistoryEntry } =
    useOutletContext<AppSharedContext>();

  return (
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
  );
}
