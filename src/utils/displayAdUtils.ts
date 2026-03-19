// displayAdUtils.ts — Display ad format detection + dimension constants

export interface DisplayFormat {
  key: string;
  name: string;
  placement: string;
  note?: string; // set when fuzzy-matched (e.g. "actual: 316×266")
}

const DISPLAY_FORMATS: Record<string, { name: string; placement: string }> = {
  "728x90":   { name: "Leaderboard",         placement: "Top of page, above content" },
  "300x250":  { name: "Medium Rectangle",    placement: "Right sidebar, mid-article" },
  "160x600":  { name: "Wide Skyscraper",     placement: "Right rail, full height" },
  "320x50":   { name: "Mobile Banner",       placement: "Bottom of mobile screen" },
  "300x600":  { name: "Half Page",           placement: "Right column, large format" },
  "970x250":  { name: "Billboard",           placement: "Top of page, premium placement" },
  "320x100":  { name: "Large Mobile Banner", placement: "Bottom of mobile screen" },
  "468x60":   { name: "Full Banner",         placement: "Top/bottom of page" },
  "336x280":  { name: "Large Rectangle",     placement: "In-content or sidebar" },
  "250x250":  { name: "Square",              placement: "Right sidebar" },
};

/** Detect standard display ad format from image dimensions (exact + 10% fuzzy) */
export function detectDisplayFormat(width: number, height: number): DisplayFormat | null {
  // Exact match first
  const exactKey = `${width}x${height}`;
  if (DISPLAY_FORMATS[exactKey]) {
    return { key: exactKey, ...DISPLAY_FORMATS[exactKey] };
  }

  // Fuzzy match — within 10% of standard dimensions
  const TOLERANCE = 0.10;
  for (const [key, format] of Object.entries(DISPLAY_FORMATS)) {
    const [stdW, stdH] = key.split("x").map(Number);
    const withinWidth = Math.abs(width - stdW) / stdW <= TOLERANCE;
    const withinHeight = Math.abs(height - stdH) / stdH <= TOLERANCE;
    if (withinWidth && withinHeight) {
      return {
        key,
        ...format,
        note: `Matched to ${key} (actual: ${width}×${height})`,
      };
    }
  }

  return null;
}

/** Get image dimensions from a File object */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/** Format-specific prompt guidance for Gemini */
export function getFormatGuidance(format: DisplayFormat): string {
  const guides: Record<string, string> = {
    "728x90":  "Leaderboard: horizontal read left-to-right. Brand left, offer center, CTA right. Must work in a thin strip.",
    "300x250": "Medium Rectangle: most common display format. Must work in sidebar context next to editorial content.",
    "160x600": "Wide Skyscraper: vertical read top-to-bottom. Sequential story works well. Brand top, CTA bottom.",
    "320x50":  "Mobile Banner: extremely small. Text must be minimal. Single strong image + one-word CTA maximum.",
    "300x600": "Half Page: premium large format. Can tell a fuller visual story. Luxury brands excel here.",
    "970x250": "Billboard: premium top-of-page placement. Maximum impact. Treat like a digital billboard.",
    "320x100": "Large Mobile Banner: slightly more room than 320x50. Still mobile — keep it simple.",
    "468x60":  "Full Banner: legacy format, thin. Similar to leaderboard but narrower.",
    "336x280": "Large Rectangle: slightly bigger than 300x250. Same sidebar placement rules apply.",
    "250x250": "Square: compact. Must be highly focused — one message, one image, one CTA.",
  };
  return guides[format.key] ?? "Non-standard format. Apply general display best practices.";
}
