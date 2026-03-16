// Design token constants for Remotion scenes (inline styles only, no Tailwind)
// Values extracted from src/styles/tokens.css

import type { CSSProperties } from 'react';

export const TOKENS = {
  // ── Backgrounds ──
  bg: '#09090b',
  surface: 'rgba(255,255,255,0.03)',
  surfaceEl: 'rgba(255,255,255,0.05)',

  // ── Borders ──
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  // ── Text ──
  ink: 'rgba(255,255,255,0.92)',
  inkMuted: 'rgba(255,255,255,0.5)',
  inkFaint: 'rgba(255,255,255,0.25)',

  // ── Accent ──
  accent: '#6366F1',
  accentHover: '#5254CC',
  violet: '#8B5CF6',

  // ── Semantic ──
  success: '#10B981',
  error: '#EF4444',
  warn: '#F59E0B',

  // ── Score Bands ──
  scoreExcellent: '#10B981',
  scoreGood: '#6366F1',
  scoreAverage: '#F59E0B',
  scoreWeak: '#EF4444',

  // ── Typography ──
  fontSans: "'Geist', system-ui, sans-serif",
  fontMono: "'Geist Mono', monospace",
  fontDisplay: "'Outfit', 'Geist', system-ui, sans-serif",

  // ── Radii ──
  radius: 16,
  radiusSm: 8,
  radiusLg: 20,
  radiusXl: 24,
} as const;

// ── Shared Style Constants ──

export const STEP_LABEL_STYLE: CSSProperties = {
  position: 'absolute',
  top: 28,
  left: 36,
  fontSize: 10,
  fontFamily: TOKENS.fontMono,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#818cf8',
  background: 'rgba(99, 102, 241, 0.1)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: 999,
  padding: '4px 12px',
};

export const HEADING_STYLE: CSSProperties = {
  fontFamily: TOKENS.fontDisplay,
  fontSize: 26,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export const CARD_STYLE: CSSProperties = {
  background: TOKENS.surface,
  border: `1px solid ${TOKENS.border}`,
  borderRadius: TOKENS.radiusLg,
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

// ── Score Helpers ──

export function getScoreColor(score: number): string {
  if (score >= 9) return TOKENS.scoreExcellent;
  if (score >= 7) return TOKENS.scoreGood;
  if (score >= 5) return TOKENS.scoreAverage;
  return TOKENS.scoreWeak;
}

export function getScoreLabel(score: number): string {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  return 'Weak';
}
