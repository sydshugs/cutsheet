// useVideoAnalyzer.ts
// Drop this into src/hooks/useVideoAnalyzer.ts

import { useState, useCallback } from "react";
import {
  analyzeVideo,
  downloadMarkdown,
  copyToClipboard,
  type AnalysisResult,
  type AnalysisStatus,
} from "../services/analyzerService";

interface UseVideoAnalyzerReturn {
  // State
  status: AnalysisStatus;
  statusMessage: string;
  result: AnalysisResult | null;
  error: string | null;

  // Actions
  analyze: (file: File, apiKey: string, contextPrefix?: string, userContext?: string) => Promise<void>;
  download: () => void;
  copy: () => Promise<void>;
  reset: () => void;
}

export function useVideoAnalyzer(): UseVideoAnalyzerReturn {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File, apiKey: string, contextPrefix?: string, userContext?: string) => {
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeVideo(file, apiKey, (s, msg) => {
        setStatus(s);
        setStatusMessage(msg ?? "");
      }, contextPrefix, userContext);
      setResult(analysis);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const download = useCallback(() => {
    if (result) downloadMarkdown(result);
  }, [result]);

  const copy = useCallback(async () => {
    if (result) await copyToClipboard(result.markdown);
  }, [result]);

  const reset = useCallback(() => {
    setStatus("idle");
    setStatusMessage("");
    setResult(null);
    setError(null);
  }, []);

  return { status, statusMessage, result, error, analyze, download, copy, reset };
}
