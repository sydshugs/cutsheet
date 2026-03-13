import { useState } from "react";

export interface HistoryEntry {
  id: string;
  fileName: string;
  timestamp: string; // ISO string
  scores: {
    hook: number;
    clarity: number;
    cta: number;
    production: number;
    overall: number;
  } | null;
  markdown: string;
  thumbnailDataUrl?: string;
}

const HISTORY_KEY = "cutsheet-history";
const MAX_ENTRIES = 20;

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {}
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => load());

  const addEntry = (entry: Omit<HistoryEntry, "id">) => {
    setEntries((prev) => {
      const next: HistoryEntry = { ...entry, id: crypto.randomUUID() };
      const updated = [next, ...prev].slice(0, MAX_ENTRIES);
      persist(updated);
      return updated;
    });
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      persist(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setEntries([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
  };

  return { entries, addEntry, deleteEntry, clearAll };
}
