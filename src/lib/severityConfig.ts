export type Severity = 'critical' | 'warning' | 'note';

export const SEVERITY_STYLES: Record<Severity, { borderColor: string; bg: string }> = {
  critical: { borderColor: 'var(--error)',     bg: 'var(--score-weak-bg)' },
  warning:  { borderColor: 'var(--warn)',      bg: 'var(--score-average-bg)' },
  note:     { borderColor: 'var(--ink-faint)', bg: 'var(--surface)' },
};

export type SecondEyeCategory = 'scroll_trigger' | 'sound_off' | 'pacing' | 'clarity';

export const CATEGORY_META: Record<SecondEyeCategory, { label: string; color: string; bg: string }> = {
  scroll_trigger: { label: 'Scroll risk', color: 'var(--error)',        bg: 'var(--score-weak-bg)' },
  sound_off:      { label: 'Sound-off',   color: 'var(--accent-text)',  bg: 'var(--accent-bg)' },
  pacing:         { label: 'Pacing',       color: 'var(--warn)',         bg: 'var(--score-average-bg)' },
  clarity:        { label: 'Clarity',      color: 'var(--success)',      bg: 'var(--score-excellent-bg)' },
};

export type PolicyVerdict = 'good' | 'fix' | 'high_risk';

export const VERDICT_CONFIG: Record<PolicyVerdict, { bg: string; border: string; color: string; label: string }> = {
  good:      { bg: 'var(--score-excellent-bg)', border: 'var(--score-excellent-border)', color: 'var(--success)', label: 'All clear' },
  fix:       { bg: 'var(--score-average-bg)',   border: 'var(--score-average-border)',   color: 'var(--warn)',    label: 'Fix before launch' },
  high_risk: { bg: 'var(--score-weak-bg)',      border: 'var(--score-weak-border)',      color: 'var(--error)',   label: 'High rejection risk' },
};
