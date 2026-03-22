// supabaseClient.ts
// Supabase client for public shareable links

import { supabase } from "../lib/supabase";
export { supabase };

// Generate random alphanumeric slug
export function generateSlug(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Database types
export interface Analysis {
  id: string;
  slug: string;
  file_name: string;
  scores: {
    hook: number;
    clarity: number;
    cta: number;
    production: number;
    overall: number;
  };
  markdown: string;
  created_at: string;
}

// Save analysis to Supabase
export async function saveAnalysis(
  fileName: string,
  scores: Analysis["scores"],
  markdown: string
): Promise<{ slug: string; error?: string }> {
  if (!supabase) {
    return { slug: "", error: "Supabase not configured" };
  }

  const slug = generateSlug(8);

  const { error } = await supabase.from("analyses").insert({
    slug,
    file_name: fileName,
    scores,
    markdown,
  });

  if (error) {
    console.error("Error saving analysis:", error);
    const message =
      error.message === "Invalid API key"
        ? "Invalid API key. Copy the anon (public) key from Supabase Dashboard → your project → Settings → API — it's a long JWT starting with eyJ. Put it in .env as VITE_SUPABASE_ANON_KEY and restart the dev server."
        : error.message;
    return { slug: "", error: message };
  }

  return { slug };
}

// Fetch analysis by slug
export async function getAnalysisBySlug(
  slug: string
): Promise<{ analysis: Analysis | null; error?: string }> {
  if (!supabase) {
    return { analysis: null, error: "Supabase not configured" };
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching analysis:", error);
    return { analysis: null, error: error.message };
  }

  return { analysis: data };
}
