import image_a084b174f2521c7ddafbd752a8afb17595b062a6 from 'figma:asset/a084b174f2521c7ddafbd752a8afb17595b062a6.png'
import React, { useState } from 'react';
import { Monitor, Download, Plus, Signal, Wifi, BatteryMedium } from 'lucide-react';

interface DisplayAnalyzerMockupProps {
  imageSrc: string;
}

export const DisplayAnalyzerMockup: React.FC<DisplayAnalyzerMockupProps> = ({ imageSrc }) => {
  const [activeFormat, setActiveFormat] = useState('300×250 Rectangle');
  const [viewMode, setViewMode] = useState<'single' | 'suite'>('single');

  const formats = [
    "300×250 Rectangle",
    "728×90 Leaderboard",
    "160×600 Skyscraper",
    "300×600 Half Page",
    "320×50 Mobile"
  ];

  const getBannerDetails = () => {
    if (activeFormat === '320×50 Mobile') {
      return {
        detected: '320×50 detected',
        desc: 'Mobile Banner · Sticky bottom placement',
        pillText: 'Mobile-first format',
        pillClass: 'bg-sky-500/[0.08] text-sky-400',
      };
    }
    if (activeFormat === '300×600 Half Page') {
      return {
        detected: '300×600 detected',
        desc: 'Half Page · Right column, large format',
        pillText: 'Premium placement',
        pillClass: 'bg-violet-500/[0.08] text-violet-400',
      };
    }
    if (activeFormat === '160×600 Skyscraper') {
      return {
        detected: '160×600 detected',
        desc: 'Wide Skyscraper · Right rail sidebar',
        pillText: 'Strong viewability',
        pillClass: 'bg-emerald-500/[0.08] text-emerald-400',
      };
    }
    if (activeFormat === '728×90 Leaderboard') {
      return {
        detected: '728×90 detected',
        desc: 'Leaderboard · Top of page, above content',
        pillText: 'High visibility placement',
        pillClass: 'bg-emerald-500/[0.08] text-emerald-400',
      };
    }
    return {
      detected: '300×250 detected',
      desc: 'Medium Rectangle · Right sidebar, mid-article',
      pillText: 'Most common GDN format',
      pillClass: 'bg-emerald-500/[0.08] text-emerald-400',
    };
  };

  const getBottomInfo = () => {
    if (activeFormat === '320×50 Mobile') {
      return {
        pill: '320×50 · Mobile Banner',
        desc: 'Bottom of mobile screen'
      };
    }
    if (activeFormat === '300×600 Half Page') {
      return {
        pill: '300×600 · Half Page',
        desc: 'Right column, premium placement'
      };
    }
    if (activeFormat === '160×600 Skyscraper') {
      return {
        pill: '160×600 · Wide Skyscraper',
        desc: 'Right rail, full height'
      };
    }
    if (activeFormat === '728×90 Leaderboard') {
      return {
        pill: '728×90 · Leaderboard',
        desc: 'Top of page, above content'
      };
    }
    return {
      pill: '300×250 · Medium Rectangle',
      desc: 'Right sidebar, mid-article'
    };
  };

  const bannerDetails = getBannerDetails();
  const bottomInfo = getBottomInfo();

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Row 1 — Combined header: placement pills (left) + Single/Suite toggle (right) */}
      <div className="flex items-center justify-between gap-4">
        <div className="overflow-x-auto scrollbar-hide flex gap-2 flex-nowrap shrink">
          {formats.map((format) => {
            const isActive = activeFormat === format;
            return (
              <button
                key={format}
                onClick={() => setActiveFormat(format)}
                className={`whitespace-nowrap px-3 py-1 text-xs rounded-full transition-colors ${
                  isActive
                    ? 'bg-cyan-500/[0.10] border border-cyan-500/25 text-cyan-400 font-medium'
                    : 'border border-white/[0.06] text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {format}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setViewMode('single')}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              viewMode === 'single'
                ? 'bg-white/[0.06] border border-white/[0.10] text-zinc-200'
                : 'border border-white/[0.04] text-zinc-600 hover:text-zinc-400'
            }`}
          >
            Single Ad
          </button>
          <button
            onClick={() => setViewMode('suite')}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              viewMode === 'suite'
                ? 'bg-white/[0.06] border border-white/[0.10] text-zinc-200'
                : 'border border-white/[0.04] text-zinc-600 hover:text-zinc-400'
            }`}
          >
            Suite View
          </button>
        </div>
      </div>

      {/* Row 2 — In-situ mockup */}
      <div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f12] overflow-hidden">
          {activeFormat === '320×50 Mobile' ? (
            <div className="flex flex-col items-center py-10 px-4 w-full">
              <div className="w-[320px] h-[640px] rounded-[40px] border-[8px] border-zinc-900 bg-[#f9fafb] relative flex flex-col overflow-hidden shadow-2xl shrink-0">
                {/* Status Bar */}
                <div className="w-full h-8 flex items-center justify-between px-6 shrink-0 bg-[#f9fafb] z-10">
                  <span className="text-[10px] font-semibold text-zinc-800">9:41</span>
                  <div className="flex items-center gap-1.5 text-zinc-800">
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <BatteryMedium className="w-4 h-4" />
                  </div>
                </div>
                
                {/* Article */}
                <div className="px-5 py-4 flex flex-col gap-4 flex-1 overflow-y-auto scrollbar-hide">
                  <h2 className="text-sm font-semibold text-zinc-900 leading-snug">
                    Global Markets Rally as Tech Sector Shows Unexpected Growth in Q3
                  </h2>
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      As we move further into the decade, digital consumption habits continue to evolve rapidly. 
                      Users are presented with an unprecedented amount of content.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Publishers and advertisers alike are finding that native integration and context-aware placements yield significantly higher engagement rates. The key is providing immediate value rather than interrupting the user experience.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Brands that fail to capture attention within the first three seconds risk losing their audience entirely to competitors with more dynamic content strategies.
                      Marketers are increasingly focusing on "micro-moments" – those critical seconds when users turn to their devices to learn, do, discover, watch, or buy something.
                    </p>
                  </div>
                </div>

                {/* Sticky Ad Banner at the bottom */}
                <div className="w-full shrink-0 flex flex-col items-center bg-white border-t border-zinc-200 pt-1 pb-2 relative z-20">
                  <span className="text-[7px] uppercase tracking-wider text-zinc-400 text-center mb-1">
                    ADVERTISEMENT
                  </span>
                  <div className="w-full h-[50px] relative bg-zinc-900">
                    <img src={imageSrc || image_a084b174f2521c7ddafbd752a8afb17595b062a6} alt="320x50 Ad Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 text-[7px] bg-white/80 text-zinc-500 rounded px-1 z-10 font-medium">Ad</div>
                  </div>
                  {/* Home Indicator */}
                  <div className="w-[100px] h-1 bg-zinc-300 rounded-full mt-2"></div>
                </div>
              </div>
              <div className="mt-5 text-[10px] text-zinc-600">Sticky placement · Fixed to bottom of screen</div>
            </div>
          ) : (
            <>
              {/* Fake browser chrome */}
              <div className="bg-[#f0f0f0] border-b border-zinc-200 px-3 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                </div>
                <div className="mx-auto rounded bg-white border border-zinc-200 px-3 py-1 text-[10px] text-zinc-400 w-1/2 text-center truncate">
                  news.example.com/article
                </div>
              </div>
              
              {/* Article layout */}
              <div className="flex flex-col gap-4 p-6 bg-[#f9fafb] min-h-[640px]">
                {activeFormat === '300×600 Half Page' ? (
              <div className="flex gap-6">
                {/* Left column - Content */}
                <div className="flex-1 flex flex-col gap-4 pt-2">
                  <div className="text-[10px] text-zinc-400">
                    By Sarah Chen · 4 min read
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-zinc-900 leading-snug">
                    The Evolution of Digital Consumption: Why Short-Form Media is the New Standard
                  </h2>
                  
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      As we move further into the decade, digital consumption habits continue to evolve rapidly. 
                      Users are presented with an unprecedented amount of content, leading to a significant decrease in average focus time.
                      Studies show that engaging visual media is now the primary driver of retention across major platforms.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Brands that fail to capture attention within the first three seconds risk losing their audience entirely to competitors with more dynamic content strategies.
                      Marketers are increasingly focusing on "micro-moments" – those critical seconds when users turn to their devices to learn, do, discover, watch, or buy something.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Publishers and advertisers alike are finding that native integration and context-aware placements yield significantly higher engagement rates. The key is providing immediate value rather than interrupting the user experience with jarring visuals.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Furthermore, the rise of short-form video and transient social media formats has conditioned users to expect rapid delivery of information. The challenge for brands is to distill complex messages into easily digestible, highly visual formats without losing the core narrative.
                    </p>
                  </div>
                </div>

                {/* Right column - Half Page Ad */}
                <div className="w-[180px] sm:w-[220px] shrink-0 flex flex-col items-center">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-400 text-center mb-1 block">
                    ADVERTISEMENT
                  </span>
                  <div className="w-full aspect-[300/600] rounded-sm overflow-hidden border border-zinc-200 relative bg-zinc-900 shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center">
                    <img 
                      src={imageSrc || image_a084b174f2521c7ddafbd752a8afb17595b062a6} 
                      alt="300x600 Ad Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 text-[8px] bg-white/80 text-zinc-500 rounded px-1 z-10 font-medium">
                      Ad
                    </div>
                  </div>
                  
                  {/* Related Articles below the ad */}
                  <div className="w-full mt-4 flex flex-col gap-2">
                    <div className="text-[10px] font-semibold text-zinc-800 uppercase tracking-wider mb-1">Related</div>
                    <div className="text-[10px] text-zinc-500 hover:text-zinc-800 cursor-pointer line-clamp-2">How AI is shaping the future of ad creatives in 2026</div>
                    <div className="w-full h-px bg-zinc-200"></div>
                    <div className="text-[10px] text-zinc-500 hover:text-zinc-800 cursor-pointer line-clamp-2">Top 5 strategies for maintaining consumer attention</div>
                  </div>
                </div>
              </div>
            ) : activeFormat === '160×600 Skyscraper' ? (
              <div className="flex gap-6">
                {/* Left column - Content */}
                <div className="flex-1 flex flex-col gap-5 pt-2">
                  <h2 className="text-base sm:text-lg font-semibold text-zinc-900 leading-snug">
                    The Evolution of Digital Consumption: Why Short-Form Media is the New Standard
                  </h2>
                  
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      As we move further into the decade, digital consumption habits continue to evolve rapidly. 
                      Users are presented with an unprecedented amount of content, leading to a significant decrease in average focus time.
                      Studies show that engaging visual media is now the primary driver of retention across major platforms.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Brands that fail to capture attention within the first three seconds risk losing their audience entirely to competitors with more dynamic content strategies.
                      Marketers are increasingly focusing on "micro-moments" – those critical seconds when users turn to their devices to learn, do, discover, watch, or buy something.
                    </p>
                  </div>

                  {/* Replaced Media Placeholder */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Publishers and advertisers alike are finding that native integration and context-aware placements yield significantly higher engagement rates. The key is providing immediate value rather than interrupting the user experience.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Understanding these intent-driven moments is essential for modern campaign success.
                      By tailoring creative assets to match the user's immediate context and emotional state, advertisers can break through the noise.
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Furthermore, the rise of short-form video and transient social media formats has conditioned users to expect rapid delivery of information. 
                      The challenge for brands is to distill complex messages into easily digestible, highly visual formats without losing the core narrative.
                    </p>
                  </div>
                </div>

                {/* Right column - Skyscraper Ad */}
                <div className="w-[160px] shrink-0 flex flex-col items-center relative">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-400 text-center mb-1 block">
                    ADVERTISEMENT
                  </span>
                  <div className="w-full aspect-[160/600] rounded-sm overflow-hidden border border-zinc-200 relative bg-zinc-900 shadow-sm flex items-center justify-center">
                    <img 
                      src={imageSrc || image_a084b174f2521c7ddafbd752a8afb17595b062a6} 
                      alt="160x600 Ad Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 text-[8px] bg-white/80 text-zinc-500 rounded px-1 z-10 font-medium">
                      Ad
                    </div>
                  </div>
                  {/* Scroll indicator below the ad */}
                  <div className="w-0.5 h-12 bg-gradient-to-b from-zinc-200 to-transparent mt-2"></div>
                </div>
              </div>
            ) : activeFormat === '728×90 Leaderboard' ? (
              <div className="flex flex-col w-full gap-6">
                {/* 728x90 Ad Slot */}
                <div className="flex flex-col items-center w-full">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-400 text-center mb-1.5 block">
                    ADVERTISEMENT
                  </span>
                  <div className="w-full h-[45px] sm:h-[60px] rounded-sm overflow-hidden border border-zinc-200 relative bg-zinc-900 shadow-sm flex items-center justify-center">
                    <img 
                      src={imageSrc || image_a084b174f2521c7ddafbd752a8afb17595b062a6} 
                      alt="728x90 Ad Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 text-[8px] bg-white/80 text-zinc-500 rounded px-1 z-10 font-medium">
                      Ad
                    </div>
                  </div>
                </div>

                {/* Article Header & Navigation */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-base sm:text-lg font-semibold text-zinc-900 leading-snug truncate">
                    Global Markets Rally as Tech Sector Shows Unexpected Growth in Q3
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 border-y border-zinc-200 py-2">
                    <span className="font-medium text-zinc-800">News</span>
                    <span className="w-px h-3 bg-zinc-300"></span>
                    <span className="hover:text-zinc-800 cursor-pointer">Sports</span>
                    <span className="w-px h-3 bg-zinc-300"></span>
                    <span className="hover:text-zinc-800 cursor-pointer">Finance</span>
                    <span className="w-px h-3 bg-zinc-300"></span>
                    <span className="hover:text-zinc-800 cursor-pointer">Tech</span>
                  </div>
                </div>

                {/* Article Content & Sidebar */}
                <div className="flex gap-6">
                  {/* Left Column - Content */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="w-full h-3 bg-zinc-200 rounded-sm"></div>
                    <div className="w-full h-3 bg-zinc-200 rounded-sm"></div>
                    <div className="w-[80%] h-3 bg-zinc-200 rounded-sm"></div>
                    
                    <div className="w-full h-3 bg-zinc-200 rounded-sm mt-2"></div>
                    <div className="w-full h-3 bg-zinc-200 rounded-sm"></div>
                    <div className="w-[90%] h-3 bg-zinc-200 rounded-sm"></div>

                    <div className="w-full h-3 bg-zinc-200 rounded-sm mt-2"></div>
                    <div className="w-[60%] h-3 bg-zinc-200 rounded-sm"></div>
                  </div>
                  
                  {/* Right Column - Sidebar Placeholders */}
                  <div className="w-[120px] sm:w-[160px] shrink-0 flex flex-col gap-4">
                    {/* Placeholder 300x250 slot in suite view */}
                    {viewMode === 'suite' ? (
                      <div className="w-full aspect-[300/250] border border-dashed border-zinc-300 rounded-sm flex flex-col items-center justify-center bg-zinc-100/50 cursor-pointer hover:bg-zinc-100 transition-colors">
                        <Plus className="w-4 h-4 text-zinc-400 mb-1" />
                        <span className="text-[10px] text-zinc-500 font-medium text-center px-2">Add rectangle<br/>(300×250)</span>
                      </div>
                    ) : (
                      <div className="w-full aspect-[300/250] bg-zinc-200 rounded-sm"></div>
                    )}
                    <div className="w-full h-[100px] bg-zinc-200 rounded-sm"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Top Leaderboard Slot (Suite View Only) */}
                {viewMode === 'suite' && (
                  <div className="w-full h-[60px] sm:h-[90px] border border-dashed border-zinc-300 rounded-sm flex flex-col items-center justify-center bg-zinc-100/50 cursor-pointer hover:bg-zinc-100 transition-colors">
                    <Plus className="w-4 h-4 text-zinc-400 mb-1" />
                    <span className="text-[10px] text-zinc-500 font-medium">Add leaderboard (728×90)</span>
                  </div>
                )}

                <div className="flex gap-6">
                  {/* Left column */}
                  <div className="flex-1 flex flex-col">
                    <h2 className="text-lg font-bold text-zinc-900 leading-snug mb-4 max-w-[90%]">
                      Why consumer attention spans are shorter than ever in 2026
                    </h2>
                    <div className="space-y-4 mb-6">
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        As we move further into the decade, digital consumption habits continue to evolve rapidly. 
                        Users are presented with an unprecedented amount of content, leading to a significant decrease in average focus time.
                      </p>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Studies show that engaging visual media is now the primary driver of retention across major platforms. Brands that fail to capture attention within the first three seconds risk losing their audience entirely to competitors with more dynamic content strategies.
                      </p>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-800 mb-3">The Shift to Micro-Moments</h3>
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Marketers are increasingly focusing on "micro-moments" – those critical seconds when users turn to their devices to learn, do, discover, watch, or buy something. Understanding these intent-driven moments is essential for modern campaign success.
                      </p>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        By tailoring creative assets to match the user's immediate context and emotional state, advertisers can break through the noise. It's no longer just about demographic targeting; it's about contextual relevance and immediate value proposition.
                      </p>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Furthermore, the rise of short-form video and transient social media formats has conditioned users to expect rapid delivery of information. The challenge for brands is to distill complex messages into easily digestible, highly visual formats without losing the core narrative.
                      </p>
                    </div>
                  </div>

                  {/* Right column (Fixed width) */}
                  <div className="w-[160px] shrink-0 flex flex-col items-center pt-8">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-400 text-center mb-2 block">
                      ADVERTISEMENT
                    </span>
                    <div className="flex flex-col gap-6 w-full">
                      <div className="w-full aspect-[300/250] rounded-sm overflow-hidden border border-zinc-200 relative bg-zinc-900 shadow-sm">
                        <img 
                          src={imageSrc || image_a084b174f2521c7ddafbd752a8afb17595b062a6} 
                          alt="300x250 Ad Preview" 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-1 left-1 text-[8px] bg-white/90 text-zinc-600 rounded px-1 z-10 font-medium">
                          Ad
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
            </>
          )}
        </div>

        {/* BOTTOM INFO ROW & SUITE CHIPS */}
        <div className="flex flex-col gap-3 mt-3 px-1">
          {viewMode === 'suite' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mr-1">ADD SIZES:</span>
              <button className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-dashed border-white/[0.08] hover:border-white/[0.2] rounded-full px-2.5 py-1 transition-colors">
                + 160×600
              </button>
              <button className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-dashed border-white/[0.08] hover:border-white/[0.2] rounded-full px-2.5 py-1 transition-colors">
                + 300×600
              </button>
              <button className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-dashed border-white/[0.08] hover:border-white/[0.2] rounded-full px-2.5 py-1 transition-colors">
                + 320×50
              </button>
            </div>
          )}
          {/* Row 3 — Format detected banner */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-2.5 flex items-center gap-3">
            <Monitor className="text-cyan-400 w-[14px] h-[14px] shrink-0" />
            <span className="text-sm font-medium text-zinc-200">{bannerDetails.detected}</span>
            <span className="text-xs text-zinc-500 hidden sm:inline">{bannerDetails.desc}</span>
            <span className={`${bannerDetails.pillClass} text-[10px] rounded-full px-2 py-0.5 ml-auto whitespace-nowrap`}>
              {bannerDetails.pillText}
            </span>
          </div>
          {/* Row 4 — Download only, right-aligned */}
          <div className="flex items-center justify-end">
            <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <Download className="w-3 h-3" />
              <span>Download mockup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};