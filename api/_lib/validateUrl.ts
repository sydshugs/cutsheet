// api/_lib/validateUrl.ts — SSRF protection for user-provided URLs

const ALLOWED_HOSTS = [
  // YouTube
  "youtube.com", "www.youtube.com", "youtu.be", "i.ytimg.com", "img.youtube.com",
  // Meta / Facebook
  "facebook.com", "www.facebook.com", "fbcdn.net", "scontent.fbcdn.net",
  "external.fbcdn.net", "graph.facebook.com",
  // Instagram
  "instagram.com", "www.instagram.com", "cdninstagram.com",
  // TikTok
  "tiktok.com", "www.tiktok.com", "v16-webapp.tiktok.com",
  "p16-sign.tiktokcdn-us.com", "p16-sign.tiktokcdn.com",
];

/**
 * Validate a user-provided URL is safe to fetch server-side.
 * Returns null if valid, or an error message string if blocked.
 */
export function validateFetchUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Invalid URL format";
  }

  // Block non-HTTPS (prevents file://, ftp://, data://, http:// to internal)
  if (parsed.protocol !== "https:") {
    return "Only HTTPS URLs are allowed";
  }

  // Block IP addresses directly (prevents 169.254.x, 10.x, 127.x, etc.)
  const host = parsed.hostname;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host === "localhost" || host.startsWith("[")) {
    return "IP addresses and localhost are not allowed";
  }

  // Allowlist check
  const matchesAllowed = ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
  if (!matchesAllowed) {
    return `Domain not allowed: ${host}`;
  }

  return null; // Valid
}
