// HashtagsC2 — categorized dropdown with platform tabs

import { useState, useRef, useEffect, useCallback } from "react";
import { Hash, ChevronDown, Check, Copy, Lightbulb, Layout, MessageSquare, Filter, X } from "lucide-react";
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

// Category configuration with icons and colors
const CATEGORIES = [
  { 
    id: 'hook', 
    label: 'Hook Analysis', 
    icon: Lightbulb,
    color: '#10b981',
    keywords: ['hook', 'attention', 'viral', 'trending', 'scroll', 'stop', 'watch', 'engage', 'curiosity', 'clickbait', 'mustwatch', 'fyp', 'foryou', 'foryoupage', 'viral', 'trending']
  },
  { 
    id: 'visual', 
    label: 'Visual Hierarchy', 
    icon: Layout,
    color: '#818cf8',
    keywords: ['visual', 'design', 'aesthetic', 'style', 'look', 'color', 'brand', 'creative', 'photo', 'video', 'content', 'feed', 'grid', 'instagram', 'photography', 'videography', 'cinematic']
  },
  { 
    id: 'copy', 
    label: 'Copy & Messaging', 
    icon: MessageSquare,
    color: '#f59e0b',
    keywords: ['health', 'wellness', 'lifestyle', 'tips', 'advice', 'education', 'learn', 'how', 'guide', 'tutorial', 'help', 'support', 'community', 'journey', 'story', 'motivation', 'inspiration']
  },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'] | 'all';

// Categorize tags based on keywords
function categorizeTag(tag: string): CategoryId {
  const lowerTag = tag.toLowerCase();
  for (const category of CATEGORIES) {
    if (category.keywords.some(keyword => lowerTag.includes(keyword))) {
      return category.id;
    }
  }
  return 'copy'; // Default to copy & messaging for niche/topic tags
}

// Group tags by category
function groupTagsByCategory(tags: string[]): Record<CategoryId, string[]> {
  const groups: Record<CategoryId, string[]> = { all: tags, hook: [], visual: [], copy: [] };
  
  for (const tag of tags) {
    const category = categorizeTag(tag);
    if (category !== 'all') {
      groups[category].push(tag);
    }
  }
  
  return groups;
}

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
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const platformKey = PLATFORM_MAP[activePlatform] ?? 'meta';
  const allTags = hashtags[platformKey] ?? [];
  const groupedTags = groupTagsByCategory(allTags);
  const filteredTags = activeCategory === 'all' ? allTags : groupedTags[activeCategory];
  const visibleTags = showAll ? filteredTags : filteredTags.slice(0, 8);
  const hasMore = filteredTags.length > 8;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setDropdownOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      setDropdownOpen(prev => !prev);
      event.preventDefault();
    }
  }, []);

  const handleCopyAll = () => {
    const tagsToCopy = selectedTags.size > 0 
      ? Array.from(selectedTags) 
      : filteredTags;
    const text = tagsToCopy.map(t => `#${t}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySingle = (tag: string) => {
    navigator.clipboard.writeText(`#${tag}`);
  };

  const toggleTagSelection = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedTags(new Set());
  };

  const selectAllInCategory = () => {
    setSelectedTags(new Set(filteredTags));
  };

  if (availablePlatforms.length === 0) return null;

  const activeCategoryConfig = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="mt-4 mx-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Hash size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Hashtags</span>
          </div>
          
          {/* Category dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              onKeyDown={handleKeyDown}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              aria-label="Filter hashtags by category"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
              style={{
                background: activeCategory !== 'all' ? `${activeCategoryConfig?.color}15` : 'rgba(255,255,255,0.04)',
                color: activeCategory !== 'all' ? activeCategoryConfig?.color : '#a1a1aa',
                border: `1px solid ${activeCategory !== 'all' ? `${activeCategoryConfig?.color}30` : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <Filter size={11} />
              <span>{activeCategory === 'all' ? 'All Categories' : activeCategoryConfig?.label}</span>
              <ChevronDown 
                size={12} 
                className="transition-transform duration-200"
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-1.5 w-52 rounded-xl border border-white/[0.08] bg-zinc-900/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden"
                role="listbox"
                aria-label="Hashtag categories"
              >
                {/* All option */}
                <button
                  onClick={() => { setActiveCategory('all'); setDropdownOpen(false); setShowAll(false); }}
                  role="option"
                  aria-selected={activeCategory === 'all'}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                  style={{ 
                    background: activeCategory === 'all' ? 'rgba(255,255,255,0.04)' : 'transparent',
                    color: activeCategory === 'all' ? '#f4f4f5' : '#a1a1aa',
                    border: 'none',
                  }}
                >
                  <div className="w-5 h-5 rounded-md flex items-center justify-center bg-white/[0.06]">
                    <Hash size={11} className="text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">All Categories</span>
                    <span className="ml-1.5 text-zinc-600">({allTags.length})</span>
                  </div>
                  {activeCategory === 'all' && <Check size={14} className="text-indigo-400" />}
                </button>

                <div className="h-px bg-white/[0.06] mx-2" />

                {/* Category options */}
                {CATEGORIES.map(category => {
                  const Icon = category.icon;
                  const count = groupedTags[category.id].length;
                  const isActive = activeCategory === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => { setActiveCategory(category.id); setDropdownOpen(false); setShowAll(false); }}
                      role="option"
                      aria-selected={isActive}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                      style={{ 
                        background: isActive ? `${category.color}08` : 'transparent',
                        color: isActive ? '#f4f4f5' : '#a1a1aa',
                        border: 'none',
                      }}
                    >
                      <div 
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ background: `${category.color}15` }}
                      >
                        <Icon size={11} style={{ color: category.color }} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{category.label}</span>
                        <span className="ml-1.5 text-zinc-600">({count})</span>
                      </div>
                      {isActive && <Check size={14} style={{ color: category.color }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Copy actions */}
        <div className="flex items-center gap-2">
          {selectedTags.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-[10px] font-medium px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-white/[0.04]"
              style={{ color: '#71717a', background: 'transparent', border: 'none' }}
              aria-label="Clear selection"
            >
              Clear ({selectedTags.size})
            </button>
          )}
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.03]"
            style={{ color: copied ? '#10b981' : '#818cf8', background: 'transparent', border: 'none' }}
            aria-label={selectedTags.size > 0 ? `Copy ${selectedTags.size} selected tags` : `Copy all ${filteredTags.length} tags`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : selectedTags.size > 0 ? `Copy ${selectedTags.size}` : 'Copy all'}</span>
          </button>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-1.5 mb-4 p-1 rounded-xl bg-white/[0.02]">
        {availablePlatforms.map(plat => {
          const isActive = activePlatform === plat;
          return (
            <button
              key={plat}
              onClick={() => { setActivePlatform(plat); setShowAll(false); setSelectedTags(new Set()); }}
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

      {/* Selection actions */}
      {filteredTags.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={selectAllInCategory}
            className="text-[10px] font-medium px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-white/[0.04]"
            style={{ 
              color: selectedTags.size === filteredTags.length ? '#10b981' : '#71717a', 
              background: 'transparent', 
              border: 'none' 
            }}
          >
            Select all
          </button>
          <span className="text-zinc-700">|</span>
          <span className="text-[10px] text-zinc-600">
            Click tags to select for copy
          </span>
        </div>
      )}

      {/* Tags grid */}
      <div className="flex flex-wrap gap-2">
        {visibleTags.map(tag => {
          const isSelected = selectedTags.has(tag);
          const tagCategory = categorizeTag(tag);
          const categoryConfig = CATEGORIES.find(c => c.id === tagCategory);
          
          return (
            <button
              key={tag}
              onClick={() => toggleTagSelection(tag)}
              onDoubleClick={() => handleCopySingle(tag)}
              title="Click to select, double-click to copy"
              className="group relative text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer border focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none"
              style={{
                background: isSelected 
                  ? `${categoryConfig?.color || '#818cf8'}15` 
                  : 'rgba(255,255,255,0.03)',
                color: isSelected 
                  ? categoryConfig?.color || '#818cf8'
                  : '#a1a1aa',
                borderColor: isSelected 
                  ? `${categoryConfig?.color || '#818cf8'}30`
                  : 'rgba(255,255,255,0.04)',
              }}
            >
              <span className="flex items-center gap-1">
                {isSelected && <Check size={10} className="shrink-0" />}
                #{tag}
              </span>
              {/* Category indicator dot */}
              {activeCategory === 'all' && (
                <span 
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: categoryConfig?.color || '#71717a' }}
                  title={categoryConfig?.label}
                />
              )}
            </button>
          );
        })}
        {hasMore && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/15 border border-indigo-500/20"
          >
            {showAll ? 'Show less' : `+${filteredTags.length - 8} more`}
          </button>
        )}
      </div>

      {/* Empty state for category */}
      {filteredTags.length === 0 && activeCategory !== 'all' && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${activeCategoryConfig?.color}10` }}
          >
            {activeCategoryConfig && <activeCategoryConfig.icon size={18} style={{ color: activeCategoryConfig.color }} />}
          </div>
          <p className="text-xs text-zinc-500 mb-1">No tags in this category</p>
          <button
            onClick={() => setActiveCategory('all')}
            className="text-[11px] font-medium cursor-pointer transition-colors hover:underline"
            style={{ color: '#818cf8', background: 'transparent', border: 'none' }}
          >
            View all categories
          </button>
        </div>
      )}

      {/* Footer with counts */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
        <p className="text-[10px] text-zinc-600">
          {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''} 
          {activeCategory !== 'all' && ` in ${activeCategoryConfig?.label}`}
          {' '}optimized for {activePlatform}
        </p>
        {/* Category legend when showing all */}
        {activeCategory === 'all' && (
          <div className="flex items-center gap-3">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="flex items-center gap-1">
                <span 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: cat.color }}
                />
                <span className="text-[9px] text-zinc-600">{cat.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
