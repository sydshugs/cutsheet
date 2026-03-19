import { useMemo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { sanitizeFileName } from "../utils/sanitize";
import { Copy, FileDown, Share2 } from "lucide-react";

interface ReportCardsProps {
  file: File | null;
  markdown: string;
  thumbnailDataUrl?: string;
  onCopy: () => void;
  onExportPdf: () => void;
  onShare: () => void;
  copied?: boolean;
  shareLoading?: boolean;
  onReset?: () => void;
  onFileSelect?: (file: File | null) => void;
}

const JSON_TITLE_RE = /json|scene|raw\s*data|budget\s*recommend/i;
const JSON_CONTENT_RE = /^\s*[\[{]/;

function splitMarkdown(md: string): { title: string | null; content: string }[] {
  const sections = md.split(/\n(?=## )/);
  return sections.map(section => {
    const match = section.match(/^## (.+)\n([\s\S]*)$/);
    if (match) return { title: match[1], content: match[2].trim() };
    return { title: null, content: section.trim() };
  }).filter(s => {
    if (!s.content) return false;
    // Filter out sections with JSON-related titles (SCENE JSON, Raw Data, etc.)
    if (s.title && JSON_TITLE_RE.test(s.title)) return false;
    // Filter out sections whose content is raw JSON
    const trimmed = s.content.trim();
    if (JSON_CONTENT_RE.test(trimmed) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) return false;
    // Filter out sections that contain "scenes": [ ... ] pattern
    if (/"scenes"\s*:\s*\[/.test(trimmed)) return false;
    return true;
  });
}

export function ReportCards({ file, markdown, thumbnailDataUrl, onCopy, onExportPdf, onShare, copied, shareLoading, onReset, onFileSelect }: ReportCardsProps) {
  const isImage = file?.type.startsWith("image/") ?? false;
  const fileUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [fileUrl]);

  const sections = useMemo(() => splitMarkdown(markdown), [markdown]);

  return (
    <div className="flex flex-col">
      {/* Media preview — image or video */}
      {file && fileUrl && (
        <div>
          {isImage ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <img
                src={fileUrl}
                alt={sanitizeFileName(file.name)}
                style={{
                  maxWidth: "100%",
                  maxHeight: 600,
                  objectFit: "contain",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={fileUrl}
              poster={thumbnailDataUrl ?? undefined}
              controls
              className="rounded-2xl border border-white/5 overflow-hidden max-h-[320px] w-full object-contain bg-black"
            />
          )}
          <p className="text-xs text-zinc-500 font-mono mt-2">
            {sanitizeFileName(file.name)} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      )}

      {/* Mini dropzone — between media and analysis */}
      {onReset && onFileSelect && (
        <div
          style={{
            marginTop: 12,
            height: 52,
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 150ms",
          }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "video/*,image/*";
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) { onReset(); setTimeout(() => onFileSelect(f), 50); }
            };
            input.click();
          }}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; const f = e.dataTransfer.files[0]; if (f) { onReset(); setTimeout(() => onFileSelect(f), 50); } }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: 11, color: "#52525b" }}>Drop new creative or click to browse</span>
        </div>
      )}

      {/* Report section label */}
      <p className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-4 mt-6">ANALYSIS</p>

      {/* Report cards */}
      <div className="flex flex-col gap-3">
        {sections.map((section, i) => (
          <div key={i} className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5">
            {section.title && (
              <h3 className="text-sm font-semibold text-white mb-2">{section.title}</h3>
            )}
            <div className="text-sm text-zinc-400 leading-relaxed [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1 [&_code]:bg-white/5 [&_code]:rounded [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_p:last-child]:mb-0">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 px-4 md:px-6 py-3 flex items-center gap-3 mt-6 -mx-4 md:-mx-8 -mb-6">
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl px-4 py-2 transition-colors"
        >
          <Copy size={14} />
          {copied ? "Copied!" : "Copy Report"}
        </button>
        <button
          onClick={onExportPdf}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-sm rounded-xl px-4 py-2 transition-colors"
        >
          <FileDown size={14} />
          Export PDF
        </button>
        <button
          onClick={onShare}
          disabled={shareLoading}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors disabled:opacity-50 ml-auto"
        >
          <Share2 size={14} />
          {shareLoading ? "Creating…" : "Share"}
        </button>
      </div>
    </div>
  );
}
