import { useRef, useState, useEffect, useCallback } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import {
  CutsheetDemoComposition,
  DEMO_FPS,
  DEMO_DURATION_FRAMES,
  DEMO_WIDTH,
  DEMO_HEIGHT,
} from "./CutsheetDemo";
import { CustomSlider } from "../ui/custom-slider";

const SPEED_OPTIONS = [1, 1.5, 2] as const;

function formatTime(frames: number, fps: number): string {
  const totalSeconds = Math.floor(frames / fps);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RemotionDemoPlayer() {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playbackRate = SPEED_OPTIONS[speedIndex];

  // Sync player events → state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    const onFullscreenChange = (e: { detail: { isFullscreen: boolean } }) => {
      setIsFullscreen(e.detail.isFullscreen);
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("timeupdate", onTimeUpdate);
    player.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("timeupdate", onTimeUpdate);
      player.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  // Auto-hide controls
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playerRef.current?.isPlaying()) {
        setShowControls(false);
      }
    }, 2500);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  const handleMouseLeave = useCallback(() => {
    if (playerRef.current?.isPlaying()) {
      setShowControls(false);
    }
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  // Controls always visible when paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    } else {
      scheduleHide();
    }
  }, [isPlaying, scheduleHide]);

  const togglePlay = useCallback(() => {
    playerRef.current?.toggle();
  }, []);

  const handleSeek = useCallback((frame: number) => {
    playerRef.current?.seekTo(frame);
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isMuted) {
      player.unmute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((val: number) => {
    const normalized = val / 100;
    playerRef.current?.setVolume(normalized);
    setVolume(normalized);
    if (normalized === 0) {
      playerRef.current?.mute();
      setIsMuted(true);
    } else if (isMuted) {
      playerRef.current?.unmute();
      setIsMuted(false);
    }
  }, [isMuted]);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((i) => (i + 1) % SPEED_OPTIONS.length);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isFullscreen) {
      player.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  }, [isFullscreen]);

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ maxWidth: 960 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Remotion Player */}
      <Player
        ref={playerRef}
        component={CutsheetDemoComposition}
        durationInFrames={DEMO_DURATION_FRAMES}
        compositionWidth={DEMO_WIDTH}
        compositionHeight={DEMO_HEIGHT}
        fps={DEMO_FPS}
        loop
        playbackRate={playbackRate}
        style={{
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />

      {/* Click-to-play overlay */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        style={{ borderRadius: 16 }}
        onClick={togglePlay}
      />

      {/* Glass controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-20 p-3"
            style={{ borderRadius: "0 0 16px 16px" }}
          >
            <div className="flex items-center gap-3 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2.5">
              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>

              {/* Time */}
              <span className="text-xs font-mono text-zinc-400 tabular-nums whitespace-nowrap">
                {formatTime(currentFrame, DEMO_FPS)} / {formatTime(DEMO_DURATION_FRAMES, DEMO_FPS)}
              </span>

              {/* Seek slider */}
              <CustomSlider
                value={currentFrame}
                max={DEMO_DURATION_FRAMES}
                onChange={handleSeek}
                className="flex-1 min-w-0"
              />

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  onClick={toggleMute}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <div className="w-0 overflow-hidden group-hover/vol:w-16 transition-all duration-200">
                  <CustomSlider
                    value={isMuted ? 0 : volume * 100}
                    max={100}
                    onChange={handleVolumeChange}
                  />
                </div>
              </div>

              {/* Speed */}
              <button
                onClick={cycleSpeed}
                className="flex items-center justify-center h-7 px-2 rounded-md text-xs font-mono font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors tabular-nums"
              >
                {playbackRate}x
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
