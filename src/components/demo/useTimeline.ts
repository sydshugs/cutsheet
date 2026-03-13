import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimelineOptions {
  duration: number; // total loop length in ms
  playing?: boolean;
}

interface UseTimelineReturn {
  elapsed: number; // ms within current loop
  progress: number; // 0-1
  loopCount: number;
}

/**
 * Drives phased demo animations by tracking elapsed time.
 * Loops seamlessly. Supports deterministic mode via window.__DEMO_TIME__
 * for Puppeteer frame capture.
 */
export function useTimeline({
  duration,
  playing = true,
}: UseTimelineOptions): UseTimelineReturn {
  const [state, setState] = useState({ elapsed: 0, loopCount: 0 });
  const startRef = useRef<number | null>(null);
  const loopRef = useRef(0);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    // Deterministic mode for Puppeteer capture
    const demoTime = (window as any).__DEMO_TIME__;
    if (typeof demoTime === "number") {
      const elapsed = demoTime % duration;
      const loopCount = Math.floor(demoTime / duration);
      setState({ elapsed, loopCount });
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (!startRef.current) startRef.current = performance.now();
    const raw = performance.now() - startRef.current;
    const loopCount = Math.floor(raw / duration);
    const elapsed = raw % duration;

    if (loopCount > loopRef.current) {
      loopRef.current = loopCount;
    }

    setState({ elapsed, loopCount });
    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    startRef.current = null;
    loopRef.current = 0;
    setState({ elapsed: 0, loopCount: 0 });
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, tick]);

  return {
    elapsed: state.elapsed,
    progress: state.elapsed / duration,
    loopCount: state.loopCount,
  };
}
