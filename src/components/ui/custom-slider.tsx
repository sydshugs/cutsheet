import { useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "../../lib/utils";

interface CustomSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

export function CustomSlider({ value, max, onChange, className }: CustomSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const thumbScale = useMotionValue(1);
  const thumbScaleSpring = useSpring(thumbScale, { damping: 20, stiffness: 300 });
  const percent = max > 0 ? (value / max) * 100 : 0;

  const computeValue = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      return Math.round(ratio * max);
    },
    [max, value],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
      thumbScale.set(1.4);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onChange(computeValue(e.clientX));
    },
    [computeValue, onChange, thumbScale],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      onChange(computeValue(e.clientX));
    },
    [computeValue, onChange],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    thumbScale.set(1);
  }, [thumbScale]);

  return (
    <div
      ref={trackRef}
      className={cn("relative flex items-center h-5 cursor-pointer select-none", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Track background */}
      <div className="absolute inset-x-0 h-1 rounded-full bg-zinc-800" />

      {/* Filled track */}
      <div
        className="absolute left-0 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
        style={{ width: `${percent}%` }}
      />

      {/* Thumb */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 w-3.5 h-3.5 rounded-full bg-white ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/25"
        style={{ left: `${percent}%`, scale: thumbScaleSpring }}
      />
    </div>
  );
}
