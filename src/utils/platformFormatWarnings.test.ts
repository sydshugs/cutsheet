// platformFormatWarnings.test.ts — Unit tests for aspect ratio detection and platform warning logic
// Run: npx vitest run src/utils/platformFormatWarnings.test.ts

import { describe, it, expect } from 'vitest';
import { detectAspectRatio, getFormatWarnings } from './platformFormatWarnings';

// ─── detectAspectRatio ────────────────────────────────────────────────────────

describe('detectAspectRatio', () => {
  describe('exact ratios', () => {
    it('1080×1920 → 9:16', () => {
      expect(detectAspectRatio(1080, 1920)).toBe('9:16');
    });

    it('1080×1350 → 4:5', () => {
      expect(detectAspectRatio(1080, 1350)).toBe('4:5');
    });

    it('1080×1080 → 1:1', () => {
      expect(detectAspectRatio(1080, 1080)).toBe('1:1');
    });

    it('1440×1080 → 4:3', () => {
      expect(detectAspectRatio(1440, 1080)).toBe('4:3');
    });

    it('1920×1080 → 16:9', () => {
      expect(detectAspectRatio(1920, 1080)).toBe('16:9');
    });
  });

  describe('within ±2% tolerance', () => {
    it('1080×1921 (just within 9:16 tolerance) → 9:16', () => {
      // ratio = 1080/1921 ≈ 0.5622, target = 0.5625, diff = 0.053% — within tolerance
      expect(detectAspectRatio(1080, 1921)).toBe('9:16');
    });

    it('1920×1082 (just within 16:9 tolerance) → 16:9', () => {
      // ratio = 1920/1082 ≈ 1.7745, target = 1.7778, diff ≈ 0.18% — within tolerance
      expect(detectAspectRatio(1920, 1082)).toBe('16:9');
    });

    it('720×720 → 1:1', () => {
      expect(detectAspectRatio(720, 720)).toBe('1:1');
    });
  });

  describe('unknown ratios', () => {
    it('1200×850 non-standard ratio → unknown', () => {
      // ratio ≈ 1.412, between 4:3 (1.333) and 16:9 (1.778) — outside ±2% of both
      expect(detectAspectRatio(1200, 850)).toBe('unknown');
    });

    it('1100×900 non-standard ratio → unknown', () => {
      // ratio ≈ 1.222, between 1:1 (1.0) and 4:3 (1.333) — outside ±2% of both
      expect(detectAspectRatio(1100, 900)).toBe('unknown');
    });

    it('960×700 non-standard ratio → unknown', () => {
      // ratio ≈ 1.371, between 4:3 (1.333) and 16:9 (1.778) — outside ±2% of both
      expect(detectAspectRatio(960, 700)).toBe('unknown');
    });
  });

  describe('edge cases', () => {
    it('0×0 → unknown', () => {
      expect(detectAspectRatio(0, 0)).toBe('unknown');
    });

    it('0 width → unknown', () => {
      expect(detectAspectRatio(0, 1080)).toBe('unknown');
    });

    it('0 height → unknown', () => {
      expect(detectAspectRatio(1920, 0)).toBe('unknown');
    });
  });
});

// ─── getFormatWarnings — TikTok ───────────────────────────────────────────────

describe('getFormatWarnings — TikTok', () => {
  it('1:1 video → tiktok_1x1_crop (error)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1080, platform: 'TikTok', format: 'video' });
    expect(w.some((x) => x.id === 'tiktok_1x1_crop')).toBe(true);
    expect(w.find((x) => x.id === 'tiktok_1x1_crop')?.severity).toBe('error');
  });

  it('16:9 video → tiktok_16x9_bars (warning)', () => {
    const w = getFormatWarnings({ width: 1920, height: 1080, platform: 'TikTok', format: 'video' });
    expect(w.some((x) => x.id === 'tiktok_16x9_bars')).toBe(true);
    expect(w.find((x) => x.id === 'tiktok_16x9_bars')?.severity).toBe('warning');
  });

  it('4:3 video → tiktok_4x3_bars (warning)', () => {
    const w = getFormatWarnings({ width: 1440, height: 1080, platform: 'TikTok', format: 'video' });
    expect(w.some((x) => x.id === 'tiktok_4x3_bars')).toBe(true);
    expect(w.find((x) => x.id === 'tiktok_4x3_bars')?.severity).toBe('warning');
  });

  it('4:5 video → tiktok_4x5_partial (info)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1350, platform: 'TikTok', format: 'video' });
    expect(w.some((x) => x.id === 'tiktok_4x5_partial')).toBe(true);
    expect(w.find((x) => x.id === 'tiktok_4x5_partial')?.severity).toBe('info');
  });

  it('9:16 video → no warnings', () => {
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'TikTok', format: 'video' });
    expect(w).toHaveLength(0);
  });

  it('1:1 static → tiktok_1x1_static (warning)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1080, platform: 'TikTok', format: 'static' });
    expect(w.some((x) => x.id === 'tiktok_1x1_static')).toBe(true);
    expect(w.find((x) => x.id === 'tiktok_1x1_static')?.severity).toBe('warning');
  });

  it('9:16 static → no TikTok warnings', () => {
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'TikTok', format: 'static' });
    expect(w).toHaveLength(0);
  });
});

