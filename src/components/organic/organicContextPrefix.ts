// src/components/organic/organicContextPrefix.ts
// DEPRECATED — superseded by ORGANIC_ANALYSIS_PROMPT in analyzerService.ts.
// Returning empty string to avoid double-prompting. Remove after one week of clean staging.

export function getOrganicContextPrefix(
  _organicFormat: "video" | "static",
  _platformLabel: string,
): string {
  return "";
}
