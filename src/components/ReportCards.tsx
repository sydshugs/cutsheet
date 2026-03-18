import { useMemo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
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
}

function splitMarkdown(md: string): { title: string | null; content: string }[] {
  // Strip trailing JSON blocks (scenes data, raw objects) that Gemini sometimes appends
  const cleaned = md.replace(/\n```(?:json)?\s*\n\{[\s\S]*?\}\s*\n```/g, '')
    .replace(/\n\{[\s\S]*"scenes"[\s\S]*\}\s*$/, '');

  const sections = cleaned.split(/\n(?=## )/);
  return sections.map(section => {
    const match = section.match(/^## (.+)\n([\s\S]*)$/);
    if (match) return { title: match[1], content: match[2].trim() };
    return { title: null, content: section.trim() };
  }).filter(s => {
    if (!s.content) return false;
    // Filter out sections that are just raw JSON
    const trimmed = s.content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return false;
    return true;
  });
}

export function ReportCards({ file, markdown, thumbnailDataUrl, onCopy, onExportPdf, onShare, copied, shareLoading }: ReportCardsProps) {
  const videoUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); };
  }, [videoUrl]);

  const sections = useMemo(() => splitMarkdown(markdown), [markdown]);

  return (
    <div className="flex flex-col">
      {/* Video preview */}
      {file && videoUrl && (
        <div>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailDataUrl ?? undefined}
            controls
            className="rounded-2xl border border-white/5 overflow-hidden max-h-[320px] w-full object-contain bg-black"
          />
          <p className="text-xs text-zinc-500 font-mono mt-2">
            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
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
