// platformFormatWarnings.ts — Pure deterministic logic for aspect ratio / platform mismatch warnings
// Zero AI calls, zero credits, zero side effects. Fully testable.

export type AspectRatio = '9:16' | '4:5' | '1:1' | '4:3' | '16:9' | 'unknown';
export type Severity = 'error' | 'warning' | 'info';

export interface FormatWarning {
  id: string;
  severity: Severity;
  platform: string;
  message: string;
  tip?: string;
}

export interface DimensionInput {
  width: number;
  height: number;
  platform: string; // 'all' | 'Meta' | 'TikTok' | 'Google' | 'YouTube'
  format: 'video' | 'static';
}

// ─── Aspect Ratio Detection ──────────────────────────────────────────────────

const RATIO_MAP: Array<{ ratio: number; label: AspectRatio }> = [
  { ratio: 9 / 16, label: '9:16' },   // 0.5625
  { ratio: 4 / 5, label: '4:5' },     // 0.8
  { ratio: 1, label: '1:1' },          // 1.0
  { ratio: 4 / 3, label: '4:3' },     // 1.333
  { ratio: 16 / 9, label: '16:9' },   // 1.778
];

const TOLERANCE = 0.02; // ±2%

export function detectAspectRatio(width: number, height: number): AspectRatio {
  if (width <= 0 || height <= 0) return 'unknown';
  const ratio = width / height;
  for (const entry of RATIO_MAP) {
    const diff = Math.abs(ratio - entry.ratio) / entry.ratio;
    if (diff <= TOLERANCE) return entry.label;
  }
  return 'unknown';
}

// ─── Warning Rules ───────────────────────────────────────────────────────────

function getTikTokWarnings(ar: AspectRatio, format: 'video' | 'static'): FormatWarning[] {
  const warnings: FormatWarning[] = [];

  if (format === 'video') {
    if (ar === '1:1') {
      warnings.push({
        id: 'tiktok_1x1_crop',
        severity: 'error',
        platform: 'TikTok',
        message: '1:1 video will be heavily cropped on TikTok \u2014 top and bottom will be cut off',
        tip: 'Reformat to 9:16 for TikTok. Your CTA and hook are likely in the danger zone.',
      });
    }
    if (ar === '16:9') {
      warnings.push({
        id: 'tiktok_16x9_bars',
        severity: 'warning',
        platform: 'TikTok',
        message: '16:9 video will show large black bars on TikTok \u2014 takes up ~56% of the screen',
        tip: 'Reformat to 9:16 or 4:5 minimum. Widescreen performs significantly worse on TikTok.',
      });
    }
    if (ar === '4:3') {
      warnings.push({
        id: 'tiktok_4x3_bars',
        severity: 'warning',
        platform: 'TikTok',
        message: '4:3 video will show black bars on TikTok and feel dated',
        tip: 'Reformat to 9:16 for full-screen impact.',
      });
    }
    if (ar === '4:5') {
      warnings.push({
        id: 'tiktok_4x5_partial',
        severity: 'info',
        platform: 'TikTok',
        message: '4:5 video is accepted on TikTok but won\u2019t fill the screen \u2014 small black bars will appear',
        tip: '9:16 fills the full screen. 4:5 is acceptable for cross-platform repurposing.',
      });
    }
  }

  if (format === 'static') {
    if (ar === '1:1') {
      warnings.push({
        id: 'tiktok_1x1_static',
        severity: 'warning',
        platform: 'TikTok',
        message: 'Square static ads are uncommon on TikTok and may underperform feed placements',
        tip: 'TikTok carousel static works in 9:16 or 1:1. Consider 9:16 for single image.',
      });
    }
  }

  return warnings;
}