// ─── getFormatWarnings — Meta ─────────────────────────────────────────────────

describe('getFormatWarnings — Meta', () => {
  it('16:9 video → meta_16x9_stories (warning) + meta_16x9_feed_ok (info)', () => {
    const w = getFormatWarnings({ width: 1920, height: 1080, platform: 'Meta', format: 'video' });
    expect(w.some((x) => x.id === 'meta_16x9_stories')).toBe(true);
    expect(w.find((x) => x.id === 'meta_16x9_stories')?.severity).toBe('warning');
    expect(w.some((x) => x.id === 'meta_16x9_feed_ok')).toBe(true);
    expect(w.find((x) => x.id === 'meta_16x9_feed_ok')?.severity).toBe('info');
  });

  it('9:16 video → no Meta warnings', () => {
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'Meta', format: 'video' });
    expect(w).toHaveLength(0);
  });

  it('4:5 video → no Meta warnings', () => {
    const w = getFormatWarnings({ width: 1080, height: 1350, platform: 'Meta', format: 'video' });
    expect(w).toHaveLength(0);
  });

  it('9:16 static → meta_9x16_static_crop (warning)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'Meta', format: 'static' });
    expect(w.some((x) => x.id === 'meta_9x16_static_crop')).toBe(true);
    expect(w.find((x) => x.id === 'meta_9x16_static_crop')?.severity).toBe('warning');
  });

  it('4:5 static → no Meta warnings', () => {
    const w = getFormatWarnings({ width: 1080, height: 1350, platform: 'Meta', format: 'static' });
    expect(w).toHaveLength(0);
  });

  it('1:1 static → no Meta warnings', () => {
    const w = getFormatWarnings({ width: 1080, height: 1080, platform: 'Meta', format: 'static' });
    expect(w).toHaveLength(0);
  });
});

// ─── getFormatWarnings — Google ───────────────────────────────────────────────

describe('getFormatWarnings — Google', () => {
  it('9:16 video → google_9x16_display (error)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'Google', format: 'video' });
    expect(w.some((x) => x.id === 'google_9x16_display')).toBe(true);
    expect(w.find((x) => x.id === 'google_9x16_display')?.severity).toBe('error');
  });

  it('9:16 static → google_9x16_display (error)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'Google', format: 'static' });
    expect(w.some((x) => x.id === 'google_9x16_display')).toBe(true);
    expect(w.find((x) => x.id === 'google_9x16_display')?.severity).toBe('error');
  });

  it('1:1 video → google_1x1_video (warning)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1080, platform: 'Google', format: 'video' });
    expect(w.some((x) => x.id === 'google_1x1_video')).toBe(true);
    expect(w.find((x) => x.id === 'google_1x1_video')?.severity).toBe('warning');
  });

  it('1:1 static → no google_1x1_video warning (video-only rule)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1080, platform: 'Google', format: 'static' });
    expect(w.some((x) => x.id === 'google_1x1_video')).toBe(false);
  });

  it('16:9 video → no Google warnings', () => {
    const w = getFormatWarnings({ width: 1920, height: 1080, platform: 'Google', format: 'video' });
    expect(w).toHaveLength(0);
  });
});

// ─── getFormatWarnings — YouTube ──────────────────────────────────────────────

describe('getFormatWarnings — YouTube', () => {
  it('9:16 video → youtube_9x16_shorts (info)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'YouTube', format: 'video' });
    expect(w.some((x) => x.id === 'youtube_9x16_shorts')).toBe(true);
    expect(w.find((x) => x.id === 'youtube_9x16_shorts')?.severity).toBe('info');
  });

  it('16:9 video → no YouTube warnings', () => {
    const w = getFormatWarnings({ width: 1920, height: 1080, platform: 'YouTube', format: 'video' });
    expect(w).toHaveLength(0);
  });

  it('4:5 video → youtube_non_16x9 (error)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1350, platform: 'YouTube', format: 'video' });
    expect(w.some((x) => x.id === 'youtube_non_16x9')).toBe(true);
    expect(w.find((x) => x.id === 'youtube_non_16x9')?.severity).toBe('error');
  });

  it('1:1 video → youtube_non_16x9 (error)', () => {
    const w = getFormatWarnings({ width: 1080, height: 1080, platform: 'YouTube', format: 'video' });
    expect(w.some((x) => x.id === 'youtube_non_16x9')).toBe(true);
    expect(w.find((x) => x.id === 'youtube_non_16x9')?.severity).toBe('error');
  });

  it('4:3 video → youtube_non_16x9 (error)', () => {
    const w = getFormatWarnings({ width: 1440, height: 1080, platform: 'YouTube', format: 'video' });
    expect(w.some((x) => x.id === 'youtube_non_16x9')).toBe(true);
    expect(w.find((x) => x.id === 'youtube_non_16x9')?.severity).toBe('error');
  });

  it('static format → no YouTube warnings regardless of ratio', () => {
    const w = getFormatWarnings({ width: 1080, height: 1350, platform: 'YouTube', format: 'static' });
    expect(w).toHaveLength(0);
  });
});

