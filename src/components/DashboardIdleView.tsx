// DashboardIdleView.tsx — Manus-style centered idle state for /app

import { useRef, useState, useCallback, useEffect } from "react";
import { BarChart3, GitCompare, Layers, FlaskConical, Paperclip, Upload } from "lucide-react";
import { type HistoryEntry } from "../hooks/useHistory";
import {
  isAcceptedUploadFile,
  UPLOAD_IMAGE_MIMES,
  UPLOAD_VIDEO_MIMES,
} from "../utils/uploadFileValidation";

const ACCEPTED_TYPES = [...UPLOAD_VIDEO_MIMES, ...UPLOAD_IMAGE_MIMES];
const MAX_SIZE_MB = 200;

const FORMAT_PILLS = ["MP4", "MOV", "WEBM", "JPG", "PNG"];

const QUICK_STARTS: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: "file" | string;
}[] = [
  { id: "analyze", label: "Analyze Creative", icon: BarChart3, action: "file" },
  { id: "compare", label: "Compare Videos", icon: GitCompare, action: "compare" },
  { id: "preflight", label: "A/B Test", icon: FlaskConical, action: "preflight" },
  { id: "batch", label: "Batch Analysis", icon: Layers, action: "batch" },
];

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface DashboardIdleViewProps {
  onFileSelect: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  historyEntries?: HistoryEntry[];
  onHistoryEntryClick?: (entry: HistoryEntry) => void;
  onModeChange: (mode: string) => void;
}

export function DashboardIdleView({
  onFileSelect,
  onUrlSubmit,
  historyEntries,
  onHistoryEntryClick,
  onModeChange,
}: DashboardIdleViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastedUrl, setPastedUrl] = useState<string | null>(null);

  // Global paste listener for URLs
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && /^https?:\/\//.test(text)) {
        setPastedUrl(text);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const validate = (f: File): string | null => {
    if (!isAcceptedUploadFile(f, true)) {
      return "Unsupported format. Use MP4, WebM, MOV, PNG, JPEG, or WebP.";
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Max ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const handleFile = useCallback(
    (f: File) => {
      const err = validate(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFileSelect(f);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const handleQuickStart = (action: "file" | string) => {
    if (action === "file") {
      fileInputRef.current?.click();
    } else {
      onModeChange(action);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-16">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        {/* Hero heading */}
        <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight text-center mb-2">
          What do you want to analyze?
        </h1>
        <p className="text-sm text-zinc-500 text-center mb-8">
          Drop any ad creative and get AI-powered scores in seconds
        </p>

        {/* Upload input area */}
        <div
          className={[
            "w-full rounded-2xl border transition-all cursor-pointer",
            isDragging
              ? "bg-indigo-500/[0.06] border-indigo-500/40 shadow-[0_0_24px_rgba(99,102,241,0.1)]"
              : "bg-white/[0.03] border-white/10 hover:border-white/20",
          ].join(" ")}
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="flex items-center gap-3 p-4">
            <div className={`p-2.5 rounded-xl transition-colors ${isDragging ? "bg-indigo-500/15 text-indigo-400" : "bg-white/5 text-zinc-400 hover:bg-white/10"}`}>
              {isDragging ? <Upload size={18} /> : <Paperclip size={18} />}
            </div>
            <span className="text-sm text-zinc-500 flex-1">
              {isDragging ? "Drop to upload..." : "Drop a video or image, or click to browse..."}
            </span>
          </div>

          {/* Format line — single muted text instead of 5 pills */}
          <div className="px-4 pb-3.5">
            <span className="text-[11px] text-zinc-600 font-mono tracking-wide">
              {FORMAT_PILLS.join(' · ')} · Max 200MB
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mt-2 animate-[shake_0.3s_ease-in-out]">{error}</p>
        )}

        {/* Pasted URL input */}
        {pastedUrl && (
          <div className="w-full mt-3 flex gap-2 animate-[fadeIn_0.2s_ease-out]">
            <input
              type="text"
              value={pastedUrl}
              onChange={(e) => setPastedUrl(e.target.value)}
              className="flex-1 bg-white/5 rounded-xl text-sm text-white px-4 py-2.5 outline-none border border-white/10 focus:border-indigo-500/50"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (pastedUrl && onUrlSubmit) onUrlSubmit(pastedUrl);
                setPastedUrl(null);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
            >
              Go
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />

        {/* Secondary features preview */}
        <div className="w-full mt-6 flex flex-col items-center gap-3">
          <div style={{ width: "80%", borderTop: "1px dotted rgba(255,255,255,0.08)" }} />
          <p style={{ fontSize: 12, color: "var(--ink-faint, #3f3f46)", margin: 0, textAlign: "center" }}>
            After analysis: AI brief &middot; CTA rewrites &middot; share link &middot; PDF export
          </p>
        </div>

        {/* Quick-start cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mt-8">
          {QUICK_STARTS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleQuickStart(card.action)}
              className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col items-center gap-2.5 text-center hover:bg-white/[0.06] hover:border-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors">
                <card.icon size={20} className="text-indigo-400" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">{card.label}</span>
            </button>
          ))}
        </div>

        {/* Recent analyses */}
        {historyEntries && historyEntries.length > 0 && (
          <div className="w-full mt-10">
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-mono mb-3">
              Recent analyses
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {historyEntries.slice(0, 6).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onHistoryEntryClick?.(entry)}
                  className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3 hover:bg-white/[0.06] hover:border-white/10 transition-all text-left"
                >
                  {entry.thumbnailDataUrl ? (
                    <img
                      src={entry.thumbnailDataUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {entry.fileName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{entry.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {entry.scores && (
                        <span className="text-xs font-mono text-zinc-500">
                          {entry.scores.overall}/10
                        </span>
                      )}
                      <span className="text-xs text-zinc-600">{timeAgo(entry.timestamp)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Powered by */}
        <div className="flex items-center justify-center gap-2 mt-12 opacity-30">
          <span className="text-xs text-zinc-600 font-mono">Powered by Gemini + Claude</span>
        </div>
      </div>
    </div>
  );
}
