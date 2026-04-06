// Rank batch workspace state — shared between Rank Creatives index and full scorecard route
// so blob preview URLs stay valid when navigating to /app/batch/scorecard/:itemId

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { analyzeVideo, recalculateOverallScore, type AnalysisResult } from "../services/analyzerService";
import type { ThemeTokens } from "../theme";

export const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png", "image/webp"];
export const MAX_FILES = 10;
export const MAX_SIZE_MB = 200;

export type BatchItemStatus = "pending" | "analyzing" | "complete" | "error";

export interface BatchItem {
  id: string;
  file: File;
  format: "video" | "static";
  status: BatchItemStatus;
  result: AnalysisResult | null;
  error: string | null;
}

export type RankPlatform = "all" | "Meta" | "TikTok" | "YouTube";
export type RankTestType = "hook" | "cta" | "full";

export const RANK_PLATFORMS: { value: RankPlatform; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Meta", label: "Meta" },
  { value: "TikTok", label: "TikTok" },
  { value: "YouTube", label: "YouTube" },
];

export const RANK_TEST_TYPES: { value: RankTestType; label: string }[] = [
  { value: "hook", label: "Hook Battle" },
  { value: "cta", label: "CTA Showdown" },
  { value: "full", label: "Full Creative" },
];

export function buildRankContextPrefix(platform: RankPlatform, testType: RankTestType): string {
  const platformLine =
    platform === "all"
      ? "Platform context: evaluate for typical paid social placement (Meta, TikTok, YouTube)."
      : `Platform context: prioritize placement and safe zones for ${platform}.`;
  const testLine =
    testType === "hook"
      ? "Test type: Hook Battle — weight hook and opening moments most heavily when ranking."
      : testType === "cta"
        ? "Test type: CTA Showdown — weight CTA clarity and conversion cues most heavily when ranking."
        : "Test type: Full Creative — balance hook, CTA, clarity, and production when ranking.";
  return `${platformLine} ${testLine}`;
}

export type RankedRow = {
  item: BatchItem;
  overall: number;
  scores: NonNullable<AnalysisResult["scores"]>;
};

export interface RankBatchProviderProps {
  children: ReactNode;
  isDark: boolean;
  apiKey: string;
  addHistoryEntry: (entry: { fileName: string; timestamp: string; scores: AnalysisResult["scores"]; markdown: string }) => void;
  t: ThemeTokens;
  canAnalyze: boolean;
  isPro: boolean;
  increment: () => number;
  FREE_LIMIT: number;
}

export interface RankBatchContextValue {
  isDark: boolean;
  t: ThemeTokens;
  apiKey: string;
  items: BatchItem[];
  /** Clears or replaces queue (e.g. Start Over). */
  setItems: React.Dispatch<React.SetStateAction<BatchItem[]>>;
  isRunning: boolean;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (v: boolean) => void;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  rejectionToast: { message: string } | null;
  setRejectionToast: (v: { message: string } | null) => void;
  confirmResetOpen: boolean;
  setConfirmResetOpen: (v: boolean) => void;
  rankPlatform: RankPlatform;
  setRankPlatform: (p: RankPlatform) => void;
  rankTestType: RankTestType;
  setRankTestType: (t: RankTestType) => void;
  dropzoneDrag: boolean;
  setDropzoneDrag: (v: boolean) => void;
  stopAfterCurrentUi: boolean;
  setStopAfterCurrentUi: (v: boolean) => void;
  stopRequestedRef: React.MutableRefObject<boolean>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  allDone: boolean;
  ranked: RankedRow[];
  previewUrls: Record<string, string>;
  addFiles: (files: FileList | File[]) => void;
  removeItem: (id: string) => void;
  runBatch: () => Promise<void>;
  pendingCount: number;
  canStartRanking: boolean;
  addHistoryEntry: RankBatchProviderProps["addHistoryEntry"];
  canAnalyze: boolean;
  isPro: boolean;
  increment: () => number;
  FREE_LIMIT: number;
}

const RankBatchContext = createContext<RankBatchContextValue | null>(null);

