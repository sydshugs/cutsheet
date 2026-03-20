import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type SwipeFileFilters,
  DEFAULT_FILTERS,
  applyFilters,
  deriveFilterOptions,
  filtersToParams,
  filtersFromParams,
  isDefaultFilters,
} from "@/src/lib/swipeFileFilters";

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
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filters from URL search params
  const filters: SwipeFileFilters = useMemo(
    () => filtersFromParams(searchParams),
    [searchParams]
  );

  const setFilters = useCallback(
    (next: SwipeFileFilters) => {
      const params = filtersToParams(next);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Derived values
  const filteredItems = useMemo(
    () => applyFilters(items, filters),
    [items, filters]
  );

  const filterOptions = useMemo(() => deriveFilterOptions(items), [items]);

  const isFiltered = !isDefaultFilters(filters);

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

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    // Filter API
    filteredItems,
    filters,
    setFilters,
    resetFilters,
    filterOptions,
    isFiltered,
    filteredCount: filteredItems.length,
    totalCount: items.length,
  };
}
