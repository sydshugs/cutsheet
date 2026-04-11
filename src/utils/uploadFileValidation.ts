// Shared rules for dropzone / idle upload validation.
// Browsers often report "" or "application/octet-stream" for drag-drop (esp. macOS Finder);
// fall back to extension so local dev and production behave the same.

export const UPLOAD_VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const UPLOAD_IMAGE_MIMES = ["image/png", "image/jpeg", "image/jpg", "image/webp"] as const;

const VIDEO_EXTS = [".mp4", ".webm", ".mov"] as const;
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"] as const;

function extMatches(name: string, exts: readonly string[]): boolean {
  const lower = name.toLowerCase();
  return exts.some((ext) => lower.endsWith(ext));
}

function mimeOrExtVideo(f: File): boolean {
  if (UPLOAD_VIDEO_MIMES.includes(f.type as (typeof UPLOAD_VIDEO_MIMES)[number])) return true;
  if (f.type.startsWith("video/") && extMatches(f.name, VIDEO_EXTS)) return true;
  return extMatches(f.name, VIDEO_EXTS);
}

function mimeOrExtImage(f: File): boolean {
  if (UPLOAD_IMAGE_MIMES.includes(f.type as (typeof UPLOAD_IMAGE_MIMES)[number])) return true;
  if (f.type.startsWith("image/") && extMatches(f.name, IMAGE_EXTS)) return true;
  return extMatches(f.name, IMAGE_EXTS);
}

/** True when MIME is missing or generic (common on drag-drop). */
export function isAmbiguousFileMime(type: string): boolean {
  return type === "" || type === "application/octet-stream";
}

/**
 * Accept if explicit allowed MIME, or video/image/* with matching extension,
 * or ambiguous MIME with allowed extension.
 */
export function isAcceptedUploadFile(f: File, acceptImages: boolean): boolean {
  const allowedMimes = new Set<string>([
    ...UPLOAD_VIDEO_MIMES,
    ...(acceptImages ? UPLOAD_IMAGE_MIMES : []),
  ]);
  if (allowedMimes.has(f.type)) return true;
  if (isAmbiguousFileMime(f.type)) {
    return mimeOrExtVideo(f) || (acceptImages && mimeOrExtImage(f));
  }
  if (mimeOrExtVideo(f)) return true;
  if (acceptImages && mimeOrExtImage(f)) return true;
  return false;
}

/** For preview / UI: treat as image when MIME says image or extension is image-only. */
export function isImageUploadFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  if (f.type.startsWith("video/")) return false;
  return extMatches(f.name, IMAGE_EXTS);
}

/**
 * MIME for /api/analyze (must match api/analyze.ts ALLOWED_MIME_TYPES).
 * Fills in missing / octet-stream types from extension after drag-drop.
 */
export function inferUploadMimeType(file: File): string {
  if (file.type && !isAmbiguousFileMime(file.type)) {
    return file.type;
  }
  const n = file.name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".mp4")) return "video/mp4";
  if (n.endsWith(".webm")) return "video/webm";
  if (n.endsWith(".mov")) return "video/quicktime";
  if (n.endsWith(".avi")) return "video/x-msvideo";
  return file.type || "application/octet-stream";
}
