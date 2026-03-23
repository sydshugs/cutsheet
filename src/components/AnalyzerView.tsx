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
  onCheckPolicies?: () => void;
  onCompare?: () => void;
  fixItLoading?: boolean;
  fixItResult?: any;
  policyLoading?: boolean;
  policyResult?: any;
  visualizeLoading?: boolean;
  visualizeResult?: any;
  designReviewSlot?: React.ReactNode;
  secondEyeSlot?: React.ReactNode;
  designReviewData?: { flags: { area: string; severity: string; fix: string; issue: string }[]; topIssue?: string; overallDesignVerdict?: string };
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
  onCheckPolicies,
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
            icon={icon}
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
            onCheckPolicies={onCheckPolicies}
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
          />
        </div>
      )}
    </AnimatePresence>
  );
}
