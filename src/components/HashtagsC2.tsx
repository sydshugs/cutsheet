// HashtagsC2 — pixel-matched to Figma node 217:1894 (Hashtags section)
// Collapsible row with pills only — no platform tabs, no footer

import type { MouseEvent } from "react";
import { memo, useMemo, useState } from "react";
import { Hash, ChevronDown } from "lucide-react";
import type { Hashtags } from "../services/analyzerService";

interface HashtagsC2Props {
  hashtags: Hashtags;
  format?: 'video' | 'static';
}

export const HashtagsC2 = memo(function HashtagsC2({ hashtags }: HashtagsC2Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  // Pick the first platform that has tags
  const tags = useMemo(() => {
    if (hashtags.meta?.length) return hashtags.meta;
    if (hashtags.instagram?.length) return hashtags.instagram;
    if (hashtags.tiktok?.length) return hashtags.tiktok;
    if (hashtags.youtube_shorts?.length) return hashtags.youtube_shorts;
    if (hashtags.reels?.length) return hashtags.reels;
    if (hashtags.pinterest?.length) return hashtags.pinterest;
    return [];
  }, [hashtags]);

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    const text = tags.map(t => `#${t}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (tags.length === 0) return null;

  return (
    <div>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between h-[48px] group focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-[9px]">
          <Hash size={17} className="text-[#71717b]" />
          <span className="text-[15px] font-medium text-[#d4d4d8] group-hover:text-white transition-colors">
            Hashtags
          </span>
          <span className="text-[13px] text-[#71717b]">
            ({tags.length})
          </span>
        </div>
        <div className="flex items-center gap-[13px]">
          <button
            onClick={handleCopy}
            className="text-[13px] font-medium focus-visible:outline-none"
            style={{ color: copied ? '#10b981' : '#7c86ff', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {copied ? 'Copied!' : 'Copy all'}
          </button>
          <ChevronDown
            size={17}
            className="text-[#71717b] transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Pills */}
      {isOpen && (
        <div className="flex flex-wrap gap-2 pb-4">
          {tags.map(tag => (
            <span
              key={tag}
              className="text-[13px] px-[11px] py-[4px] rounded-full text-[#9f9fa9]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
