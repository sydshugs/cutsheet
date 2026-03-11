import { useState } from "react";

export interface SwipeItem {
  id: string;
  fileName: string;
  timestamp: string; // ISO
  scores: {
    hook: number;
    clarity: number;
    cta: number;
    production: number;
    overall: number;
  } | null;
  markdown: string;
  brand: string;
  format: string;
  niche: string;
  platform: string;
  tags: string[]; // lowercase tags
  notes: string;
}

const SWIPE_KEY = "cutsheet-swipe-file";

function load(): SwipeItem[] {
  try {
    const raw = localStorage.getItem(SWIPE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SwipeItem[];
  } catch {
    return [];
  }
}

function persist(items: SwipeItem[]): void {
  try {
    localStorage.setItem(SWIPE_KEY, JSON.stringify(items));
  } catch {}
}

export function useSwipeFile() {
  const [items, setItems] = useState<SwipeItem[]>(() => load());

  const addItem = (item: Omit<SwipeItem, "id">) => {
    setItems((prev) => {
      const next: SwipeItem = { ...item, id: crypto.randomUUID() };
      const updated = [next, ...prev];
      persist(updated);
      return updated;
    });
  };

  const updateItem = (id: string, patch: Partial<Omit<SwipeItem, "id">>) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      );
      persist(updated);
      return updated;
    });
  };

  const deleteItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persist(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setItems([]);
    try {
      localStorage.removeItem(SWIPE_KEY);
    } catch {}
  };

  return { items, addItem, updateItem, deleteItem, clearAll };
}

