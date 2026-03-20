// swipeFileFilters.ts — Pure utility for filtering/sorting swipe file entries

import type { SwipeItem } from "@/src/hooks/useSwipeFile";

export interface SwipeFileFilters {
  scoreMin: number;     // 0-10, default 0
  scoreMax: number;     // 0-10, default 10
  platforms: string[];  // [] = all
  formats: string[];    // [] = all
  sortBy: "newest" | "oldest" | "score_high" | "score_low";
}

export const DEFAULT_FILTERS: SwipeFileFilters = {
  scoreMin: 0,
  scoreMax: 10,
  platforms: [],
  formats: [],
  sortBy: "newest",
};

export function applyFilters(
  entries: SwipeItem[],
  filters: SwipeFileFilters
): SwipeItem[] {
  let result = entries;

  // Filter by score range
  result = result.filter((item) => {
    const score = item.scores?.overall ?? 0;
    return score >= filters.scoreMin && score <= filters.scoreMax;
  });

  // Filter by platforms
  if (filters.platforms.length > 0) {
    const set = new Set(filters.platforms.map((p) => p.toLowerCase()));
    result = result.filter(
      (item) => item.platform && set.has(item.platform.toLowerCase())
    );
  }

  // Filter by formats
  if (filters.formats.length > 0) {
    const set = new Set(filters.formats.map((f) => f.toLowerCase()));
    result = result.filter(
      (item) => item.format && set.has(item.format.toLowerCase())
    );
  }

  // Sort
  switch (filters.sortBy) {
    case "oldest":
      result = [...result].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      break;
    case "score_high":
      result = [...result].sort(
        (a, b) => (b.scores?.overall ?? 0) - (a.scores?.overall ?? 0)
      );
      break;
    case "score_low":
      result = [...result].sort(
        (a, b) => (a.scores?.overall ?? 0) - (b.scores?.overall ?? 0)
      );
      break;
    case "newest":
    default:
      result = [...result].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      break;
  }

  return result;
}

export function deriveFilterOptions(entries: SwipeItem[]): {
  platforms: string[];
  formats: string[];
} {
  const platformSet = new Set<string>();
  const formatSet = new Set<string>();

  for (const item of entries) {
    if (item.platform) platformSet.add(item.platform);
    if (item.format) formatSet.add(item.format);
  }

  return {
    platforms: Array.from(platformSet).sort(),
    formats: Array.from(formatSet).sort(),
  };
}

export function filtersToParams(f: SwipeFileFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (f.scoreMin !== DEFAULT_FILTERS.scoreMin)
    params.set("scoreMin", String(f.scoreMin));
  if (f.scoreMax !== DEFAULT_FILTERS.scoreMax)
    params.set("scoreMax", String(f.scoreMax));
  if (f.platforms.length > 0) params.set("platforms", f.platforms.join(","));
  if (f.formats.length > 0) params.set("formats", f.formats.join(","));
  if (f.sortBy !== DEFAULT_FILTERS.sortBy) params.set("sortBy", f.sortBy);

  return params;
}

export function filtersFromParams(p: URLSearchParams): SwipeFileFilters {
  const scoreMin = p.has("scoreMin")
    ? Math.max(0, Math.min(10, Number(p.get("scoreMin"))))
    : DEFAULT_FILTERS.scoreMin;
  const scoreMax = p.has("scoreMax")
    ? Math.max(0, Math.min(10, Number(p.get("scoreMax"))))
    : DEFAULT_FILTERS.scoreMax;
  const platforms = p.has("platforms")
    ? p.get("platforms")!.split(",").filter(Boolean)
    : [];
  const formats = p.has("formats")
    ? p.get("formats")!.split(",").filter(Boolean)
    : [];
  const sortByRaw = p.get("sortBy");
  const validSorts = ["newest", "oldest", "score_high", "score_low"] as const;
  const sortBy = validSorts.includes(sortByRaw as (typeof validSorts)[number])
    ? (sortByRaw as SwipeFileFilters["sortBy"])
    : DEFAULT_FILTERS.sortBy;

  return { scoreMin, scoreMax, platforms, formats, sortBy };
}

export function isDefaultFilters(f: SwipeFileFilters): boolean {
  return (
    f.scoreMin === DEFAULT_FILTERS.scoreMin &&
    f.scoreMax === DEFAULT_FILTERS.scoreMax &&
    f.platforms.length === 0 &&
    f.formats.length === 0 &&
    f.sortBy === DEFAULT_FILTERS.sortBy
  );
}
