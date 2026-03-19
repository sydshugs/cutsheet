// useVideoAnalyzer.ts — Analysis hook with categorized error types

import { useState, useCallback } from "react";
import {
  analyzeVideo,
  downloadMarkdown,
  copyToClipboard,
  type AnalysisResult,
  type AnalysisStatus,
} from "../services/analyzerService";

export type AnalysisErrorType = "timeout" | "rate_limit" | "api_down" | "malformed" | "network" | "unknown";

export interface AnalysisError {
  type: AnalysisErrorType;
  message: string;
  recovery: string;
  severity: "red" | "amber";
}

const ERROR_MAP: Record<AnalysisErrorType, Omit<AnalysisError, "type">> = {
  timeout: {
    message: "Analysis is taking longer than usual",
    recovery: "Try uploading a shorter clip — under 30 seconds works best",
    severity: "amber",
  },
  rate_limit: {
    message: "We're processing a lot of videos right now",
    recovery: "Your file is still loaded — wait 30 seconds then retry",
    severity: "amber",
  },
  api_down: {
    message: "Video analysis isn't available right now",
    recovery: "This is on our end — check back in a few minutes",
    severity: "red",
  },
  malformed: {
    message: "Something went wrong reading the results",
    recovery: "This sometimes happens with unusual formats — try re-analyzing",
    severity: "red",
  },
  network: {
    message: "Your connection dropped during analysis",
    recovery: "Check your internet — your file is still loaded",
    severity: "amber",
  },
  unknown: {
    message: "Something went wrong",
    recovery: "Your file is still loaded — try again",
    severity: "red",
  },
};

function categorizeError(err: unknown): AnalysisError {
  if (err instanceof DOMException && err.name === "AbortError") {
    return { type: "timeout", ...ERROR_MAP.timeout };
  }
  if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("Failed to fetch"))) {
    return { type: "network", ...ERROR_MAP.network };
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("429") || msg.includes("rate") || msg.includes("quota") || msg.includes("resource exhausted")) {
      return { type: "rate_limit", ...ERROR_MAP.rate_limit };
    }
    if (msg.includes("500") || msg.includes("503") || msg.includes("unavailable") || msg.includes("internal")) {
      return { type: "api_down", ...ERROR_MAP.api_down };
    }
    if (msg.includes("json") || msg.includes("parse") || msg.includes("unexpected token") || msg.includes("scores")) {
      return { type: "malformed", ...ERROR_MAP.malformed };
    }
    if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("abort")) {
      return { type: "timeout", ...ERROR_MAP.timeout };
    }
    if (msg.includes("network") || msg.includes("offline") || msg.includes("err_internet")) {
      return { type: "network", ...ERROR_MAP.network };
    }
  }
  return { type: "unknown", ...ERROR_MAP.unknown };
}

interface UseVideoAnalyzerReturn {
  status: AnalysisStatus;
  statusMessage: string;
  result: AnalysisResult | null;
  error: string | null;
  analysisError: AnalysisError | null;
  analyze: (file: File, apiKey: string, contextPrefix?: string, userContext?: string, sessionMemory?: string) => Promise<AnalysisResult | undefined>;
  download: () => void;
  copy: () => Promise<void>;
  reset: () => void;
}

export function useVideoAnalyzer(): UseVideoAnalyzerReturn {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<AnalysisError | null>(null);

  const analyze = useCallback(async (file: File, apiKey: string, contextPrefix?: string, userContext?: string, sessionMemory?: string): Promise<AnalysisResult | undefined> => {
    setError(null);
    setAnalysisError(null);
    setResult(null);

    try {
      const analysis = await analyzeVideo(file, apiKey, (s, msg) => {
        setStatus(s);
        setStatusMessage(msg ?? "");
      }, contextPrefix, userContext, sessionMemory);
      setResult(analysis);
      return analysis;
    } catch (err) {
      const categorized = categorizeError(err);
      setStatus("error");
      setError(categorized.message);
      setAnalysisError(categorized);
      return undefined;
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
    setAnalysisError(null);
  }, []);

  return { status, statusMessage, result, error, analysisError, analyze, download, copy, reset };
}
