import { AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnalysisStatus, AnalysisResult } from "../services/analyzerService";
import { HistoryEntry } from "../hooks/useHistory";
import type { AnalysisError } from "../hooks/useVideoAnalyzer";
import { VideoDropzone } from "./VideoDropzone";
import { ProgressCard } from "./ProgressCard";
import { ErrorCard } from "./ErrorCard";
import { ReportCards } from "./ReportCards";
import { DashboardIdleView } from "./DashboardIdleView";
interface AnalyzerViewProps {
  file: File | null;
  status: AnalysisStatus;
  statusMessage: string;
  result: AnalysisResult | null;
  error: string | null;
  analysisError?: AnalysisError | null;
  thumbnailDataUrl?: string;
  onFileSelect: (file: File | null) => void;
  onUrlSubmit?: (url: string) => void;
  onAnalyze: () => void;
  onReset: () => void;
  onCopy: () => void;
  onExportPdf: () => void;
  onShare: () => void;
  onGenerateBrief: () => void;
  onAddToSwipeFile: () => void;
  copied?: boolean;
  shareLoading?: boolean;
  historyEntries?: HistoryEntry[];
  onHistoryEntryClick?: (entry: HistoryEntry) => void;
  onModeChange?: (mode: string) => void;
  platform?: string;
  icon?: LucideIcon;
  // New props for redesigned layout
  format?: 'video' | 'static';
  niche?: string;
  onFixIt?: () => void;
  onVisualize?: () => void;
  onMotionPreview?: () => void;
  motionVideoUrl?: string | null;
  motionLoading?: boolean;
  motionError?: string | null;
  onCheckPolicies?: () => void;
  onSafeZone?: () => void;
  onCompare?: () => void;
  fixItLoading?: boolean;
  fixItResult?: { rewrittenHook?: { copy: string; reasoning: string }; revisedBody?: string; newCTA?: { copy: string; placement: string }; textOverlays?: { timestamp: string; copy: string; placement: string }[]; predictedImprovements?: { dimension: string; oldScore: number; newScore: number; reason: string }[] } | null;
  policyLoading?: boolean;
  policyResult?: { verdict: string; verdictLabel?: string; topFixes?: string[]; reviewerNotes?: string; metaCategories?: { name: string; status: string; finding?: string; fix?: string; riskLevel?: string }[]; tiktokCategories?: { name: string; status: string; finding?: string; fix?: string; riskLevel?: string }[] } | null;
  visualizeLoading?: boolean;
  visualizeResult?: { url?: string; type?: string } | null;
  designReviewSlot?: React.ReactNode;
  secondEyeSlot?: React.ReactNode;
  designReviewData?: { flags: { area: string; severity: string; fix: string; issue: string }[]; topIssue?: string; overallDesignVerdict?: string };
  secondEyeResult?: { scrollMoment: string | null; flags: { timestamp: string; category: string; severity: string; issue: string; fix: string }[]; whatItCommunicates: string; whatItFails: string } | null;
  secondEyeLoading?: boolean;
  isOrganic?: boolean;
  // Platform optimization scores for organic content
  platformScores?: { platform: string; score: number; verdict: string; signals?: { label: string; pass: boolean }[]; improvements?: string[] }[];
  platformScoresLoading?: boolean;
  /** `URL.createObjectURL(file)` owned by parent; passed through to ProgressCard so it reuses the same blob URL. */
  fileObjectUrl?: string | null;
}

export function AnalyzerView({
  file,
  status,
  statusMessage,
  result,
  error,
  analysisError,
  thumbnailDataUrl,
  onFileSelect,
  onUrlSubmit,
  onAnalyze,
  onReset,
  onCopy,
  onExportPdf,
  onShare,
  onGenerateBrief,
  copied,
  shareLoading,
  historyEntries,
  onHistoryEntryClick,
  onModeChange,
  platform,
  icon,
  format,
  niche,
  onFixIt,
  onVisualize,
  onMotionPreview,
  motionVideoUrl,
  motionLoading,
  motionError,
  onCheckPolicies,
  onSafeZone,
  onCompare,
  fixItLoading,
  fixItResult,
  policyLoading,
  policyResult,
  visualizeLoading,
  visualizeResult,
  designReviewSlot,
  secondEyeSlot,
  designReviewData,
  secondEyeResult: secondEyeResultProp,
  secondEyeLoading: secondEyeLoadingProp,
  isOrganic,
  platformScores,
  platformScoresLoading,
  fileObjectUrl,
}: AnalyzerViewProps) {
  return (
    <AnimatePresence mode="wait">
      {status === "idle" && !file && (
        <DashboardIdleView
          key="idle"
          onFileSelect={(f) => onFileSelect(f)}
          onUrlSubmit={onUrlSubmit}
          historyEntries={historyEntries}
          onHistoryEntryClick={onHistoryEntryClick}
          onModeChange={onModeChange ?? (() => {})}
        />
      )}

      {status === "idle" && file && (
        <div key="preview" className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <VideoDropzone
            onFileSelect={onFileSelect}
            file={file}
            onUrlSubmit={onUrlSubmit}
            acceptImages
          />
        </div>
      )}

      {(status === "uploading" || status === "processing") && (
        <div key="progress" className="flex-1 flex flex-col">
          <ProgressCard
            file={file!}
            status={status}
            statusMessage={statusMessage}
            onCancel={onReset}
            platform={platform}
            format={format}
            title={isOrganic ? "Analyzing your content" : undefined}
            sharedFileObjectUrl={fileObjectUrl}
          />
        </div>
      )}

      {status === "error" && (
        <div key="error" className="flex-1 flex items-center justify-center p-4 md:p-8">
          <ErrorCard
            error={error}
            analysisError={analysisError}
            onRetry={onAnalyze}
            onReset={onReset}
          />
        </div>
      )}

      {status === "complete" && result && (
        <div key="complete">
          <ReportCards
            file={file}
            markdown={result.markdown}
            thumbnailDataUrl={thumbnailDataUrl}
            onCopy={onCopy}
            onExportPdf={onExportPdf}
            onShare={onShare}
            copied={copied}
            shareLoading={shareLoading}
            onReset={onReset}
            onFileSelect={onFileSelect}
            verdict={result.verdict}
            structuredImprovements={result.structuredImprovements}
            improvements={result.improvements}
            scores={result.scores}
            format={format}
            platform={platform}
            niche={niche}
            hashtags={result.hashtags}
            onFixIt={onFixIt}
            onVisualize={onVisualize}
            onMotionPreview={onMotionPreview}
            motionVideoUrl={motionVideoUrl}
            motionLoading={motionLoading}
            motionError={motionError}
            onCheckPolicies={onCheckPolicies}
            onSafeZone={onSafeZone}
            onCompare={onCompare}
            onGenerateBrief={onGenerateBrief}
            fixItLoading={fixItLoading}
            fixItResult={fixItResult}
            policyLoading={policyLoading}
            policyResult={policyResult}
            visualizeLoading={visualizeLoading}
            visualizeResult={visualizeResult}
            designReviewSlot={designReviewSlot}
            secondEyeSlot={secondEyeSlot}
            designReviewData={designReviewData}
            secondEyeResult={secondEyeResultProp}
            secondEyeLoading={secondEyeLoadingProp}
            isOrganic={isOrganic}
            platformScores={platformScores}
            platformScoresLoading={platformScoresLoading}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
