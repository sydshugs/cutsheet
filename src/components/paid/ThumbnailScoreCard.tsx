// src/components/paid/ThumbnailScoreCard.tsx
// Post-analysis card: scores a video thumbnail across 5 dimensions

import { ImagePlay, XCircle, Youtube, Music2, Globe, RefreshCw } from "lucide-react";
import type { ThumbnailScoreResult } from "../../services/claudeService";

interface ThumbnailScoreCardProps {
  isLoading: boolean;
  thumbnailDataUrl: string | null;
  data: ThumbnailScoreResult | null;
  platform: string;
  onReanalyze: () => void;
}

function scoreColor(s: number) {
  if (s >= 7) return "#10b981";
  if (s >= 5) return "#f59e0b";
  return "#ef4444";
}

function scoreBg(s: number) {
  if (s >= 7) return "rgba(16,185,129,0.1)";
  if (s >= 5) return "rgba(245,158,11,0.1)";
  return "rgba(239,68,68,0.1)";
}

function scoreBorder(s: number) {
  if (s >= 7) return "rgba(16,185,129,0.2)";
  if (s >= 5) return "rgba(245,158,11,0.2)";
  return "rgba(239,68,68,0.2)";
}

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === "youtube" || p === "shorts") return <Youtube size={12} />;
  if (p === "tiktok") return <Music2 size={12} />;
  return <Globe size={12} />;
}

const DIMENSION_LABELS = [
  "Contrast",
  "Text Readability",
  "Face Visibility",
  "Emotion",
  "Curiosity Gap",
];

export function ThumbnailScoreCard({
  isLoading,
  thumbnailDataUrl,
  data,
  platform,
  onReanalyze,
}: ThumbnailScoreCardProps) {
  if (!isLoading && !data) return null;

  return (
    <div className="bg-[#18181b] border border-white/[0.06] rounded-[16px] pt-[25px] px-[25px] pb-px">
      <div className="flex flex-col gap-[12px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <ImagePlay size={14} color="#6366f1" />
            <span className="font-medium text-[13px] leading-[19.5px] text-[#f4f4f5]">
              Thumbnail Score
            </span>
          </div>

          {isLoading && (
            <div className="h-[20px] w-[96px] rounded-full bg-white/[0.06] opacity-[0.66] animate-pulse" />
          )}

          {data && (
            <div
              className="h-[16px] rounded-full flex items-center px-[9px] py-[3px] border"
              style={{
                background: scoreBg(data.overallScore),
                borderColor: scoreBorder(data.overallScore),
              }}
            >
              <span
                className="font-medium text-[10px] leading-[10px] whitespace-nowrap"
                style={{ color: scoreColor(data.overallScore) }}
              >
                {data.overallScore.toFixed(1)}/10
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail preview */}
        <div className="relative bg-[#09090b] rounded-[12px] overflow-hidden aspect-video">
          {isLoading && !thumbnailDataUrl && (
            <div className="absolute inset-0 bg-white/[0.06] animate-pulse" />
          )}
          {thumbnailDataUrl && (
            <img
              src={thumbnailDataUrl}
              alt="Video thumbnail frame"
              className="w-full h-full object-cover"
            />
          )}
          {/* Frame badge */}
          <div className="absolute bottom-[6px] left-[6px] flex items-center gap-[4px] bg-black/60 backdrop-blur-sm rounded-[6px] px-[6px] py-[3px]">
            <span className="text-[9px] font-medium text-white/70">Frame 0:00</span>
          </div>
          {/* Platform badge */}
          {data && (
            <div className="absolute bottom-[6px] right-[6px] flex items-center gap-[4px] bg-black/60 backdrop-blur-sm rounded-[6px] px-[6px] py-[3px] text-white/70">
              <PlatformIcon platform={data.platform} />
              <span className="text-[9px] font-medium">{data.platform}</span>
            </div>
          )}
        </div>

        {/* Dimension rows */}
        <div className="flex flex-col gap-[8px]">
          {DIMENSION_LABELS.map((label, i) => {
            const dim = data?.dimensions[i];
            return (
              <div key={label} className="flex items-center gap-[8px]">
                <span className="text-[11px] text-[#71717a] w-[100px] shrink-0 truncate">
                  {label}
                </span>
                <div className="flex-1 h-[4px] bg-white/[0.06] rounded-full overflow-hidden">
                  {isLoading && !dim && (
                    <div className="h-full w-[60%] bg-white/[0.06] animate-pulse rounded-full" />
                  )}
                  {dim && (
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dim.score * 10}%`,
                        backgroundColor: scoreColor(dim.score),
                      }}
                    />
                  )}
                </div>
                {isLoading && !dim && (
                  <div className="h-[10px] w-[24px] rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse shrink-0" />
                )}
                {dim && (
                  <span
                    className="text-[11px] font-medium w-[24px] text-right shrink-0"
                    style={{ color: scoreColor(dim.score) }}
                  >
                    {dim.score.toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Worst dimension callout */}
        {isLoading && !data && (
          <div className="h-[48px] rounded-[24px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
        )}
        {data && data.worstDimension.fix && (
          <div
            className="flex items-start gap-[8px] rounded-[12px] px-[12px] py-[10px] border"
            style={{
              background: "rgba(239,68,68,0.06)",
              borderColor: "rgba(239,68,68,0.12)",
            }}
          >
            <XCircle size={14} className="text-red-400 shrink-0 mt-[1px]" />
            <div className="flex flex-col gap-[2px] min-w-0">
              <span className="text-[11px] font-medium text-red-400">
                {data.worstDimension.label} ({data.worstDimension.score.toFixed(1)})
              </span>
              <span className="text-[11px] leading-[15px] text-[#a1a1aa]">
                {data.worstDimension.fix}
              </span>
            </div>
          </div>
        )}

        {/* Low CTR warning */}
        {data?.lowCTRWarning && (
          <div
            className="flex items-center gap-[6px] rounded-[8px] px-[10px] py-[6px] border"
            style={{
              background: "rgba(239,68,68,0.06)",
              borderColor: "rgba(239,68,68,0.12)",
            }}
          >
            <span className="text-[10px] font-medium text-red-400">
              Low CTR risk — thumbnail needs significant improvement
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-white/[0.06] pt-[13px] flex items-center justify-between">
          <span className="text-[11px] leading-[16.5px] text-[#71717a]">
            Optimized for {data?.platform || platform}
          </span>
          {data && (
            <button
              type="button"
              onClick={onReanalyze}
              className="flex items-center gap-[4px] text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <RefreshCw size={10} />
              Re-analyze
            </button>
          )}
          {isLoading && (
            <div className="h-[12px] w-[64px] rounded-[4px] bg-white/[0.06] opacity-[0.66] animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
