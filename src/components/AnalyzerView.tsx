import { AnimatePresence } from "framer-motion";
import { AnalysisStatus, AnalysisResult } from "../services/analyzerService";
import { HistoryEntry } from "../hooks/useHistory";
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
}

export function AnalyzerView({
  file,
  status,
  statusMessage,
  result,
  error,
  thumbnailDataUrl,
  onFileSelect,
  onUrlSubmit,
  onAnalyze,
  onReset,
  onCopy,
  onExportPdf,
  onShare,
  copied,
  shareLoading,
  historyEntries,
  onHistoryEntryClick,
  onModeChange,
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
        <div key="progress" className="flex-1 flex items-center justify-center p-4 md:p-8">
          <ProgressCard
            file={file!}
            status={status}
            statusMessage={statusMessage}
            onCancel={onReset}
          />
        </div>
      )}

      {status === "error" && (
        <div key="error" className="flex-1 flex items-center justify-center p-4 md:p-8">
          <ErrorCard
            error={error}
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
          />
        </div>
      )}
    </AnimatePresence>
  );
}
