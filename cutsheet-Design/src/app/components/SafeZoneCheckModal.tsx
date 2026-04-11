import React, { useState } from "react";
import { 
  Shield, X, Sparkles, CheckCircle2, AlertTriangle, ChevronRight,
  ArrowLeft, Search, Heart, MessageCircle, Bookmark, Share2, Music,
  MoreVertical, Camera, Youtube, ThumbsUp, ThumbsDown, Send, MoreHorizontal, Maximize
} from "lucide-react";

interface SafeZoneCheckModalProps {
  onClose: () => void;
  imageSrc: string;
}

const PLATFORM_DATA: Record<string, any> = {
  'TikTok': {
    danger: { top: 70, bottom: 150, right: 60, left: 0 },
    safe: { top: 70, bottom: 150, right: 60, left: 10 }
  },
  'IG Reels': {
    danger: { top: 60, bottom: 140, right: 50, left: 0 },
    safe: { top: 60, bottom: 140, right: 50, left: 10 }
  },
  'YT Shorts': {
    danger: { top: 60, bottom: 130, right: 60, left: 0 },
    safe: { top: 60, bottom: 130, right: 60, left: 10 }
  },
  'IG Stories': {
    danger: { top: 70, bottom: 80, right: 0, left: 0 },
    safe: { top: 70, bottom: 80, right: 10, left: 10 }
  },
  'FB Reels': {
    danger: { top: 60, bottom: 140, right: 50, left: 0 },
    safe: { top: 60, bottom: 140, right: 50, left: 10 }
  },
  'Universal': {
    danger: { top: 80, bottom: 160, right: 60, left: 0 },
    safe: { top: 80, bottom: 160, right: 60, left: 10 }
  }
};

