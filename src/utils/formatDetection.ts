// formatDetection.ts — Detect if a file is video or static image

const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const VIDEO_EXTS = [".mp4", ".mov", ".webm"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

export function isVideoFile(file: File): boolean {
  return VIDEO_TYPES.includes(file.type) ||
    VIDEO_EXTS.some(ext => file.name.toLowerCase().endsWith(ext));
}

export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.includes(file.type) ||
    IMAGE_EXTS.some(ext => file.name.toLowerCase().endsWith(ext));
}

export function detectFileFormat(file: File): "video" | "static" | "unknown" {
  if (isVideoFile(file)) return "video";
  if (isImageFile(file)) return "static";
  return "unknown";
}
