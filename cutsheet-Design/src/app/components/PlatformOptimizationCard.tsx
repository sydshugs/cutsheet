import React, { useState } from "react";
import { 
  BarChart2, 
  ChevronDown, 
  Music2, 
  Camera, 
  Youtube, 
  Facebook, 
  Instagram,
  Sparkles,
  CheckCircle,
  XCircle
} from "lucide-react";

type PlatformType = "TikTok" | "Instagram Reels" | "YouTube Shorts" | "Meta Feed" | "Instagram Feed" | "Pinterest";

interface Signal {
  type: "pass" | "fail";
  label: string;
}

interface PlatformData {
  name: PlatformType;
  score: number;
  verdict: string;
  signals: Signal[];
  recommendations: string[];
}

const PLATFORM_ICONS: Record<PlatformType, React.ElementType> = {
  "TikTok": Music2,
  "Instagram Reels": Camera,
  "YouTube Shorts": Youtube,
  "Meta Feed": Facebook,
  "Instagram Feed": Instagram,
  "Pinterest": Camera,
};

const PLATFORM_COLORS: Record<PlatformType, { bg: string, text: string }> = {
  "TikTok": { bg: "bg-rose-500/[0.1]", text: "text-rose-500" },
  "Instagram Reels": { bg: "bg-pink-500/[0.1]", text: "text-pink-500" },
  "YouTube Shorts": { bg: "bg-red-500/[0.1]", text: "text-red-500" },
  "Meta Feed": { bg: "bg-blue-500/[0.1]", text: "text-blue-500" },
  "Instagram Feed": { bg: "bg-pink-500/[0.1]", text: "text-pink-500" },
  "Pinterest": { bg: "bg-red-500/[0.1]", text: "text-red-400" },
};

const DATA_ORGANIC_VIDEO: PlatformData[] = [
  {
    name: "TikTok",
    score: 8.5,
    verdict: "Strong native feel with excellent pacing for the For You page.",
    signals: [
      { type: "pass", label: "Vertical 9:16" },
      { type: "pass", label: "Fast Hook" },
      { type: "fail", label: "Trending Audio" }
    ],
    recommendations: [
      "Add a trending background track at 10% volume to increase FYP distribution.",
      "Consider adding native TikTok text-to-speech for the first 3 seconds."
    ]
  },
  {
    name: "Instagram Reels",
    score: 8.1,
    verdict: "Great visual quality and strong Reels aesthetic. Minor UI zone issues.",
    signals: [
      { type: "pass", label: "Vertical 9:16" },
      { type: "pass", label: "High-res Text" },
      { type: "fail", label: "Clean UI Zones" }
    ],
    recommendations: [
      "Move lower-third text up by 15% to avoid the Reels UI overlay.",
      "Increase text contrast and use a more premium sans-serif font."
    ]
  },
  {
    name: "YouTube Shorts",
    score: 6.2,
    verdict: "Pacing is slightly slow for the Shorts feed. A tighter edit would help.",
    signals: [
      { type: "pass", label: "Vertical 9:16" },
      { type: "fail", label: "Loopable" },
      { type: "fail", label: "Action-packed" }
    ],
    recommendations: [
      "Cut the first 1.5 seconds of dead air to get straight to the action.",
      "Add a seamless loop transition at the end to encourage re-watches."
    ]
  }
];

const DATA_ORGANIC_STATIC: PlatformData[] = [
  {
    name: "Meta Feed",
    score: 7.8,
    verdict: "Strong static creative with good thumb-stop potential for the Meta feed.",
    signals: [
      { type: "pass", label: "Square 1:1" },
      { type: "pass", label: "Clear CTA" },
      { type: "fail", label: "Mobile text size" }
    ],
    recommendations: [
      "Increase headline font size by 20% for better mobile legibility.",
      "Test a version with a bold color border to stand out in the feed."
    ]
  },
  {
    name: "Instagram Feed",
    score: 6.9,
    verdict: "Good visual composition but needs more polish for Instagram's aesthetic.",
    signals: [
      { type: "pass", label: "Square 1:1" },
      { type: "fail", label: "High-contrast visuals" },
      { type: "fail", label: "Premium aesthetic" }
    ],
    recommendations: [
      "Increase image contrast and saturation slightly for the Instagram feed.",
      "Ensure branding is consistent with your Instagram profile grid aesthetic."
    ]
  },
  {
    name: "Pinterest",
    score: 5.2,
    verdict: "Requires reformatting to 2:3 vertical ratio and stronger visual hierarchy.",
    signals: [
      { type: "fail", label: "Vertical 2:3" },
      { type: "pass", label: "Inspirational tone" },
      { type: "fail", label: "Text overlay" }
    ],
    recommendations: [
      "Reformat to 1000×1500px (2:3) — Pinterest's optimal pin ratio.",
      "Add a short text overlay title to improve discoverability in search."
    ]
  }
];

