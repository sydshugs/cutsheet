// api/_lib/validateInput.ts — Input validation helpers for prompt-injected fields

const ALLOWED_PLATFORMS = [
  "meta", "facebook", "instagram", "tiktok", "youtube", "google",
  "google_display", "linkedin", "twitter", "x", "pinterest", "snapchat", "reddit",
  "all", "both", "general",
];

const ALLOWED_AD_TYPES = [
  "static", "video", "display", "carousel", "story", "reel", "general",
];

/** Sanitize platform string to an allowed value. Returns "general" if invalid. */
export function safePlatform(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "general";
  const lower = raw.toLowerCase().trim();
  return ALLOWED_PLATFORMS.includes(lower) ? lower : "general";
}

/** Sanitize adType string to an allowed value. Returns "static" if invalid. */
export function safeAdType(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "static";
  const lower = raw.toLowerCase().trim();
  return ALLOWED_AD_TYPES.includes(lower) ? lower : "static";
}

/** Sanitize niche — alphanumeric + spaces + hyphens only, max 100 chars. */
export function safeNiche(raw: unknown): string {
  if (!raw || typeof raw !== "string") return "general";
  return raw.replace(/[^a-zA-Z0-9 &\-/]/g, "").slice(0, 100).trim() || "general";
}

/** Max base64 payload size (5MB decoded ≈ 6.7MB base64). Returns error or null. */
const MAX_BASE64_LENGTH = 6_700_000;

export function validateBase64Size(data: unknown, fieldName: string): string | null {
  if (!data || typeof data !== "string") return null;
  if (data.length > MAX_BASE64_LENGTH) {
    return `${fieldName} exceeds maximum size (5MB)`;
  }
  return null;
}