function getMetaWarnings(ar: AspectRatio, format: 'video' | 'static'): FormatWarning[] {
  const warnings: FormatWarning[] = [];

  if (format === 'video') {
    if (ar === '16:9') {
      warnings.push({
        id: 'meta_16x9_stories',
        severity: 'warning',
        platform: 'Meta',
        message: '16:9 will show black bars on Meta Stories and Reels \u2014 only ~56% of the screen used',
        tip: 'Use 9:16 for Stories/Reels placements. 16:9 is fine for Feed and in-stream.',
      });
      warnings.push({
        id: 'meta_16x9_feed_ok',
        severity: 'info',
        platform: 'Meta',
        message: '16:9 is fine for Meta Feed and in-stream, but will be cropped to 4:5 in some Feed placements',
        tip: 'Keep key visuals and text in the safe center zone to avoid cropping.',
      });
    }
  }

  if (format === 'static') {
    if (ar === '9:16') {
      warnings.push({
        id: 'meta_9x16_static_crop',
        severity: 'warning',
        platform: 'Meta',
        message: '9:16 static will be cropped to 4:5 in Meta Feed \u2014 bottom ~10% may be cut off',
        tip: 'Keep your CTA and logo above the bottom 15% of the frame.',
      });
    }
  }

  return warnings;
}

function getGoogleWarnings(ar: AspectRatio, format: 'video' | 'static'): FormatWarning[] {
  const warnings: FormatWarning[] = [];

  if (ar === '9:16') {
    warnings.push({
      id: 'google_9x16_display',
      severity: 'error',
      platform: 'Google',
      message: '9:16 is not a standard Google Display Network format and will not serve correctly',
      tip: 'GDN standard sizes: 300\u00d7250, 728\u00d790, 160\u00d7600, 300\u00d7600, 970\u00d7250. Use the Display Analyzer for correct sizing.',
    });
  }

  if (format === 'video' && ar === '1:1') {
    warnings.push({
      id: 'google_1x1_video',
      severity: 'warning',
      platform: 'Google',
      message: '1:1 video is not optimized for Google Display Network placements',
      tip: 'YouTube video ads perform best in 16:9. Display static uses fixed IAB dimensions.',
    });
  }

  return warnings;
}

function getYouTubeWarnings(ar: AspectRatio, format: 'video' | 'static'): FormatWarning[] {
  const warnings: FormatWarning[] = [];

  if (format === 'video') {
    if (ar === '9:16') {
      warnings.push({
        id: 'youtube_9x16_shorts',
        severity: 'info',
        platform: 'YouTube',
        message: '9:16 is correct for YouTube Shorts but not for standard YouTube ads',
        tip: 'If targeting Shorts, this is fine. For pre-roll/in-stream, use 16:9.',
      });
    } else if (ar !== '16:9') {
      warnings.push({
        id: 'youtube_non_16x9',
        severity: 'error',
        platform: 'YouTube',
        message: 'YouTube requires 16:9 video \u2014 other ratios will show black bars or be rejected',
        tip: 'Reformat to 16:9 before uploading to YouTube. Shorts use 9:16.',
      });
    }
  }

  return warnings;
}

function getUnknownRatioWarning(): FormatWarning {
  return {
    id: 'unknown_ratio',
    severity: 'info',
    platform: 'all',
    message: 'Could not detect a standard aspect ratio \u2014 verify dimensions before publishing',
  };
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function getFormatWarnings(input: DimensionInput): FormatWarning[] {
  const ar = detectAspectRatio(input.width, input.height);

  if (ar === 'unknown') return [getUnknownRatioWarning()];

  const platform = input.platform.toLowerCase();

  if (platform === 'all') {
    // Collect from Meta + TikTok only — Google requires explicit selection
    const all = [
      ...getMetaWarnings(ar, input.format),
      ...getTikTokWarnings(ar, input.format),
    ];
    // Deduplicate by id
    const seen = new Set<string>();
    const deduped = all.filter((w) => {
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
    // For 'all', only return error + warning (omit info to reduce noise)
    return deduped.filter((w) => w.severity === 'error' || w.severity === 'warning');
  }

  if (platform === 'meta') return getMetaWarnings(ar, input.format);
  if (platform === 'tiktok') return getTikTokWarnings(ar, input.format);
  if (platform === 'google') return getGoogleWarnings(ar, input.format);
  if (platform === 'youtube') return getYouTubeWarnings(ar, input.format);

  return [];
}
