import React, { useState, useMemo } from "react";
import { LayoutGrid, List, Search, Bookmark } from "lucide-react";

import { Link } from "react-router";

// Mock Data
const MOCK_ADS = [
  {
    id: 1,
    filename: "FW24_Campaign_V3.mp4",
    score: 8.4,
    platform: "Meta",
    type: "Paid",
    format: "Video",
    thumbnail: "https://images.unsplash.com/photo-1577831297902-bb3368af10c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwYWQlMjB2aWRlb3xlbnwxfHx8fDE3NzQ2NjY2NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    filename: "Spring_Collection_Hero.jpg",
    score: 6.2,
    platform: "Google",
    type: "Paid",
    format: "Static",
    thumbnail: "https://images.unsplash.com/photo-1564484539125-88cbf21cbb25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VycyUyMGFkJTIwc3RhdGljfGVufDF8fHx8MTc3NDY2NjY0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 3,
    filename: "UGC_Review_Alice.mp4",
    score: 9.1,
    platform: "TikTok",
    type: "Organic",
    format: "Video",
    thumbnail: "https://images.unsplash.com/photo-1767379462160-8984ebc01c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2luY2FyZSUyMGFkJTIwb3JnYW5pY3xlbnwxfHx8fDE3NzQ2NjY2NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 4,
    filename: "Retargeting_Offer_20.jpg",
    score: 4.5,
    platform: "Meta",
    type: "Paid",
    format: "Static",
    thumbnail: "https://images.unsplash.com/photo-1577831297902-bb3368af10c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwYWQlMjB2aWRlb3xlbnwxfHx8fDE3NzQ2NjY2NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 5,
    filename: "Founder_Story_Long.mp4",
    score: 7.8,
    platform: "YouTube",
    type: "Organic",
    format: "Video",
    thumbnail: "https://images.unsplash.com/photo-1767379462160-8984ebc01c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2luY2FyZSUyMGFkJTIwb3JnYW5pY3xlbnwxfHx8fDE3NzQ2NjY2NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 6,
    filename: "CyberMonday_Flash.mp4",
    score: 3.2,
    platform: "TikTok",
    type: "Paid",
    format: "Video",
    thumbnail: "https://images.unsplash.com/photo-1564484539125-88cbf21cbb25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VycyUyMGFkJTIwc3RhdGljfGVufDF8fHx8MTc3NDY2NjY0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

type ViewMode = "grid" | "list";
type FilterOption = "All" | "Paid" | "Organic" | "Video" | "Static";

export default function SavedAdsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filters: FilterOption[] = ["All", "Paid", "Organic", "Video", "Static"];

  // In a real app, you could toggle between MOCK_ADS and [] to show empty state.
  // We will show populated state as requested.
  const allAds = MOCK_ADS; 

  const filteredAds = useMemo(() => {
    return allAds.filter((ad) => {
      // 1. Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !ad.filename.toLowerCase().includes(q) &&
          !ad.platform.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // 2. Pill Filter
      if (activeFilter !== "All") {
        if (activeFilter === "Paid" || activeFilter === "Organic") {
          if (ad.type !== activeFilter) return false;
        } else if (activeFilter === "Video" || activeFilter === "Static") {
          if (ad.format !== activeFilter) return false;
        }
      }

      return true;
    });
  }, [allAds, searchQuery, activeFilter]);

  const avgScore = useMemo(() => {
    if (allAds.length === 0) return "—";
    const sum = allAds.reduce((acc, ad) => acc + ad.score, 0);
    return (sum / allAds.length).toFixed(1);
  }, [allAds]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-indigo-400";
    if (score >= 4) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 6) return "bg-indigo-500";
    if (score >= 4) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#09090b]">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex items-center justify-between px-6 py-5 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 leading-tight">
            Saved Ads
          </h1>
          <p className="text-xs font-mono text-zinc-600 mt-0.5">
            {filteredAds.length} creatives · Avg score: {avgScore}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-zinc-500 px-3 py-1.5 hover:bg-white/[0.04] transition-colors">
            Score ↓
          </button>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "text-zinc-200 bg-white/[0.06]"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "text-zinc-200 bg-white/[0.06]"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── SEARCH + FILTER BAR ─── */}
      <div className="px-6 pb-4 flex items-center gap-3 shrink-0">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 focus-within:border-white/[0.12] transition-colors">
          <Search size={14} className="text-zinc-600 shrink-0" />
          <input
            type="text"
            placeholder="Search creatives, brands, hooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs text-zinc-200 placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-xs rounded-full px-2.5 py-1 transition-colors ${
                activeFilter === filter
                  ? "border border-white/[0.10] bg-white/[0.04] text-zinc-200"
                  : "border border-white/[0.04] text-zinc-600 hover:text-zinc-400 hover:border-white/[0.06]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CONTENT AREA ─── */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-12">
        {allAds.length === 0 ? (
          /* ─── EMPTY STATE ─── */
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto px-6 text-center">
            <div className="w-[64px] h-[64px] rounded-2xl bg-slate-500/[0.10] flex items-center justify-center">
              <Bookmark size={28} color="#94a3b8" />
            </div>
            <h2 className="text-base font-semibold text-zinc-300 mt-4">
              Your creative library is empty
            </h2>
            <p className="text-sm text-zinc-600 mt-2 max-w-xs">
              Score any ad in Paid, Organic, or Display — then save it here to
              build your reference library.
            </p>

            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] text-zinc-500 text-xs px-3 py-1">
                Save Ads
              </span>
              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] text-zinc-500 text-xs px-3 py-1">
                Organize
              </span>
              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] text-zinc-500 text-xs px-3 py-1">
                Reference Library
              </span>
            </div>
          </div>
        ) : filteredAds.length === 0 ? (
          /* ─── NO SEARCH RESULTS ─── */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <p className="text-sm text-zinc-500">
              No creatives found matching your search.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* ─── GRID VIEW ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
            {filteredAds.map((ad) => (
              <Link
                to={`/app/saved/${ad.id}`}
                key={ad.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden group cursor-pointer hover:border-white/[0.10] transition-all flex flex-col"
              >
                {/* Thumbnail Area */}
                <div className="aspect-square bg-zinc-900 relative w-full overflow-hidden">
                  <img
                    src={ad.thumbnail}
                    alt={ad.filename}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Top-left platform pill */}
                  <div className="absolute top-2 left-2 rounded bg-black/60 text-zinc-300 text-[9px] px-1.5 py-0.5 backdrop-blur-sm z-10 font-medium tracking-wide">
                    {ad.platform}
                  </div>
                  
                  {/* Top-right score badge */}
                  <div className={`absolute top-2 right-2 rounded bg-black/70 text-sm font-bold px-2 py-1 backdrop-blur-sm z-10 ${getScoreColor(ad.score)}`}>
                    {ad.score.toFixed(1)}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                    <div className="w-10 h-10 rounded-full bg-white/[0.1] backdrop-blur-md flex items-center justify-center border border-white/[0.1]">
                      <Bookmark size={18} className="text-white fill-white/20" />
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="px-3 py-2.5 border-t border-white/[0.06] flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-zinc-500 truncate">
                    {ad.filename}
                  </span>
                  <div className="w-full h-[3px] rounded-full bg-zinc-800 overflow-hidden mt-0.5">
                    <div
                      className={`h-full rounded-full ${getScoreBg(ad.score)}`}
                      style={{ width: `${(ad.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* ─── LIST VIEW ─── */
          <div className="flex flex-col gap-2 px-6">
            {filteredAds.map((ad) => (
              <Link
                to={`/app/saved/${ad.id}`}
                key={ad.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-4 hover:border-white/[0.10] transition-colors cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-zinc-900 overflow-hidden shrink-0 relative">
                  <img
                    src={ad.thumbnail}
                    alt={ad.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Bookmark size={14} className="text-white fill-white/20" />
                  </div>
                </div>

                {/* Filename & Platform Pill */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-[12px] font-mono text-zinc-300 truncate leading-none">
                    {ad.filename}
                  </span>
                  <span className="rounded bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-[10px] px-2 py-0.5">
                    {ad.platform}
                  </span>
                </div>

                {/* Score Area */}
                <div className="flex items-center gap-4 ml-auto shrink-0">
                  <div className="w-24 h-[3px] rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBg(ad.score)}`}
                      style={{ width: `${(ad.score / 10) * 100}%` }}
                    />
                  </div>
                  <div className={`text-sm font-bold w-8 text-right ${getScoreColor(ad.score)}`}>
                    {ad.score.toFixed(1)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}