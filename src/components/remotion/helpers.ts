import { interpolate, spring } from 'remotion';

// Ease-out exponential: f(t) = 1 - 2^(-10t)
export const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Ease-in-out cubic for smooth transitions
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Scene-level fade envelope. Fades in over the first `fadeFrames` and
 * out over the last `fadeFrames` of a scene with `totalFrames` duration.
 */
export function sceneEnvelope(frame: number, totalFrames: number, fadeFrames = 18): number {
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOutCubic,
  });
  const fadeOut = interpolate(frame, [totalFrames - fadeFrames, totalFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeInOutCubic,
  });
  return fadeIn * fadeOut;
}

/**
 * Spring-based scale pop — great for card entrances and badge reveals.
 * Returns { opacity, transform } for direct spread into style.
 */
export function springPop(
  frame: number,
  start: number,
  fps = 30,
  config = { damping: 13, stiffness: 160, mass: 0.9 },
): { opacity: number; transform: string } {
  const s = spring({ frame: Math.max(0, frame - start), fps, config });
  const scale = interpolate(s, [0, 1], [0.92, 1]);
  return {
    opacity: s,
    transform: `scale(${scale})`,
  };
}

export function fadeIn(frame: number, start: number, duration = 15): number {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
}

export function slideUp(frame: number, start: number, distance = 20, duration = 20): { opacity: number; transform: string } {
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * distance}px)`,
  };
}

export function typewriter(text: string, frame: number, startFrame: number, charsPerFrame = 0.5): string {
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.floor(elapsed * charsPerFrame);
  return text.slice(0, Math.min(chars, text.length));
}

export function scaleIn(frame: number, start: number, duration = 15): { opacity: number; transform: string } {
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutExpo,
  });
  const scale = interpolate(progress, [0, 1], [0.5, 1]);
  return {
    opacity: progress,
    transform: `scale(${scale})`,
  };
}
