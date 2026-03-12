import { AnimatePresence } from "framer-motion";
import { AnalysisStatus, AnalysisResult } from "../services/analyzerService";
import { HistoryEntry } from "../hooks/useHistory";
import { VideoDropzone } from "./VideoDropzone";
import { ProgressCard } from "./ProgressCard";
import { ErrorCard } from "./ErrorCard";
import { ReportCards } from "./ReportCards";

interface AnalyzerViewProps {
  file: File | null;
  status: AnalysisStatus;
  statusMessage: string;
  result: AnalysisResult | null;
  error: string | null;
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
}

export function AnalyzerView({
  file,
  status,
  statusMessage,
  result,
  error,
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
}: AnalyzerViewProps) {
  return (
    <AnimatePresence mode="wait">
      {status === "idle" && (
        <div key="idle" className="flex-1 flex flex-col items-center justify-center p-8">
          <VideoDropzone
            onFileSelect={onFileSelect}
            file={file}
            onUrlSubmit={onUrlSubmit}
          />
          {historyEntries && historyEntries.length > 0 && (
            <div className="max-w-[640px] mx-auto mt-6">
              <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono mb-3">Recent</p>
              <div className="flex gap-3 overflow-x-auto">
                {historyEntries.slice(0, 4).map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => onHistoryEntryClick?.(entry)}
                    className="bg-white/5 rounded-2xl border border-white/5 p-3 flex items-center gap-3 min-w-[180px] hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {entry.fileName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-400 truncate">{entry.fileName}</p>
                      {entry.scores && (
                        <span className="text-xs font-mono text-zinc-500">
                          {entry.scores.overall}/10
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(status === "uploading" || status === "processing") && (
        <div key="progress" className="flex-1 flex items-center justify-center p-8">
          <ProgressCard
            file={file!}
            status={status}
            statusMessage={statusMessage}
            onCancel={onReset}
          />
        </div>
      )}

      {status === "error" && (
        <div key="error" className="flex-1 flex items-center justify-center p-8">
          <ErrorCard
            error={error}
            onRetry={onAnalyze}
            onReset={onReset}
          />
        </div>
      )}

      {status === "complete" && result && (
        <div key="complete" className="flex-1 overflow-y-auto">
          <ReportCards
            file={file}
            markdown={result.markdown}
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
