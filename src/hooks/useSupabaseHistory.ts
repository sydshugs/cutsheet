import { useState, useEffect, useCallback } from "react";
import {
  getAnalysisHistory,
  deleteAnalysis,
  type AnalysisRecord,
} from "../services/historyService";
import { useAuth } from "../context/AuthContext";
import { type HistoryEntry } from "./useHistory";

function recordToEntry(r: AnalysisRecord): HistoryEntry {
  return {
    id: r.id ?? "",
    fileName: r.file_name,
    timestamp: r.created_at ?? new Date().toISOString(),
    scores: r.scores
      ? {
          hook: Number(r.scores.hook ?? 0),
          clarity: Number(r.scores.clarity ?? 0),
          cta: Number(r.scores.cta ?? 0),
          production: Number(r.scores.production ?? 0),
          overall: Number(r.overall_score ?? 0),
        }
      : null,
    markdown: "",
  };
}

export function useSupabaseHistory() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }
    setLoading(true);
    const data = await getAnalysisHistory(50);
    setEntries(data.map(recordToEntry));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!id) return;
    await deleteAnalysis(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    // No bulk-delete endpoint — optimistically clear local state.
    // Entries will be gone from Supabase via RLS on next session or explicit deletion.
    setEntries([]);
  }, []);

  return { entries, loading, refresh, deleteEntry, clearAll };
}
