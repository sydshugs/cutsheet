// Design token constants for Remotion scenes (inline styles only, no Tailwind)
// Values extracted from src/styles/tokens.css

export const TOKENS = {
  bg: '#09090b',
  surface: 'rgba(255,255,255,0.03)',
  surfaceEl: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',
  ink: 'rgba(255,255,255,0.92)',
  inkMuted: 'rgba(255,255,255,0.5)',
  inkFaint: 'rgba(255,255,255,0.25)',
  accent: '#6366F1',
  accentHover: '#5254CC',
  violet: '#8B5CF6',
  success: '#10B981',
  error: '#EF4444',
  warn: '#F59E0B',
  scoreExcellent: '#10B981',
  scoreGood: '#6366F1',
  scoreAverage: '#F59E0B',
  scoreWeak: '#EF4444',
  fontSans: "'Geist', system-ui, sans-serif",
  fontMono: "'Geist Mono', monospace",
  radius: 16,
  radiusSm: 8,
  radiusLg: 20,
  radiusXl: 24,
} as const;

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
