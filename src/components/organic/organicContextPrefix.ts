// src/components/organic/organicContextPrefix.ts
// Prompt prefix strings for Organic Analyzer — extracted to keep parent component lean.

export function getOrganicContextPrefix(
  organicFormat: "video" | "static",
  platformLabel: string,
): string {
  if (organicFormat === "static") {
    return `This is ORGANIC content, not a paid ad.
Do NOT score for: CTA, conversion, purchase friction, offer clarity, ad spend efficiency, or any paid advertising metrics.
Score for: entertainment value, native platform feel, save-worthiness, shareability (DM potential), caption hook effectiveness, visual stopping power in a feed scroll, and platform-native feel for ${platformLabel}.
A high-scoring organic post feels like real creator content — not an ad.

REPLACE the "CTA Effectiveness" dimension with "Shareability & Save-Worthiness" in the QUICK SCORES section.
Score "Shareability & Save-Worthiness" on: Would someone DM this to a friend? Would they save it for later? Does it trigger the share impulse?

There is no retention curve or scene breakdown for static content.
Do NOT include a budget recommendation. This is organic content — there is no ad spend.
Do NOT include any CTA-related improvements. Replace CTA suggestions with shareability or caption improvements.

CRITICAL: In the HASHTAGS section, use EXACTLY these three platform labels and format. Do NOT use TikTok. Do NOT omit Pinterest:
META: #tag1 #tag2 #tag3
INSTAGRAM: #tag1 #tag2 #tag3 #tag4 #tag5
PINTEREST: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8`;
  }

  return `This is ORGANIC content, not a paid ad.
Do NOT score for: CTA, conversion, purchase friction, offer clarity, ad spend efficiency, or any paid advertising metrics.
Score for: entertainment value, native feel, completion probability, rewatch potential, shareability (DM potential), algorithm signals for ${platformLabel}, and caption discoverability.
A high-scoring organic post feels like real creator content — not an ad.
Score as if a viewer found this organically on their feed.

REPLACE the "CTA Effectiveness" dimension with "Shareability & Rewatch" in the QUICK SCORES section.
Score "Shareability & Rewatch" on: Does this make someone share, save, or watch again? Does it trigger the algorithm's engagement signals?

Do NOT include a budget recommendation. This is organic content — there is no ad spend.
Do NOT include any CTA-related improvements. Replace CTA suggestions with engagement, retention, or caption improvements.

CRITICAL: In the HASHTAGS section, use EXACTLY these three platform labels and format. Do NOT use META or INSTAGRAM (without Reels). Do NOT omit YouTube Shorts:
TIKTOK: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12
INSTAGRAM REELS: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8
YOUTUBE SHORTS: #tag1 #tag2 #tag3 #tag4 #tag5`;
}