function MockupShell({ platform, imageSrc }: { platform: string, imageSrc: string }) {
  const data = PLATFORM_DATA[platform] || PLATFORM_DATA['Universal'];

  return (
    <div className="relative w-full max-w-[260px] aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 shadow-xl shrink-0 mx-auto border border-white/10">
      <img src={imageSrc} alt="Ad preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
      
      {/* Danger Zones */}
      <div className="absolute top-0 left-0 right-0 bg-red-500/20" style={{ height: data.danger.top }} />
      <div className="absolute bottom-0 left-0 right-0 bg-red-500/20" style={{ height: data.danger.bottom }} />
      {data.danger.right > 0 && (
        <div className="absolute right-0 bg-red-500/20" style={{ top: data.danger.top, bottom: data.danger.bottom, width: data.danger.right }} />
      )}
      
      {/* Safe Zone */}
      <div className="absolute border-2 border-dashed border-emerald-500/80 rounded-sm" 
           style={{ top: data.safe.top, bottom: data.safe.bottom, right: data.safe.right, left: data.safe.left }} />

      {/* Platform Overlays */}
      {platform === 'TikTok' && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <ArrowLeft size={16} className="text-white drop-shadow-md" />
            <div className="flex gap-4 text-[10px] font-semibold text-white/90 drop-shadow-md">
              <span>LIVE</span>
              <span className="text-white/50">Following</span>
              <span className="underline decoration-2 underline-offset-4">For You</span>
            </div>
            <Search size={16} className="text-white drop-shadow-md" />
          </div>
          <div className="absolute right-2 bottom-[160px] flex flex-col items-center gap-4 z-10">
            <div className="flex flex-col items-center gap-1"><Heart size={20} className="text-white drop-shadow-md fill-white/20"/><span className="text-[9px] text-white drop-shadow-md font-medium">124K</span></div>
            <div className="flex flex-col items-center gap-1"><MessageCircle size={20} className="text-white drop-shadow-md fill-white/20"/><span className="text-[9px] text-white drop-shadow-md font-medium">4,092</span></div>
            <div className="flex flex-col items-center gap-1"><Bookmark size={20} className="text-white drop-shadow-md fill-white/20"/><span className="text-[9px] text-white drop-shadow-md font-medium">12K</span></div>
            <div className="flex flex-col items-center gap-1"><Share2 size={20} className="text-white drop-shadow-md fill-white/20"/><span className="text-[9px] text-white drop-shadow-md font-medium">Share</span></div>
            <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-white/20 flex items-center justify-center mt-2">
              <Music size={12} className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-white drop-shadow-md">@brandname</span>
              <span className="text-[10px] text-white/90 line-clamp-2 drop-shadow-md">Experience the next generation of performance. Get yours today! #ad</span>
              <div className="flex items-center gap-1 text-[10px] text-white/90 drop-shadow-md mt-0.5">
                <Music size={10} /> <span>Original sound - brandname</span>
              </div>
            </div>
            <button className="w-full bg-white/95 text-black text-[11px] font-semibold py-2 rounded flex items-center justify-between px-3 mt-1">
              <span>Shop Now</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}

      {platform === 'IG Reels' && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <ArrowLeft size={16} className="text-white drop-shadow-md" />
              <span className="text-sm font-semibold text-white drop-shadow-md">Reels</span>
            </div>
            <Camera size={16} className="text-white drop-shadow-md" />
          </div>
          <div className="absolute right-2 bottom-[150px] flex flex-col items-center gap-4 z-10">
            <div className="flex flex-col items-center gap-1"><Heart size={20} className="text-white drop-shadow-md fill-transparent"/><span className="text-[9px] text-white drop-shadow-md font-medium">124K</span></div>
            <div className="flex flex-col items-center gap-1"><MessageCircle size={20} className="text-white drop-shadow-md fill-transparent"/><span className="text-[9px] text-white drop-shadow-md font-medium">4,092</span></div>
            <div className="flex flex-col items-center gap-1"><Send size={20} className="text-white drop-shadow-md fill-transparent"/><span className="text-[9px] text-white drop-shadow-md font-medium">12K</span></div>
            <MoreVertical size={20} className="text-white drop-shadow-md mt-2" />
            <div className="w-7 h-7 rounded-sm border-2 border-white/80 bg-zinc-800 flex items-center justify-center mt-2">
               <Music size={12} className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-600 border border-white/20"></div>
              <span className="text-xs font-semibold text-white drop-shadow-md">brandname</span>
              <button className="px-2 py-0.5 border border-white/40 rounded text-[9px] text-white font-medium ml-1">Follow</button>
            </div>
            <span className="text-[10px] text-white/90 line-clamp-2 drop-shadow-md mt-1">Experience the next generation of performance. Get yours today! #ad</span>
            <div className="flex items-center gap-1 text-[10px] text-white/90 drop-shadow-md mt-0.5 bg-white/20 rounded-full px-2 py-0.5 w-max">
              <Music size={10} /> <span>Audio track name</span>
            </div>
          </div>
        </>
      )}

      {platform === 'YT Shorts' && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <Youtube size={22} className="text-white drop-shadow-md" />
            <div className="flex items-center gap-4">
              <Search size={16} className="text-white drop-shadow-md" />
              <MoreVertical size={16} className="text-white drop-shadow-md" />
            </div>
          </div>
          <div className="absolute right-2 bottom-[140px] flex flex-col items-center gap-4 z-10">
            <div className="flex flex-col items-center gap-1"><ThumbsUp size={20} className="text-white drop-shadow-md fill-white/20"/><span className="text-[9px] text-white drop-shadow-md font-medium">124K</span></div>
            <div className="flex flex-col items-center gap-1"><ThumbsDown size={20} className="text-white drop-shadow-md fill-transparent"/><span className="text-[9px] text-white drop-shadow-md font-medium">Dislike</span></div>
            <div className="flex flex-col items-center gap-1"><MessageCircle size={20} className="text-white drop-shadow-md fill-white/20"/><span className="text-[9px] text-white drop-shadow-md font-medium">4K</span></div>
            <div className="flex flex-col items-center gap-1"><Share2 size={20} className="text-white drop-shadow-md fill-white/20"/><span className="text-[9px] text-white drop-shadow-md font-medium">Share</span></div>
            <div className="w-7 h-7 rounded bg-zinc-800 border-2 border-white/20 mt-2"></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-600 border border-white/20"></div>
              <span className="text-xs font-semibold text-white drop-shadow-md">@brandname</span>
              <button className="bg-white text-black px-2.5 py-1 rounded-full text-[10px] font-bold ml-1">Subscribe</button>
            </div>
            <span className="text-[11px] text-white/90 drop-shadow-md mt-1 font-medium">Next generation performance!</span>
          </div>
        </>
      )}

      {platform === 'IG Stories' && (
        <>
          <div className="absolute top-0 left-0 right-0 p-3 z-10">
            <div className="flex gap-1 mb-2">
              <div className="h-0.5 flex-1 bg-white/40 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-white rounded-full"></div></div>
              <div className="h-0.5 flex-1 bg-white/40 rounded-full"></div>
              <div className="h-0.5 flex-1 bg-white/40 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-600 border border-white/20"></div>
                <span className="text-xs font-semibold text-white drop-shadow-md">brandname</span>
                <span className="text-[10px] text-white/70 drop-shadow-md">2h</span>
              </div>
              <div className="flex items-center gap-3">
                <MoreHorizontal size={16} className="text-white drop-shadow-md" />
                <X size={16} className="text-white drop-shadow-md" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-3 z-10 pb-5">
            <div className="flex-1 border border-white/40 rounded-full px-4 py-2 text-[11px] text-white/70 backdrop-blur-sm">
              Send message
            </div>
            <Heart size={20} className="text-white drop-shadow-md" />
            <Send size={20} className="text-white drop-shadow-md" />
          </div>
        </>
      )}

      {platform === 'FB Reels' && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <span className="text-sm font-bold text-white drop-shadow-md">Reels</span>
            <Search size={16} className="text-white drop-shadow-md" />
          </div>
          <div className="absolute right-2 bottom-[150px] flex flex-col items-center gap-4 z-10">
            <div className="flex flex-col items-center gap-1"><ThumbsUp size={20} className="text-white drop-shadow-md fill-transparent"/><span className="text-[9px] text-white drop-shadow-md font-medium">124K</span></div>
            <div className="flex flex-col items-center gap-1"><MessageCircle size={20} className="text-white drop-shadow-md fill-transparent"/><span className="text-[9px] text-white drop-shadow-md font-medium">4K</span></div>
            <div className="flex flex-col items-center gap-1"><Share2 size={20} className="text-white drop-shadow-md fill-transparent"/><span className="text-[9px] text-white drop-shadow-md font-medium">Share</span></div>
            <MoreHorizontal size={20} className="text-white drop-shadow-md mt-2" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-600 border border-white/20"></div>
              <span className="text-xs font-semibold text-white drop-shadow-md">Brand Name</span>
              <button className="text-blue-400 text-[11px] font-semibold ml-1">Follow</button>
            </div>
            <span className="text-[10px] text-white/90 line-clamp-2 drop-shadow-md mt-1">Experience the next generation of performance. Get yours today!</span>
            <button className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-semibold py-2 rounded mt-1">
              Learn More
            </button>
          </div>
        </>
      )}

      {platform === 'Universal' && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <ArrowLeft size={16} className="text-white drop-shadow-md" />
            <span className="text-xs font-semibold text-white drop-shadow-md">Short-form Video</span>
            <Maximize size={16} className="text-white drop-shadow-md" />
          </div>
          <div className="absolute right-2 bottom-[170px] flex flex-col items-center gap-4 z-10">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"><Heart size={14} className="text-white"/></div>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"><MessageCircle size={14} className="text-white"/></div>
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"><Share2 size={14} className="text-white"/></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-zinc-600 border border-white/20"></div>
              <span className="text-xs font-semibold text-white drop-shadow-md">Brand Name</span>
            </div>
            <div className="h-3 w-3/4 bg-white/20 rounded mt-1"></div>
            <div className="h-3 w-1/2 bg-white/20 rounded"></div>
            <button className="w-full bg-white text-black text-[11px] font-semibold py-2 rounded mt-1">
              Call to Action
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function SafeZoneCheckModal({ onClose, imageSrc }: SafeZoneCheckModalProps) {
  const [activePlatform, setActivePlatform] = useState('TikTok');
  const [showAIResults, setShowAIResults] = useState(false);

  const platforms = ['TikTok', 'IG Reels', 'IG Stories', 'YT Shorts', 'FB Reels', 'Universal'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm font-sans">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-white/[0.08] bg-[#18181b] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/[0.12] flex items-center justify-center border border-indigo-500/[0.08] shrink-0">
              <Shield size={16} className="text-[#818cf8]" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-zinc-100 leading-tight">Safe Zone Check</h2>
              <span className="text-[11px] text-zinc-500 mt-0.5">Red zones = platform UI overlap risk</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-hide">
          {/* PLATFORM TABS */}
          <div className="px-6 pt-5 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              {platforms.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePlatform(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activePlatform === p 
                      ? 'bg-indigo-500 text-white shadow-sm' 
                      : 'border border-white/[0.06] bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="p-6 flex flex-col md:flex-row gap-8">
            
            {/* Left column — phone frame */}
            <div className="flex flex-col w-full md:w-[260px] shrink-0 items-center">
              <MockupShell platform={activePlatform} imageSrc={imageSrc} />

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 w-full justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-500/20 border border-red-500/50 rounded-sm"></div>
                  <span className="text-[10px] text-zinc-600">Danger zone</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0 border-t-2 border-dashed border-emerald-500/80"></div>
                  <span className="text-[10px] text-zinc-600">Safe zone</span>
                </div>
              </div>

              {/* Check with AI button */}
              {!showAIResults && (
                <button 
                  onClick={() => setShowAIResults(true)}
                  className="w-full mt-5 rounded-xl bg-indigo-500/[0.10] border border-indigo-500/30 text-indigo-300 py-2.5 flex items-center justify-center gap-2 hover:bg-indigo-500/[0.15] hover:border-indigo-500/40 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                >
                  <Sparkles size={14} />
                  <span className="text-xs font-semibold">Check with AI</span>
                </button>
              )}
            </div>

            {/* Right column — tips + warning */}
            <div className="flex flex-col flex-1">
              <h3 className="text-xs font-semibold text-zinc-200 mb-4 tracking-wide uppercase">
                {activePlatform} Guidelines
              </h3>
              
              <div className="flex flex-col gap-3.5 mb-6">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#10b981] mt-[2px] shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Keep primary text hooks within the top 20% to avoid overlap with engagement metrics or bottom captions.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#10b981] mt-[2px] shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Ensure faces and key products remain in the center 60% of the screen.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#10b981] mt-[2px] shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Leave the bottom 15% completely clear for the platform's paid CTA button and expanding caption area.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-[#10b981] mt-[2px] shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Avoid placing crucial UI elements or logos on the extreme right edge where platform icons reside.
                  </p>
                </div>
              </div>

              <div className="mt-auto rounded-xl bg-amber-500/[0.05] border border-amber-500/20 px-4 py-3.5 flex items-start gap-3">
                <AlertTriangle size={14} className="text-[#f59e0b] mt-0.5 shrink-0" />
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  <span className="text-zinc-400 font-medium">Platform Update:</span> {activePlatform} recently increased bottom caption height. We recommend moving all text elements up by at least 12% to prevent obstruction during auto-scroll.
                </p>
              </div>
            </div>

          </div>

          {/* AI RESULTS */}
          {showAIResults && (
            <div className="px-6 pb-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02]">
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-white/[0.01]">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#6366f1]" />
                    <span className="text-xs font-semibold text-zinc-200">AI Detection Results</span>
                  </div>
                  <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                    High Risk
                  </div>
                </div>

                <div className="flex flex-col">
                  {/* Issue 1 */}
                  <div className="p-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-xs font-medium text-zinc-200">Text Overlay ("Shop Now")</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Bottom 15%</span>
                    </div>
                    <p className="text-xs text-zinc-400 ml-4">
                      Critical overlap with {activePlatform} native CTA button. Move element up by at least 120px to ensure visibility.
                    </p>
                  </div>

                  {/* Issue 2 */}
                  <div className="p-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-xs font-medium text-zinc-200">Brand Logo</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Right Edge</span>
                    </div>
                    <p className="text-xs text-zinc-400 ml-4">
                      Proximity warning. May clash with engagement icons. Shift left by 40px for safe clearance.
                    </p>
                  </div>
                </div>

                {/* Safe Elements */}
                <div className="p-4 bg-white/[0.01] flex flex-col gap-2.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Safe Elements</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1.5">
                      <CheckCircle2 size={10} /> Main Subject
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1.5">
                      <CheckCircle2 size={10} /> Primary Hook Text
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1.5">
                      <CheckCircle2 size={10} /> Top Navigation Area
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