export function RankBatchProvider({
  children,
  isDark,
  apiKey,
  addHistoryEntry,
  t,
  canAnalyze,
  isPro,
  increment,
  FREE_LIMIT,
}: RankBatchProviderProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionToast, setRejectionToast] = useState<{ message: string } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [rankPlatform, setRankPlatform] = useState<RankPlatform>("all");
  const [rankTestType, setRankTestType] = useState<RankTestType>("full");
  const [dropzoneDrag, setDropzoneDrag] = useState(false);
  const [stopAfterCurrentUi, setStopAfterCurrentUi] = useState(false);
  const stopRequestedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allDone = items.length > 0 && items.every((i) => i.status === "complete" || i.status === "error");
  const completed = items.filter((i) => i.status === "complete" && i.result?.scores);

  const ranked = useMemo(() => {
    return completed
      .map((item) => {
        const s = item.result!.scores!;
        const norm = recalculateOverallScore(s) ?? s;
        return { item, overall: norm.overall, scores: norm };
      })
      .sort((a, b) => b.overall - a.overall);
  }, [completed]);

  const detectFormat = useCallback((file: File): "video" | "static" => {
    return file.type.startsWith("video/") ? "video" : "static";
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      let skippedFormat = 0;
      let skippedSize = 0;

      setItems((prev) => {
        let next = [...prev];
        for (const file of Array.from(files)) {
          if (next.length >= MAX_FILES) break;
          if (!ACCEPTED_TYPES.includes(file.type)) {
            skippedFormat++;
            continue;
          }
          if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            skippedSize++;
            continue;
          }
          if (next.some((i) => i.file.name === file.name && i.file.size === file.size)) continue;
          next.push({
            id: crypto.randomUUID(),
            file,
            format: detectFormat(file),
            status: "pending",
            result: null,
            error: null,
          });
        }
        return next.slice(0, MAX_FILES);
      });

      const parts: string[] = [];
      if (skippedFormat > 0) parts.push(`${skippedFormat} file${skippedFormat > 1 ? "s" : ""} skipped: unsupported format`);
      if (skippedSize > 0) parts.push(`${skippedSize} file${skippedSize > 1 ? "s" : ""} skipped: exceeds ${MAX_SIZE_MB}MB limit`);
      if (parts.length > 0) {
        setRejectionToast({ message: parts.join(". ") });
      }
    },
    [detectFormat],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const runBatch = useCallback(async () => {
    if (items.length === 0 || isRunning) return;
    if (!canAnalyze && !isPro) {
      setShowUpgradeModal(true);
      return;
    }

    setIsRunning(true);
    stopRequestedRef.current = false;
    setStopAfterCurrentUi(false);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status !== "pending") continue;

      if (stopRequestedRef.current) break;

      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "analyzing" as const } : x)));

      try {
        const staticPrefix =
          item.format === "static"
            ? "This is a STATIC image ad. Analyze as a single-frame visual creative. Do NOT provide scene breakdown or timestamps."
            : undefined;
        const rankPrefix = buildRankContextPrefix(rankPlatform, rankTestType);
        const contextPrefix = [staticPrefix, rankPrefix].filter(Boolean).join("\n\n");
        const result = await analyzeVideo(item.file, apiKey, undefined, contextPrefix || undefined);
        setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "complete" as const, result, error: null } : x)));
        addHistoryEntry({ fileName: result.fileName, timestamp: result.timestamp.toISOString(), scores: result.scores, markdown: result.markdown });
        const newCount = increment();
        if (newCount >= FREE_LIMIT && !isPro) {
          setShowUpgradeModal(true);
          break;
        }
      } catch (err) {
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, status: "error" as const, error: err instanceof Error ? err.message : "Failed" } : x)),
        );
      }
    }

    stopRequestedRef.current = false;
    setStopAfterCurrentUi(false);
    setIsRunning(false);
  }, [items, isRunning, apiKey, addHistoryEntry, canAnalyze, isPro, increment, FREE_LIMIT, rankPlatform, rankTestType]);

  const previewUrls = useMemo(() => {
    const map: Record<string, string> = {};
    items.forEach((item) => {
      map[item.id] = URL.createObjectURL(item.file);
    });
    return map;
  }, [items]);
  useEffect(() => {
    return () => Object.values(previewUrls).forEach(URL.revokeObjectURL);
  }, [previewUrls]);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const canStartRanking = items.length >= 2 && pendingCount > 0 && !isRunning;

  const value = useMemo(
    (): RankBatchContextValue => ({
      isDark,
      t,
      apiKey,
      items,
      setItems,
      isRunning,
      showUpgradeModal,
      setShowUpgradeModal,
      expandedId,
      setExpandedId,
      rejectionToast,
      setRejectionToast,
      confirmResetOpen,
      setConfirmResetOpen,
      rankPlatform,
      setRankPlatform,
      rankTestType,
      setRankTestType,
      dropzoneDrag,
      setDropzoneDrag,
      stopAfterCurrentUi,
      setStopAfterCurrentUi,
      stopRequestedRef,
      fileInputRef,
      allDone,
      ranked,
      previewUrls,
      addFiles,
      removeItem,
      runBatch,
      pendingCount,
      canStartRanking,
      addHistoryEntry,
      canAnalyze,
      isPro,
      increment,
      FREE_LIMIT,
    }),
    [
      isDark,
      t,
      apiKey,
      items,
      isRunning,
      showUpgradeModal,
      expandedId,
      rejectionToast,
      confirmResetOpen,
      rankPlatform,
      rankTestType,
      dropzoneDrag,
      stopAfterCurrentUi,
      allDone,
      ranked,
      previewUrls,
      addFiles,
      removeItem,
      runBatch,
      pendingCount,
      canStartRanking,
      addHistoryEntry,
      canAnalyze,
      isPro,
      increment,
      FREE_LIMIT,
    ],
  );

  return <RankBatchContext.Provider value={value}>{children}</RankBatchContext.Provider>;
}

export function useRankBatch(): RankBatchContextValue {
  const ctx = useContext(RankBatchContext);
  if (!ctx) {
    throw new Error("useRankBatch must be used within RankBatchProvider");
  }
  return ctx;
}
