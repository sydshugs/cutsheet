// HashtagsC2 — platform chip row + pills body + sticky footer with copy

import { useState } from "react";
import { Hash } from "lucide-react";
import type { Hashtags } from "../services/analyzerService";

interface HashtagsC2Props {
  hashtags: Hashtags;
  format?: 'video' | 'static';
}

const PLATFORM_MAP: Record<string, keyof Hashtags> = {
  Meta: 'meta',
  Instagram: 'instagram',
  TikTok: 'tiktok',
};

const VISIBLE_DEFAULT = 8;

export function HashtagsC2({ hashtags, format }: HashtagsC2Props) {
  // Determine available platforms based on format
  const availablePlatforms = (() => {
    const platforms: string[] = [];
    if (hashtags.meta?.length) platforms.push('Meta');
    if (hashtags.instagram?.length) platforms.push('Instagram');
    if (format === 'video' && hashtags.tiktok?.length) platforms.push('TikTok');
    if (format !== 'video' && hashtags.tiktok?.length) platforms.push('TikTok');
    return platforms;
  })();

  const [activePlatform, setActivePlatform] = useState(availablePlatforms[0] ?? 'Meta');
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const platformKey = PLATFORM_MAP[activePlatform] ?? 'meta';
  const tags = hashtags[platformKey] ?? [];
  const visibleTags = showAll ? tags : tags.slice(0, VISIBLE_DEFAULT);
  const hasMore = tags.length > VISIBLE_DEFAULT;

  const handleCopy = () => {
    const text = tags.map(t => `#${t}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (availablePlatforms.length === 0) return null;

  return (
    <div className="mt-4 mx-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hash size={14} className="text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Hashtags</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs font-medium cursor-pointer transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.03]"
          style={{ color: copied ? '#10b981' : '#818cf8', background: 'transparent', border: 'none' }}
        >
          {copied ? 'Copied!' : 'Copy all'}
        </button>
      </div>

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
  );
}
