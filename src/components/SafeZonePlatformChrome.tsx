import {
  ArrowLeft,
  Search,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Music,
  MoreVertical,
  Camera,
  Youtube,
  ThumbsUp,
  ThumbsDown,
  Send,
  MoreHorizontal,
  Maximize,
  X,
  ChevronRight,
} from "lucide-react";

export type SafeZonePlatformKey =
  | "tiktok"
  | "instagram_reels"
  | "instagram_stories"
  | "youtube_shorts"
  | "facebook_reels"
  | "universal";

/** Decorative platform UI overlays for the 9:16 safe-zone phone mockup (non-interactive). */
export function SafeZonePlatformChrome({ platform }: { platform: SafeZonePlatformKey }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 [&_*]:pointer-events-none">
      {platform === "tiktok" && (
        <>
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
            <ArrowLeft size={16} className="text-white drop-shadow-md" aria-hidden />
            <div className="flex gap-4 text-[10px] font-semibold text-white/90 drop-shadow-md">
              <span>LIVE</span>
              <span className="text-white/50">Following</span>
              <span className="underline decoration-2 underline-offset-4">For You</span>
            </div>
            <Search size={16} className="text-white drop-shadow-md" aria-hidden />
          </div>
          <div className="absolute bottom-[160px] right-2 z-10 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Heart size={20} className="fill-white/20 text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">124K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle size={20} className="fill-white/20 text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">4,092</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Bookmark size={20} className="fill-white/20 text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">12K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Share2 size={20} className="fill-white/20 text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">Share</span>
            </div>
            <div className="mt-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/20 bg-zinc-800">
              <Music size={12} className="text-white" aria-hidden />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-white drop-shadow-md">@brandname</span>
              <span className="line-clamp-2 text-[10px] text-white/90 drop-shadow-md">
                Experience the next generation of performance. Get yours today! #ad
              </span>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/90 drop-shadow-md">
                <Music size={10} aria-hidden /> <span>Original sound - brandname</span>
              </div>
            </div>
            <div className="mt-1 flex w-full items-center justify-between rounded bg-white/95 px-3 py-2 text-[11px] font-semibold text-black">
              <span>Shop Now</span>
              <ChevronRight size={14} aria-hidden />
            </div>
          </div>
        </>
      )}

      {platform === "instagram_reels" && (
        <>
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <ArrowLeft size={16} className="text-white drop-shadow-md" aria-hidden />
              <span className="text-sm font-semibold text-white drop-shadow-md">Reels</span>
            </div>
            <Camera size={16} className="text-white drop-shadow-md" aria-hidden />
          </div>
          <div className="absolute bottom-[150px] right-2 z-10 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Heart size={20} className="fill-transparent text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">124K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle size={20} className="fill-transparent text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">4,092</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Send size={20} className="fill-transparent text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">12K</span>
            </div>
            <MoreVertical size={20} className="mt-2 text-white drop-shadow-md" aria-hidden />
            <div className="mt-2 flex h-7 w-7 items-center justify-center rounded-sm border-2 border-white/80 bg-zinc-800">
              <Music size={12} className="text-white" aria-hidden />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full border border-white/20 bg-zinc-600" />
              <span className="text-xs font-semibold text-white drop-shadow-md">brandname</span>
              <span className="ml-1 rounded border border-white/40 px-2 py-0.5 text-[9px] font-medium text-white">
                Follow
              </span>
            </div>
            <span className="mt-1 line-clamp-2 text-[10px] text-white/90 drop-shadow-md">
              Experience the next generation of performance. Get yours today! #ad
            </span>
            <div className="mt-0.5 flex w-max items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white/90 drop-shadow-md">
              <Music size={10} aria-hidden /> <span>Audio track name</span>
            </div>
          </div>
        </>
      )}

      {platform === "youtube_shorts" && (
        <>
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
            <Youtube size={22} className="text-white drop-shadow-md" aria-hidden />
            <div className="flex items-center gap-4">
              <Search size={16} className="text-white drop-shadow-md" aria-hidden />
              <MoreVertical size={16} className="text-white drop-shadow-md" aria-hidden />
            </div>
          </div>
          <div className="absolute bottom-[140px] right-2 z-10 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <ThumbsUp size={20} className="fill-white/20 text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">124K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ThumbsDown size={20} className="fill-transparent text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">Dislike</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle size={20} className="fill-white/20 text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">4K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Share2 size={20} className="fill-white/20 text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">Share</span>
            </div>
            <div className="mt-2 h-7 w-7 rounded border-2 border-white/20 bg-zinc-800" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full border border-white/20 bg-zinc-600" />
              <span className="text-xs font-semibold text-white drop-shadow-md">@brandname</span>
              <span className="ml-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-black">Subscribe</span>
            </div>
            <span className="mt-1 text-[11px] font-medium text-white/90 drop-shadow-md">Next generation performance!</span>
          </div>
        </>
      )}

      {platform === "instagram_stories" && (
        <>
          <div className="absolute left-0 right-0 top-0 z-10 p-3">
            <div className="mb-2 flex gap-1">
              <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/40">
                <div className="h-full w-1/3 rounded-full bg-white" />
              </div>
              <div className="h-0.5 flex-1 rounded-full bg-white/40" />
              <div className="h-0.5 flex-1 rounded-full bg-white/40" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full border border-white/20 bg-zinc-600" />
                <span className="text-xs font-semibold text-white drop-shadow-md">brandname</span>
                <span className="text-[10px] text-white/70 drop-shadow-md">2h</span>
              </div>
              <div className="flex items-center gap-3">
                <MoreHorizontal size={16} className="text-white drop-shadow-md" aria-hidden />
                <X size={16} className="text-white drop-shadow-md" aria-hidden />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-3 p-3 pb-5">
            <div className="flex-1 rounded-full border border-white/40 px-4 py-2 text-[11px] text-white/70 backdrop-blur-sm">
              Send message
            </div>
            <Heart size={20} className="text-white drop-shadow-md" aria-hidden />
            <Send size={20} className="text-white drop-shadow-md" aria-hidden />
          </div>
        </>
      )}

      {platform === "facebook_reels" && (
        <>
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
            <span className="text-sm font-bold text-white drop-shadow-md">Reels</span>
            <Search size={16} className="text-white drop-shadow-md" aria-hidden />
          </div>
          <div className="absolute bottom-[150px] right-2 z-10 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <ThumbsUp size={20} className="fill-transparent text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">124K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle size={20} className="fill-transparent text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">4K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Share2 size={20} className="fill-transparent text-white drop-shadow-md" aria-hidden />
              <span className="text-[9px] font-medium text-white drop-shadow-md">Share</span>
            </div>
            <MoreHorizontal size={20} className="mt-2 text-white drop-shadow-md" aria-hidden />
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full border border-white/20 bg-zinc-600" />
              <span className="text-xs font-semibold text-white drop-shadow-md">Brand Name</span>
              <span className="ml-1 text-[11px] font-semibold text-blue-400">Follow</span>
            </div>
            <span className="mt-1 line-clamp-2 text-[10px] text-white/90 drop-shadow-md">
              Experience the next generation of performance. Get yours today!
            </span>
            <div className="mt-1 w-full rounded border border-white/30 bg-white/20 py-2 text-center text-[11px] font-semibold text-white backdrop-blur-md">
              Learn More
            </div>
          </div>
        </>
      )}

      {platform === "universal" && (
        <>
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
            <ArrowLeft size={16} className="text-white drop-shadow-md" aria-hidden />
            <span className="text-xs font-semibold text-white drop-shadow-md">Short-form Video</span>
            <Maximize size={16} className="text-white drop-shadow-md" aria-hidden />
          </div>
          <div className="absolute bottom-[170px] right-2 z-10 flex flex-col items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Heart size={14} className="text-white" aria-hidden />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <MessageCircle size={14} className="text-white" aria-hidden />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <Share2 size={14} className="text-white" aria-hidden />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full border border-white/20 bg-zinc-600" />
              <span className="text-xs font-semibold text-white drop-shadow-md">Brand Name</span>
            </div>
            <div className="mt-1 h-3 w-3/4 rounded bg-white/20" />
            <div className="h-3 w-1/2 rounded bg-white/20" />
            <div className="mt-1 w-full rounded bg-white py-2 text-center text-[11px] font-semibold text-black">Call to Action</div>
          </div>
        </>
      )}
    </div>
  );
}