// ─── getFormatWarnings — 'all' platform ───────────────────────────────────────

describe("getFormatWarnings — platform 'all'", () => {
  it("9:16 video on all → no errors or warnings (correct for Meta + TikTok)", () => {
    // NOTE: 'all' includes Google. Google flags 9:16 as error (google_9x16_display).
    // This test expects 0 errors but the actual result will have 1 (Google's error).
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'all', format: 'video' });
    const errors = w.filter((x) => x.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it("16:9 video on all → at least meta_16x9_stories warning (info filtered out)", () => {
    const w = getFormatWarnings({ width: 1920, height: 1080, platform: 'all', format: 'video' });
    // meta_16x9_stories (warning) should be included
    expect(w.some((x) => x.id === 'meta_16x9_stories')).toBe(true);
    // meta_16x9_feed_ok (info) should be excluded
    expect(w.some((x) => x.id === 'meta_16x9_feed_ok')).toBe(false);
    // tiktok_16x9_bars (warning) should be included
    expect(w.some((x) => x.id === 'tiktok_16x9_bars')).toBe(true);
    // No info severities should appear
    expect(w.every((x) => x.severity !== 'info')).toBe(true);
  });

  it("1:1 video on all → tiktok_1x1_crop (error), no google_1x1_video (Google excluded from all), no info", () => {
    const w = getFormatWarnings({ width: 1080, height: 1080, platform: 'all', format: 'video' });
    expect(w.some((x) => x.id === 'tiktok_1x1_crop')).toBe(true);
    // Google is excluded from 'all' — google_1x1_video must not appear
    expect(w.some((x) => x.id === 'google_1x1_video')).toBe(false);
    expect(w.every((x) => x.severity !== 'info')).toBe(true);
  });

  it("4:5 video on all → no errors or warnings (4:5 is fine for Meta + TikTok, no Google rule)", () => {
    const w = getFormatWarnings({ width: 1080, height: 1350, platform: 'all', format: 'video' });
    // tiktok_4x5_partial is info, filtered out in 'all' mode
    expect(w).toHaveLength(0);
  });

  it("9:16 static on all → meta_9x16_static_crop (warning)", () => {
    const w = getFormatWarnings({ width: 1080, height: 1920, platform: 'all', format: 'static' });
    expect(w.some((x) => x.id === 'meta_9x16_static_crop')).toBe(true);
  });

  it("deduplication — no duplicate ids in 'all' result", () => {
    const w = getFormatWarnings({ width: 1920, height: 1080, platform: 'all', format: 'video' });
    const ids = w.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it("YouTube warnings are NOT included in 'all'", () => {
    const w = getFormatWarnings({ width: 1080, height: 1350, platform: 'all', format: 'video' });
    expect(w.some((x) => x.id === 'youtube_non_16x9')).toBe(false);
    expect(w.some((x) => x.id === 'youtube_9x16_shorts')).toBe(false);
  });
});

// ─── getFormatWarnings — unknown ratio ────────────────────────────────────────

describe('getFormatWarnings — unknown ratio', () => {
  it('returns unknown_ratio info warning for unrecognized dimensions', () => {
    // Use a ratio that is genuinely outside all ±2% tolerance windows
    // e.g. 1000×500 = 2.0, far from 16/9 (1.778) — diff = (2.0-1.778)/1.778 = 12.5% > 2%
    const w = getFormatWarnings({ width: 1000, height: 500, platform: 'TikTok', format: 'video' });
    expect(w).toHaveLength(1);
    expect(w[0].id).toBe('unknown_ratio');
    expect(w[0].severity).toBe('info');
  });

  it('unknown ratio returns same single warning regardless of platform', () => {
    const dims = { width: 1000, height: 500 };
    const platforms = ['TikTok', 'Meta', 'Google', 'YouTube', 'all'];
    for (const platform of platforms) {
      const w = getFormatWarnings({ ...dims, platform, format: 'video' });
      expect(w).toHaveLength(1);
      expect(w[0].id).toBe('unknown_ratio');
    }
  });
});
