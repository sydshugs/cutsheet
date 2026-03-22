// HistoryEntry — shared display type for analysis history.
// The localStorage-based useHistory hook has been replaced by useSupabaseHistory.
// This file is kept as a type-only export so existing imports across the codebase
// (HistoryDrawer, AnalyzerView, DashboardIdleView, page components) continue to compile
// without requiring a large-scale rename.

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