const DATA: PlatformData[] = [
  {
    name: "TikTok",
    score: 8.5,
    verdict: "Strong native feel with excellent pacing for the For You page.",
    signals: [
      { type: "pass", label: "Vertical 9:16" },
      { type: "pass", label: "Fast Hook" },
      { type: "fail", label: "Trending Audio" }
    ],
    recommendations: [
      "Add a trending background track at 10% volume to increase FYP distribution.",
      "Consider adding native TikTok text-to-speech for the first 3 seconds."
    ]
  },
  {
    name: "Instagram Reels",
    score: 6.5,
    verdict: "Good visual quality but lacks the polished aesthetic typical of top-performing Reels.",
    signals: [
      { type: "pass", label: "Vertical 9:16" },
      { type: "fail", label: "High-res Text" },
      { type: "fail", label: "Clean UI Zones" }
    ],
    recommendations: [
      "Move lower-third text up by 15% to avoid the Reels UI overlay.",
      "Increase text contrast and use a more premium sans-serif font."
    ]
  },
  {
    name: "YouTube Shorts",
    score: 4.5,
    verdict: "Pacing is too slow for the Shorts feed. Requires a tighter edit.",
    signals: [
      { type: "pass", label: "Vertical 9:16" },
      { type: "fail", label: "Loopable" },
      { type: "fail", label: "Action-packed" }
    ],
    recommendations: [
      "Cut the first 1.5 seconds of dead air to get straight to the action.",
      "Add a seamless loop transition at the end to encourage re-watches."
    ]
  }
];

function getScoreColor(score: number) {
  if (score >= 7) return "text-[#10b981]";
  if (score >= 5) return "text-[#f59e0b]";
  return "text-[#ef4444]";
}

function getScoreLabel(score: number): { label: string; classes: string } {
  if (score >= 7) return { label: "EXCELLENT", classes: "bg-emerald-500/[0.10] text-emerald-400 border border-emerald-500/20" };
  if (score >= 5) return { label: "GOOD",      classes: "bg-amber-500/[0.10]  text-amber-400  border border-amber-500/20"  };
  return             { label: "FAIR",           classes: "bg-red-500/[0.10]    text-red-400    border border-red-500/20"    };
}

function getScoreBarColor(score: number) {
  if (score >= 7) return "bg-[#10b981]";
  if (score >= 5) return "bg-[#f59e0b]";
  return "bg-[#ef4444]";
}

export function PlatformOptimizationCard({ variant }: { variant?: "organic-static" | "organic-video" }) {
  const activeData = variant === "organic-static" ? DATA_ORGANIC_STATIC : variant === "organic-video" ? DATA_ORGANIC_VIDEO : DATA;
  const [expandedRows, setExpandedRows] = useState<number[]>([0]);

  const toggleRow = (index: number) => {
    setExpandedRows(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#18181b] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
          <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">Platform Optimization</h3>
        <span className="text-xs text-zinc-600 ml-auto">3 platforms analyzed</span>
      </div>

      {/* PLATFORM CARDS */}
      <div className="flex flex-col">
        {activeData.map((platform, index) => {
          const isExpanded = expandedRows.includes(index);
          const Icon = PLATFORM_ICONS[platform.name];
          const colors = PLATFORM_COLORS[platform.name];
          const scoreColor = getScoreColor(platform.score);
          const scoreBarColor = getScoreBarColor(platform.score);
          const { label: scoreLabel, classes: scoreLabelClasses } = getScoreLabel(platform.score);
          const isLast = index === activeData.length - 1;

          return (
            <div key={platform.name} className={`flex flex-col ${!isLast ? 'border-b border-white/[0.04]' : ''}`}>
              {/* Collapsed Header Row */}
              <div 
                className="px-4 py-3 flex flex-col cursor-pointer hover:bg-white/[0.02] transition-colors gap-2.5"
                onClick={() => toggleRow(index)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                  </div>
                  <span className="text-sm font-medium text-zinc-200">{platform.name}</span>
                  
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${scoreLabelClasses}`}>
                    {scoreLabel}
                  </span>
                  
                  <div className="ml-auto flex items-center gap-2">
                    <span className={`text-sm font-bold ${scoreColor}`}>{platform.score.toFixed(1)}</span>
                    <span className="text-xs text-zinc-600">/10</span>
                    <ChevronDown className={`w-3 h-3 text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                {/* Thin Score Bar */}
                <div className="w-full h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${scoreBarColor}`}
                    style={{ width: `${(platform.score / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="px-4 py-3 border-t border-white/[0.04] flex flex-col">
                  {/* Verdict Block */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2.5 mb-3 flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-indigo-400 mt-[2px] shrink-0" />
                    <p className="text-xs text-zinc-400 italic leading-relaxed">{platform.verdict}</p>
                  </div>

                  {/* Quick Checks Row */}
                  <div className="flex flex-col mb-3">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">QUICK CHECKS</span>
                    <div className="flex flex-wrap gap-2">
                      {platform.signals.map((signal, idx) => (
                        <div 
                          key={idx}
                          className={`text-[10px] font-medium rounded-lg px-2 py-1 flex items-center gap-1 ${
                            signal.type === 'pass' 
                              ? 'bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400' 
                              : 'bg-red-500/[0.08] border border-red-500/15 text-red-400'
                          }`}
                        >
                          {signal.type === 'pass' ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          {signal.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">RECOMMENDATIONS</span>
                    <div className="flex flex-col">
                      {platform.recommendations.map((rec, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-start gap-2 py-2 ${idx !== platform.recommendations.length - 1 ? 'border-b border-white/[0.03]' : ''}`}
                        >
                          <div className="w-4 h-4 rounded bg-indigo-500/[0.10] text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}