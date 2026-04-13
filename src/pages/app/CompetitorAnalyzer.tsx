// src/pages/app/CompetitorAnalyzer.tsx — Step-based competitor analysis
// Thin orchestrator — UI extracted to CompetitorUploadStep + CompetitorConfigStep

import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CompetitorResultPanel } from "../../components/CompetitorResult";
import { CompetitorLoadingView } from "../../components/CompetitorLoadingView";
import { CompetitorUploadStep } from "../../components/competitor/CompetitorUploadStep";
import { CompetitorConfigStep } from "../../components/competitor/CompetitorConfigStep";
import { analyzeCompetitor, type CompetitorResult } from "../../services/competitorService";
import type { AppSharedContext } from "../../components/AppLayout";
import { cn } from "@/src/lib/utils";

const API_KEY = ""; // Gemini calls are now server-side via /api/analyze

const SLIDE = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } };

type Platform = "all" | "Meta" | "TikTok" | "Google" | "YouTube";
type Format = "video" | "static";
/** 0 = dual upload, 2 = configure + run, 3 = results */
type Step = 0 | 2 | 3;

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function CompetitorAnalyzer() {
  const { canAnalyze, isPro, increment, FREE_LIMIT, onUpgradeRequired, registerCallbacks } =
    useOutletContext<AppSharedContext>();

  const [step, setStep] = useState<Step>(0);
  const [platform, setPlatform] = useState<Platform>("all");
  const [format, setFormat] = useState<Format>("video");
  const [yourFile, setYourFile] = useState<File | null>(null);
  const [competitorFile, setCompetitorFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const handleReset = useCallback(() => {
    setStep(0); setYourFile(null); setCompetitorFile(null);
    setStatus("idle"); setStatusMsg(""); setResult(null); setError(null);
  }, []);

  useEffect(() => {
    registerCallbacks({ onNewAnalysis: handleReset, onHistoryOpen: () => {}, hasResult: step === 3 });
  }, [registerCallbacks, handleReset, step]);

  const handleAnalyze = async () => {
    if (!yourFile || !competitorFile || !canAnalyze) return;
    setStatus("analyzing"); setError(null); setResult(null); setStep(2);
    try {
      const r = await analyzeCompetitor(yourFile, competitorFile, API_KEY, platform, format, (m) => setStatusMsg(m));
      setResult(r); setStatus("complete"); setStep(3);
      const c = increment(); if (c >= FREE_LIMIT && !isPro) onUpgradeRequired("analyze");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  const handleRetry = () => {
    setStatus("idle"); setError(null); setResult(null);
    handleAnalyze();
  };

  const isAnalyzing = status === "analyzing" && !!yourFile && !!competitorFile;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
      <Helmet>
        <title>Competitor Analysis — Cutsheet</title>
        <meta name="description" content="Upload two ads. Get a scored gap analysis and action plan." />
        <link rel="canonical" href="https://cutsheet.xyz/app/competitor" />
      </Helmet>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {isAnalyzing ? (
          <motion.div
            key="competitor-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="relative flex min-h-[calc(100vh-100px)] flex-col bg-[color:var(--bg)]"
          >
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                backgroundImage: "var(--competitor-upload-ambient)",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 65%",
              }}
              aria-hidden
            />
            <div className="relative z-[1] flex flex-1 flex-col">
              <CompetitorLoadingView
                yourFile={yourFile}
                competitorFile={competitorFile}
                format={format}
                statusMessage={statusMsg || "Analyzing both ads..."}
                onCancel={handleReset}
              />
            </div>
          </motion.div>
        ) : (
        <div
          className={cn(
            "flex w-full flex-col",
            step === 0
              ? "min-h-[min(100%,calc(100vh-120px))] flex-1 items-center justify-center px-6 py-8"
              : "mx-auto max-w-[760px] px-5 py-8 sm:px-6 sm:py-10",
          )}
        >
          <AnimatePresence mode="wait">

            {/* ── UPLOAD — centered idle ───────────────── */}
            {step === 0 && (
              <CompetitorUploadStep
                yourFile={yourFile}
                competitorFile={competitorFile}
                onYourFileSelect={(f) => setYourFile(f)}
                onCompetitorFileSelect={(f) => setCompetitorFile(f)}
                onYourFileRemove={() => setYourFile(null)}
                onCompetitorFileRemove={() => setCompetitorFile(null)}
                onNext={() => setStep(2)}
              />
            )}

            {/* ── STEP 2: CONFIGURE + COMPARE ────────────────────── */}
            {step === 2 && status !== "analyzing" && status !== "complete" && (
              <CompetitorConfigStep
                yourFile={yourFile}
                competitorFile={competitorFile}
                platform={platform}
                format={format}
                error={error}
                canAnalyze={canAnalyze}
                onPlatformChange={setPlatform}
                onFormatChange={setFormat}
                onYourFileRemove={() => { setYourFile(null); setStep(0); }}
                onCompetitorFileRemove={() => { setCompetitorFile(null); setStep(0); }}
                onBack={() => setStep(0)}
                onAnalyze={handleAnalyze}
                onRetry={handleRetry}
                onReset={handleReset}
              />
            )}

            {/* ── STEP 3: RESULTS ─────────────────────────────────── */}
            {step === 3 && result && (
              <motion.div key="s3" {...SLIDE} className="pt-5">
                <CompetitorResultPanel
                  result={result}
                  yourFileName={yourFile?.name ?? "Your Ad"}
                  competitorFileName={competitorFile?.name ?? "Competitor"}
                  yourFile={yourFile ?? undefined}
                  competitorFile={competitorFile ?? undefined}
                  onStartOver={handleReset}
                  onReanalyze={() => {
                    setResult(null);
                    setStatus("idle");
                    setError(null);
                    setStep(2);
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes progressSlide { 0% { transform: translateX(-100%) } 100% { transform: translateX(350%) } }
      `}</style>
    </div>
  );
}
