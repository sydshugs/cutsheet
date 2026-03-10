// shareService.ts
// Public share link creation via Supabase

import { saveAnalysis } from "./supabaseClient";

interface SharePayload {
  file_name: string;
  scores: {
    hook: number;
    clarity: number;
    cta: number;
    production: number;
    overall: number;
  };
  markdown: string;
}

export async function createShare(payload: SharePayload): Promise<string> {
  const { slug, error } = await saveAnalysis(
    payload.file_name,
    payload.scores,
    payload.markdown
  );

  if (error) {
    throw new Error(`Failed to create share link: ${error}`);
  }

  return slug;
}
