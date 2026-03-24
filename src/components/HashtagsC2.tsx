// HashtagsC2 — collapsible hashtag section matching other accordion sections

import type { MouseEvent } from "react";
import { useState } from "react";
import { Hash, ChevronRight } from "lucide-react";
import type { Hashtags } from "../services/analyzerService";

interface HashtagsC2Props {
  hashtags: Hashtags;
  format?: 'video' | 'static';
}

// IMPORTANT: Add new entries here when new hashtag platforms are added to
// the Hashtags interface in analyzerService.ts or the organic contextPrefix.
const PLATFORM_MAP: Record<string, keyof Hashtags> = {
  'Meta': 'meta',
  'Instagram': 'instagram',
  'TikTok': 'tiktok',
  'YouTube Shorts': 'youtube_shorts',
  'Instagram Reels': 'reels',
  'Pinterest': 'pinterest',
};

const VISIBLE_DEFAULT = 8;

export function HashtagsC2({ hashtags, format }: HashtagsC2Props) {
  // Determine available platforms — show all that have data
  const availablePlatforms = (() => {
    const platforms: string[] = [];
    if (hashtags.meta?.length) platforms.push('Meta');
    if (hashtags.instagram?.length) platforms.push('Instagram');
    if (hashtags.tiktok?.length) platforms.push('TikTok');
    if (hashtags.youtube_shorts?.length) platforms.push('YouTube Shorts');
    if (hashtags.reels?.length) platforms.push('Instagram Reels');
    if (hashtags.pinterest?.length) platforms.push('Pinterest');
    return platforms;
  })();

  const [isOpen, setIsOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState(availablePlatforms[0] ?? 'Meta');
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const platformKey = PLATFORM_MAP[activePlatform] ?? 'meta';
  const tags = hashtags[platformKey] ?? [];
  const visibleTags = showAll ? tags : tags.slice(0, VISIBLE_DEFAULT);
  const hasMore = tags.length > VISIBLE_DEFAULT;

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    const text = tags.map(t => `#${t}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (availablePlatforms.length === 0) return null;

  return (
    <div className="px-4 pt-1">
      <div 
        className="rounded-2xl transition-all"
        style={{ 
          background: isOpen ? 'rgba(255,255,255,0.015)' : 'transparent',
          border: isOpen ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        }}
      >
        {/* Header button */}
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-expanded={isOpen}
          className="w-full flex items-center justify-between gap-3 group focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none rounded-2xl py-3.5 px-4 hover:bg-white/[0.02] transition-all"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-zinc-600 group-hover:text-zinc-500 transition-all"
              style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
            >
              <ChevronRight size={14} />
            </span>
            <span
              className="flex-shrink-0 transition-colors"
              style={{ color: isOpen ? "#a5b4fc" : "#71717a" }}
            >
              <Hash size={14} />
            </span>
            <span
              className="text-[13px] tracking-normal transition-colors"
              style={{ fontWeight: 500, color: isOpen ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)" }}
            >
              Hashtags
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600">({tags.length})</span>
            <button
              onClick={handleCopy}
              className="text-xs font-medium cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-white/[0.04]"
              style={{ color: copied ? '#10b981' : '#818cf8', background: 'transparent', border: 'none' }}
            >
              {copied ? 'Copied!' : 'Copy all'}
            </button>
          </div>
        </button>

        {/* Collapsible content */}
        {isOpen && (
          <div className="px-4 pb-4 pt-0">
            {/* Platform tabs */}
            <div className="flex gap-1.5 mb-4 p-1 rounded-xl bg-white/[0.02]">
              {availablePlatforms.map(plat => {
                const isActive = activePlatform === plat;
                return (
                  <button
                    key={plat}
                    onClick={() => { setActivePlatform(plat); setShowAll(false); }}
                    aria-label={`Show ${plat} hashtags`}
                    aria-pressed={isActive}
                    className="text-[11px] font-medium flex-1 py-2 rounded-lg cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                      color: isActive ? '#e4e4e7' : '#71717a',
                      border: 'none',
                    }}
                  >
                    {plat}
                  </button>
                );
              })}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {visibleTags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-300 transition-colors cursor-default border border-white/[0.04]"
                >
                  #{tag}
                </span>
              ))}
              {hasMore && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/15 border border-indigo-500/20"
                >
                  {showAll ? 'Show less' : `+${tags.length - VISIBLE_DEFAULT} more`}
                </button>
              )}
            </div>

            {/* Tag count */}
            <p className="text-[10px] text-zinc-600 mt-3">{tags.length} tags optimized for {activePlatform}</p>
          </div>
        )}
      </div>
    </div>
  );
}
