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
    <div style={{ marginTop: 16, padding: "0 20px", paddingBottom: 8 }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-0">
        <Hash size={14} className="text-zinc-500" />
        <span className="text-xs font-medium text-zinc-200">Recommended hashtags</span>
      </div>

      {/* Platform chip row */}
      <div className="flex gap-1.5 py-2.5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        {availablePlatforms.map(plat => {
          const isActive = activePlatform === plat;
          return (
            <button
              key={plat}
              onClick={() => { setActivePlatform(plat); setShowAll(false); }}
              aria-label={`Show ${plat} hashtags`}
              aria-pressed={isActive}
              className="text-[11px] font-medium rounded-full cursor-pointer transition-all duration-150 hover:text-zinc-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
              style={{
                padding: '4px 12px',
                background: isActive ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                color: isActive ? '#818cf8' : '#71717a',
                border: isActive ? '0.5px solid rgba(99,102,241,0.2)' : '0.5px solid transparent',
              }}
            >
              {plat}
            </button>
          );
        })}
      </div>

      {/* Pills body — tightened padding, limited by default */}
      <div className="flex flex-wrap gap-1 py-2.5">
        {visibleTags.map(tag => (
          <span
            key={tag}
            className="text-[11px] rounded-full cursor-default transition-all duration-150 hover:bg-indigo-500/10 hover:text-indigo-400"
            style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa' }}
          >
            #{tag}
          </span>
        ))}
        {/* Show more / less toggle inline */}
        {hasMore && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-[11px] font-medium rounded-full cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
            style={{ padding: '3px 8px', background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '0.5px solid rgba(99,102,241,0.2)' }}
          >
            {showAll ? 'Show less' : `+${tags.length - VISIBLE_DEFAULT} more`}
          </button>
        )}
      </div>

      {/* Footer strip */}
      <div
        className="flex items-center justify-between rounded-lg"
        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[11px] text-zinc-500">{tags.length} tags</span>
        <button
          onClick={handleCopy}
          className="text-[11px] font-medium cursor-pointer transition-colors bg-transparent border-none"
          style={{ color: copied ? '#10b981' : '#818cf8' }}
        >
          {copied ? 'Copied!' : 'Copy all →'}
        </button>
      </div>
    </div>
  );
}
