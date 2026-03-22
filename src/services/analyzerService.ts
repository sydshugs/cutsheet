// analyzerService.ts
// Drop this into src/services/analyzerService.ts

import { generateImprovements as claudeImprovements } from "./claudeService";
import { supabase } from "../lib/supabase";
import { incrementAnalysisCount } from "./usageService";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const MAX_TOKENS = 8192;

// ─── SERVER-SIDE GEMINI PROXY ────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

async function callGeminiProxy(params: {
  base64Data?: string;
  fileUrl?: string;
  mimeType?: string;
  prompt: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}): Promise<string> {
  const token = await getAuthToken();
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    const secs = (data as { resetAt?: string }).resetAt
      ? Math.ceil((new Date((data as { resetAt: string }).resetAt).getTime() - Date.now()) / 1000)
      : 60;
    throw new Error(`RATE_LIMITED:${secs}`);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `API error ${response.status}`);
  }

  const result = await response.json() as { text: string };
  return result.text;
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert performance marketing creative analyst with 10+ years experience buying and producing paid social ads across Meta, TikTok, and YouTube.

Your job is to analyze video ads the way a senior media buyer would — not as a film critic, not as an AI assistant, but as someone whose job is to predict whether creative will convert and why.

Your analysis must be:
- Direct and opinionated. Don't hedge everything.
- If something is weak, say it's weak and explain why.
- Written like a human expert briefing a creative team, not a robot summarizing content.
- Focused on performance signals: hook strength, message clarity, CTA, retention, emotion.

You will return analysis in exact structured markdown format. Do not add commentary before or after the structured output. Return only the markdown.`;

// ─── ANALYSIS PROMPT ─────────────────────────────────────────────────────────

const ANALYSIS_PROMPT = `Analyze this video ad and return a structured breakdown in this exact format:

---

## 🎣 HOOK ANALYSIS (0–3s)
- **Opening frame:** What is the very first visual the viewer sees?
- **Hook type:** [Pattern interrupt / Curiosity gap / Bold claim / Social proof / Shock / Relatability]
- **Hook strength:** [Weak / Moderate / Strong] — one sentence explaining why
- **Scroll-stop factor:** Would a thumb stop here? Why or why not?

---

## 🎬 SCENE BREAKDOWN
For each scene:

**Scene [N] — [START]s to [END]s**
- Visual: What is happening on screen?
- Voiceover/Dialogue: Exact words spoken (or "None")
- On-screen text: Any text overlays, captions, or supers (or "None")
- Camera: [Static / Pan / Zoom / Tracking / Cut / Transition type]
- Pacing: [Fast / Medium / Slow]

---

## 📢 MESSAGING STRUCTURE
- **Format:** [Problem-Agitate-Solution / Before-After / Tutorial / Testimonial / Day-in-life / Skit / Other]
- **Core claim:** The single biggest promise this ad makes
- **Proof points:** Evidence or credibility signals used
- **CTA:** Exact action requested and timestamp (if no CTA exists, flag this as a problem)

---

## 😮 EMOTION ARC
Map the viewer's emotional journey start to finish using this format:
[Emotion] → [Emotion] → [Emotion] → [Emotion]

---

## ⚡ PACING & RETENTION SIGNALS
- **Average scene length:** Xs
- **Overall pacing:** [Fast-cut / Moderate / Slow-burn]
- **Retention hooks:** Moments designed to keep viewers watching (callbacks, open loops, reveals, pattern interrupts)
- **Drop-off risk moments:** Points where a viewer might scroll away and why

---

## 📝 FULL TRANSCRIPT
Clean timestamped transcript of all spoken audio and on-screen text:
[0:00] "..."
[0:04] "..."

---

## 🧠 CREATIVE VERDICT
IMPORTANT: Do not mention the user's role, niche, or platform in the Creative Verdict. Never say "as a designer", "for an agency", "for your YouTube audience" or any similar phrase. Write the verdict as expert analysis of the creative itself only.
Three paragraphs written as a media buyer debriefing a creative team:
1. What this ad does well and why it likely works (or doesn't)
2. Who the target audience appears to be and whether the messaging matches them
3. One specific, actionable recommendation to improve performance

---

## 📊 QUICK SCORES
All scores must be whole numbers (integers) only. Never use decimals like 7.5. Round to nearest whole number.
Scoring rubric (apply consistently every time):
1-3: Fundamentally broken — missing core elements
4-5: Below average — significant issues
6-7: Average — works but needs improvement
8-9: Strong — minor improvements only
10: Exceptional — rare, near perfect
A 7/10 means the same thing every time.
- Hook Strength: X/10
- Message Clarity: X/10
- CTA Effectiveness: X/10
- Production Quality: X/10
- Overall Ad Strength: X/10

---

## 🪝 HOOK DETAIL
Evaluate ONLY the first 3 seconds. Does it create a pattern interrupt? Does it earn the next 5 seconds of attention? Score strictly — a generic product shot opening is a 2, not a 6.
- Hook Type: [Pattern Interrupt | Curiosity Gap | Bold Claim | Social Proof | Problem-Agitate | Question Hook | None detected]
- Hook Verdict: [Scroll-Stopper | Needs Work | Weak Open]
- First 3 Seconds: [one sentence describing exactly what happens in the first 3 seconds]
- Hook Fix: [one sentence actionable fix if Hook Strength < 8, or "None needed" if >= 8]

---

## 🔧 IMPROVEMENTS
After your analysis, list exactly 3-5 specific, actionable suggestions to improve this creative. Each suggestion should be one sentence, direct, and specific to what you observed in this creative. Format as a numbered list.
1. [Specific improvement based on what you observed]
2. [Specific improvement based on what you observed]
3. [Specific improvement based on what you observed]

---

Do NOT include a budget recommendation section. Budget guidance is handled separately.

---

## 🎬 SCENE JSON
After the markdown analysis above, append a JSON block with a scene-by-scene breakdown (3–6 scenes maximum). Wrap it in a fenced code block tagged exactly as \`\`\`json:

\`\`\`json
{
  "scenes": [
    {
      "timestamp": "0:00 — 0:05",
      "title": "Opening hook",
      "visual": "What is happening visually in this scene",
      "working": "What is working about this scene",
      "improve": "What could be improved"
    }
  ]
}
\`\`\`

Rules:
- Include 3–6 scenes that cover the full duration of the creative
- Timestamps use the format "M:SS — M:SS"
- title is 3–5 words, plain text, no punctuation
- visual, working, improve are each one sentence
- Do not add any text between the markdown and the JSON block other than the section header above`;

// ─── STATIC AD ANALYSIS PROMPT ──────────────────────────────────────────────

const STATIC_ANALYSIS_PROMPT = `Analyze this STATIC image ad and return a structured breakdown in this exact format.
This is a single-frame visual creative — NOT a video. Do NOT use timestamps anywhere.

---

## 🎣 HOOK ANALYSIS
- **Visual impact:** What is the first thing the eye is drawn to?
- **Hook type:** [Bold visual / Typography-led / Color contrast / Product hero / Social proof / Pattern interrupt]
- **Hook strength:** [Weak / Moderate / Strong] — one sentence explaining why
- **Scroll-stop factor:** Would a thumb stop here in a feed? Why or why not?

---

## 👁️ VISUAL HIERARCHY
Describe the eye flow through this ad:
1. **First element** the eye lands on
2. **Second element** the eye moves to
3. **Third element**
4. **Where the eye exits** or gets stuck
- Is the hierarchy intentional and effective?
- What visual element is competing with the CTA?

---

## 📝 VISUAL COPY INVENTORY
List every piece of text visible in this ad in reading order.
No timestamps. Format as a bulleted list.
Label each: [Headline], [Subhead], [Body], [CTA], [Brand], [Legal], [Tagline]
- [Headline] "..."
- [Body] "..."
- [CTA] "..."

---

## 📢 MESSAGING STRUCTURE
- **Format:** [Product showcase / Comparison / Testimonial / Offer-driven / Lifestyle / Educational / Other]
- **Core claim:** The single biggest promise this ad makes
- **Proof points:** Evidence or credibility signals used
- **CTA:** Exact CTA text and placement (if no CTA exists, flag this as a problem)

---

## 😮 EMOTIONAL IMPACT
- **Primary emotion evoked:** [Curiosity / Trust / Urgency / FOMO / Aspiration / Relief / Other]
- **Tone:** [Professional / Playful / Urgent / Minimal / Bold / Other]
- **Does the emotion match the CTA?** Yes/No — one sentence explaining

---

## 🧠 CREATIVE VERDICT
IMPORTANT: Do not mention the user's role, niche, or platform in the Creative Verdict. Never say "as a designer", "for an agency", "for your YouTube audience" or any similar phrase. Write the verdict as expert analysis of the creative itself only.
Three paragraphs written as a media buyer debriefing a creative team:
1. What this static ad does well visually and in messaging
2. Who the target audience appears to be and whether the design speaks to them
3. One specific, actionable recommendation to improve performance

---

## 📊 QUICK SCORES
All scores must be whole numbers (integers) only. Never use decimals like 7.5. Round to nearest whole number.
Scoring rubric (apply consistently every time):
1-3: Fundamentally broken — missing core elements
4-5: Below average — significant issues
6-7: Average — works but needs improvement
8-9: Strong — minor improvements only
10: Exceptional — rare, near perfect
A 7/10 means the same thing every time.
- Hook Strength: X/10 (visual impact and scroll-stop potential)
- Message Clarity: X/10
- CTA Effectiveness: X/10
- Production Quality: X/10 (design polish, typography, layout)
- Overall Ad Strength: X/10

---

## 🪝 HOOK DETAIL
Evaluate the above-the-fold visual impact. Does it stop the scroll? Score strictly — a generic stock photo with small text is a 2, not a 6.
- Hook Type: [Pattern Interrupt | Curiosity Gap | Bold Claim | Social Proof | Problem-Agitate | Question Hook | None detected]
- Hook Verdict: [Scroll-Stopper | Needs Work | Weak Open]
- First Glance: [one sentence describing the immediate visual impression above the fold]
- Hook Fix: [one sentence actionable fix if Hook Strength < 8, or "None needed" if >= 8]

---

## 🔧 IMPROVEMENTS
List exactly 3-5 specific, actionable suggestions to improve this static creative.
Each suggestion should apply to the STATIC format as-is.
Do NOT suggest adding animation or video as an improvement.
Format as a numbered list.
1. [Specific improvement for the static ad]
2. [Specific improvement for the static ad]
3. [Specific improvement for the static ad]

---

## 🎥 MOTION TEST IDEA
If this static ad could work as a video or motion graphic, describe the concept in one sentence:
MOTION TEST IDEA: [one sentence describing how to adapt this as a short video ad]

---

Do NOT include a budget recommendation section. Budget guidance is handled separately.`;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Scene {
  timestamp: string;   // e.g. "0:00 — 0:05"
  title: string;       // 3-5 words
  visual: string;      // what's happening visually
  working: string;     // what's working
  improve: string;     // what could be improved
}

export interface BudgetRecommendation {
  verdict: "Boost It" | "Test It" | "Fix First";
  platform: string;
  daily: string;
  duration: string;
  reason: string;
}

export interface Hashtags {
  tiktok: string[];
  meta: string[];
  instagram: string[];
}

export type HookType = "Pattern Interrupt" | "Curiosity Gap" | "Bold Claim" | "Social Proof" | "Problem-Agitate" | "Question Hook" | "None detected";
export type HookVerdict = "Scroll-Stopper" | "Needs Work" | "Weak Open";

export interface HookDetail {
  hookType: HookType;
  verdict: HookVerdict;
  firstImpression: string;  // "First 3 Seconds" for video, "First Glance" for static
  hookFix: string | null;   // null if score >= 8
}

export interface AnalysisResult {
  markdown: string;
  scores: {
    hook: number;
    clarity: number;
    cta: number;
    production: number;
    overall: number;
  } | null;
  hookDetail?: HookDetail;
  improvements: string[];
  budget: BudgetRecommendation | null;
  hashtags?: Hashtags;
  scenes?: Scene[];
  thumbnailDataUrl?: string;
  timestamp: Date;
  fileName: string;
}

export type AnalysisStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "complete"
  | "error";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Upload file to Supabase Storage and return a signed URL (bypasses Vercel 4.5MB body limit). */
async function uploadToStorage(file: File): Promise<{ fileUrl: string; storagePath: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop() || "bin";
  const storagePath = `${session.user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(storagePath, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from("uploads")
    .createSignedUrl(storagePath, 3600);
  if (urlError || !signedUrlData?.signedUrl) throw new Error("Failed to create signed URL");

  return { fileUrl: signedUrlData.signedUrl, storagePath };
}

/** Clean up uploaded file from Supabase Storage (best-effort, never throws). */
async function cleanupStorage(storagePath: string): Promise<void> {
  try {
    await supabase.storage.from("uploads").remove([storagePath]);
  } catch { /* best-effort cleanup */ }
}

function parseScores(markdown: string): AnalysisResult["scores"] {
  try {
    const hookMatch = markdown.match(/Hook Strength:\s*(\d+(?:\.\d+)?)\/10/);
    const clarityMatch = markdown.match(/Message Clarity:\s*(\d+(?:\.\d+)?)\/10/);
    const ctaMatch = markdown.match(/CTA Effectiveness:\s*(\d+(?:\.\d+)?)\/10/);
    const productionMatch = markdown.match(/Production Quality:\s*(\d+(?:\.\d+)?)\/10/);
    const overallMatch = markdown.match(/Overall Ad Strength:\s*(\d+(?:\.\d+)?)\/10/);

    if (!hookMatch || !clarityMatch || !ctaMatch || !productionMatch || !overallMatch) {
      return null;
    }

    return {
      hook: Math.round(parseFloat(hookMatch[1])),
      clarity: Math.round(parseFloat(clarityMatch[1])),
      cta: Math.round(parseFloat(ctaMatch[1])),
      production: Math.round(parseFloat(productionMatch[1])),
      overall: Math.round(parseFloat(overallMatch[1])),
    };
  } catch {
    return null;
  }
}

const VALID_HOOK_TYPES: HookType[] = ["Pattern Interrupt", "Curiosity Gap", "Bold Claim", "Social Proof", "Problem-Agitate", "Question Hook", "None detected"];
const VALID_HOOK_VERDICTS: HookVerdict[] = ["Scroll-Stopper", "Needs Work", "Weak Open"];

export function parseHookDetail(markdown: string): HookDetail | undefined {
  try {
    const typeMatch = markdown.match(/Hook Type:\s*\[?([^\]\n]+)\]?/);
    const verdictMatch = markdown.match(/Hook Verdict:\s*\[?([^\]\n]+)\]?/);
    const impressionMatch = markdown.match(/(?:First 3 Seconds|First Glance):\s*\[?([^\]\n]+)\]?/);
    const fixMatch = markdown.match(/Hook Fix:\s*\[?([^\]\n]+)\]?/);

    if (!typeMatch || !verdictMatch || !impressionMatch) return undefined;

    const rawType = typeMatch[1].trim();
    const rawVerdict = verdictMatch[1].trim();
    const hookType = VALID_HOOK_TYPES.find(t => rawType.includes(t)) ?? "None detected";
    const verdict = VALID_HOOK_VERDICTS.find(v => rawVerdict.includes(v)) ?? "Needs Work";
    const fixText = fixMatch?.[1]?.trim() ?? null;

    return {
      hookType,
      verdict,
      firstImpression: impressionMatch[1].trim(),
      hookFix: fixText === "None needed" ? null : fixText,
    };
  } catch {
    return undefined;
  }
}

export function parseImprovements(markdown: string): string[] {
  try {
    // Find the IMPROVEMENTS section
    const match = markdown.match(/##\s*(?:🔧\s*)?IMPROVEMENTS\s*\n([\s\S]*?)(?=\n---|\n##|$)/i);
    if (!match) return [];

    const section = match[1].trim();
    // Extract numbered items, strip numbering
    return section
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch {
    return [];
  }
}

export function parseBudget(markdown: string): BudgetRecommendation | null {
  try {
    const match = markdown.match(/##\s*(?:💰\s*)?BUDGET RECOMMENDATION\s*\n([\s\S]*?)(?=\n---|\n##|$)/i);
    if (!match) return null;

    const section = match[1].trim();

    const verdictMatch = section.match(/\*\*Verdict:\*\*\s*(Boost It|Test It|Fix First)/i);
    const platformMatch = section.match(/\*\*Platform:\*\*\s*(.+)/i);
    const dailyMatch = section.match(/\*\*Daily Budget:\*\*\s*(.+)/i);
    const durationMatch = section.match(/\*\*Duration:\*\*\s*(.+)/i);
    const reasonMatch = section.match(/\*\*Reason:\*\*\s*(.+)/i);

    if (!verdictMatch) return null;

    // Normalize verdict to exact type
    const rawVerdict = verdictMatch[1].trim();
    let verdict: BudgetRecommendation["verdict"] = "Test It";
    if (/boost it/i.test(rawVerdict)) verdict = "Boost It";
    else if (/fix first/i.test(rawVerdict)) verdict = "Fix First";

    return {
      verdict,
      platform: platformMatch ? platformMatch[1].replace(/\s*—.*$/, "").trim() : "Meta",
      daily: dailyMatch ? dailyMatch[1].replace(/\s*—.*$/, "").trim() : "$20–$50/day",
      duration: durationMatch ? durationMatch[1].replace(/\s*—.*$/, "").trim() : "7 days",
      reason: reasonMatch ? reasonMatch[1].trim() : "",
    };
  } catch {
    return null;
  }
}

export function parseHashtags(markdown: string): Hashtags | undefined {
  try {
    const match = markdown.match(/##\s*(?:#️⃣\s*)?HASHTAGS\s*\n([\s\S]*?)(?=\n---|\n##|$)/i);
    if (!match) return undefined;

    const section = match[1].trim();

    const extract = (platform: string): string[] => {
      const re = new RegExp(`${platform}:\\s*(.+)`, "i");
      const m = section.match(re);
      if (!m) return [];
      return m[1]
        .trim()
        .split(/\s+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter((t) => t.length > 0);
    };

    const tiktok = extract("TIKTOK");
    const meta = extract("META");
    const instagram = extract("INSTAGRAM");

    if (tiktok.length === 0 && meta.length === 0 && instagram.length === 0) return undefined;

    return { tiktok, meta, instagram };
  } catch {
    return undefined;
  }
}

export function parseScenes(markdown: string): Scene[] | undefined {
  try {
    // Look for a fenced ```json block containing a "scenes" array
    const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)```/i);
    if (!jsonBlockMatch) return undefined;
    const parsed = JSON.parse(jsonBlockMatch[1].trim());
    const scenes = parsed?.scenes;
    if (!Array.isArray(scenes) || scenes.length === 0) return undefined;
    return scenes as Scene[];
  } catch {
    return undefined;
  }
}

// Recalculate overall score when Gemini returns zero values
// If overall is 0 or any metric is 0, recompute overall as the
// average of only the non-zero component scores.
export function recalculateOverallScore(
  scores: AnalysisResult["scores"]
): AnalysisResult["scores"] {
  if (!scores) return scores;

  const { hook, clarity, cta, production, overall } = scores;
  const metrics = [hook, clarity, cta, production];
  const hasZeroMetric = metrics.some((v) => v === 0);

  if (overall === 0 || hasZeroMetric) {
    const nonZero = metrics.filter((v) => v > 0);
    if (nonZero.length > 0) {
      const avg = nonZero.reduce((sum, v) => sum + v, 0) / nonZero.length;
      const rounded = Math.round(avg);
      return {
        ...scores,
        overall: rounded,
      };
    }
  }

  return scores;
}

// ─── MAIN ANALYZER ────────────────────────────────────────────────────────────

export async function analyzeVideo(
  file: File,
  _apiKey: string,
  onStatusChange?: (status: AnalysisStatus, message?: string) => void,
  contextPrefix?: string,
  userContext?: string,
  sessionMemory?: string
): Promise<AnalysisResult> {
  const emit = (status: AnalysisStatus, message?: string) => {
    onStatusChange?.(status, message);
  };

  let storagePath: string | undefined;

  try {
    // 1. Upload file to Supabase Storage (bypasses Vercel 4.5MB body limit)
    emit("uploading", "Uploading file...");
    const uploaded = await uploadToStorage(file);
    storagePath = uploaded.storagePath;

    // 2. Build prompt — format-aware
    const isImage = file.type.startsWith("image/");
    emit("processing", isImage ? "Analyzing your static creative..." : "Analyzing your creative...");

    const basePrompt = isImage ? STATIC_ANALYSIS_PROMPT : ANALYSIS_PROMPT;
    const parts: string[] = [];
    if (contextPrefix) parts.push(contextPrefix);
    if (userContext) parts.push(userContext);
    parts.push(basePrompt);
    const prompt = parts.join('\n\n');

    // 3. Call server-side Gemini proxy with file URL (not base64)
    const markdown = await callGeminiProxy({
      fileUrl: uploaded.fileUrl,
      mimeType: file.type,
      prompt,
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: MAX_TOKENS,
      temperature: 0.1,
      topP: 0.8,
      topK: 40,
    });

    // 5. Parse scores from markdown and normalize overall score
    const parsedScores = parseScores(markdown);
    if (!parsedScores) {
      throw new Error("Could not parse scores from the AI response. The output format may have changed — try again.");
    }
    const scores = recalculateOverallScore(parsedScores);

    // 6. Parse improvements from markdown
    let improvements = parseImprovements(markdown);

    // 6b. Enhance improvements with Claude (silent fallback to Gemini)
    try {
      const enhanced = await claudeImprovements(markdown, scores, userContext, undefined, sessionMemory);
      if (enhanced.length > 0) improvements = enhanced;
    } catch { /* silent fallback — keep Gemini improvements */ }

    // 7. Parse budget recommendation from markdown
    const budget = parseBudget(markdown);

    // 8. Parse hashtag recommendations from markdown
    const hashtags = parseHashtags(markdown);

    // 9. Parse scene-by-scene breakdown from markdown (graceful — never throws)
    const scenes = parseScenes(markdown);

    // 10. Parse hook detail from markdown (graceful — never throws)
    const hookDetail = parseHookDetail(markdown);

    emit("complete");

    // Increment usage counter (fire-and-forget — never blocks result)
    incrementAnalysisCount().catch(() => {});

    // Clean up the uploaded file from storage
    if (storagePath) cleanupStorage(storagePath);

    return {
      markdown,
      scores,
      hookDetail,
      improvements,
      budget,
      hashtags,
      scenes,
      timestamp: new Date(),
      fileName: file.name,
    };
  } catch (err) {
    // Clean up on failure too
    if (storagePath) cleanupStorage(storagePath);
    emit("error");
    if (err instanceof Error) {
      throw new Error(`Analysis failed: ${err.message}`);
    }
    throw new Error("Analysis failed: Unknown error");
  }
}

// ─── EXPORT HELPERS ───────────────────────────────────────────────────────────

export function downloadMarkdown(result: AnalysisResult): void {
  const filename = result.fileName.replace(/\.[^/.]+$/, "") + "_analysis.md";
  const header = `# Creative Analysis: ${result.fileName}\nAnalyzed: ${result.timestamp.toLocaleString()}\n\n---\n\n`;
  const blob = new Blob([header + result.markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

// ─── COMPARE ──────────────────────────────────────────────────────────────────

export async function compareAnalyses(
  markdownA: string,
  markdownB: string,
  _apiKey: string,
  platform?: string,
  niche?: string,
  scoresA?: { hook: number; clarity: number; cta: number; production: number; overall: number } | null,
  scoresB?: { hook: number; clarity: number; cta: number; production: number; overall: number } | null,
  intent?: string,
): Promise<string> {
  const platformLabel = platform && platform !== "all" ? platform : "paid social";
  const nicheLabel = niche || "performance marketing";
  const intentLabel = intent || "conversion";

  // Identify which dimensions differ most
  let dimensionComparison = "";
  if (scoresA && scoresB) {
    const dims = ["hook", "clarity", "cta", "production"] as const;
    const diffs = dims.map(d => ({
      dim: d,
      a: scoresA[d],
      b: scoresB[d],
      diff: scoresA[d] - scoresB[d],
    })).sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));

    dimensionComparison = `\nSCORE COMPARISON:
Ad A: Overall ${scoresA.overall}/10 — Hook ${scoresA.hook}/10, Clarity ${scoresA.clarity}/10, CTA ${scoresA.cta}/10, Production ${scoresA.production}/10
Ad B: Overall ${scoresB.overall}/10 — Hook ${scoresB.hook}/10, Clarity ${scoresB.clarity}/10, CTA ${scoresB.cta}/10, Production ${scoresB.production}/10
Biggest gaps: ${diffs.slice(0, 2).map(d => `${d.dim} (${d.a} vs ${d.b}, diff ${d.diff > 0 ? "+" : ""}${d.diff})`).join(", ")}`;
  }

  const intentContext = intentLabel === "awareness"
    ? "The user's goal is brand awareness — weight hook strength and memorability higher than CTA conversion."
    : intentLabel === "consideration"
    ? "The user's goal is engagement/CTR — weight hook and clarity higher than production polish."
    : "The user's goal is direct response conversion — weight CTA strength and clarity highest.";

  const prompt = `You are a senior ${nicheLabel} creative strategist on ${platformLabel}. You're comparing two ad creatives head-to-head for a ${nicheLabel} brand.

${intentContext}
${dimensionComparison}

Anchor every comparison to what matters for ${nicheLabel} on ${platformLabel}. Don't just say "Ad A has a stronger hook" — say "Ad A's hook (${scoresA?.hook ?? "?"}  vs ${scoresB?.hook ?? "?"}) uses [specific pattern] which outperforms on ${platformLabel} for ${nicheLabel} because [reason]."

Format your response exactly as:

## VERDICT
State clearly which ad wins for ${intentLabel} on ${platformLabel} and why in 2–3 sentences. Reference specific scores and ${nicheLabel} audience behavior.

## KEY DIFFERENCES
- [3–5 bullet points comparing head-to-head, each referencing specific scores and explaining why the difference matters for ${nicheLabel} on ${platformLabel}]

## RECOMMENDATION FOR AD A
One specific, actionable recommendation to improve Ad A's weakest dimension for ${nicheLabel} ${intentLabel} on ${platformLabel}.${scoresA ? ` Weakest area: ${Object.entries(scoresA).filter(([k]) => ["hook", "clarity", "cta", "production"].includes(k)).sort(([, a], [, b]) => a - b)[0]?.[0] ?? "unknown"}.` : ""}

## RECOMMENDATION FOR AD B
One specific, actionable recommendation to improve Ad B's weakest dimension for ${nicheLabel} ${intentLabel} on ${platformLabel}.${scoresB ? ` Weakest area: ${Object.entries(scoresB).filter(([k]) => ["hook", "clarity", "cta", "production"].includes(k)).sort(([, a], [, b]) => a - b)[0]?.[0] ?? "unknown"}.` : ""}

---

## AD A ANALYSIS
${markdownA}

---

## AD B ANALYSIS
${markdownB}`;

  return callGeminiProxy({
    prompt,
    systemInstruction: `You are a senior creative strategist specializing in ${nicheLabel} advertising on ${platformLabel}. Your comparisons are calibrated to ${platformLabel} benchmarks for ${nicheLabel}. Every insight must reference specific scores. Never give generic advice that could apply to any two ads.`,
    maxOutputTokens: 2048,
    temperature: 0.4,
  });
}

// ─── GENERATE BRIEF ───────────────────────────────────────────────────────────

export async function generateBrief(
  analysisMarkdown: string,
  _apiKey: string,
  platform?: string,
  niche?: string,
  scores?: { hook: number; clarity: number; cta: number; production: number; overall: number } | null,
  intent?: string,
): Promise<string> {
  const nicheLabel = niche || "performance marketing";
  const platformLabel = platform || "paid social";
  const intentLabel = intent || "conversion";

  const weakDims = scores
    ? Object.entries(scores)
        .filter(([k]) => ["hook", "clarity", "cta", "production"].includes(k))
        .sort(([, a], [, b]) => a - b)
        .slice(0, 2)
        .map(([k, v]) => `${k} (${v}/10)`)
    : [];

  const intentObjective = intentLabel === "awareness"
    ? "maximize brand recall and reach"
    : intentLabel === "consideration"
    ? "drive engagement and click-through rate"
    : "maximize direct response conversion and ROAS";

  const prompt = `You are writing a creative brief for the next iteration of a ${nicheLabel} ad on ${platformLabel}. The current ad scored ${scores?.overall ?? "?"}/10 overall. The user's goal is ${intentLabel} (${intentObjective}).

${weakDims.length ? `CRITICAL WEAKNESSES TO FIX (these are the #1 priority):\n${weakDims.map(d => `→ ${d}`).join("\n")}\nEvery section of this brief must address at least one of these weaknesses.\n` : ""}
${scores ? `CURRENT SCORES: Hook ${scores.hook}/10 | Clarity ${scores.clarity}/10 | CTA ${scores.cta}/10 | Production ${scores.production}/10 | Overall ${scores.overall}/10` : ""}

Structure the brief exactly like this:

## Creative Brief

**Objective:** One sentence — what this ${nicheLabel} ad must achieve on ${platformLabel} for ${intentLabel}. Current score: ${scores?.overall ?? "?"}/10. Target: ${Math.min(10, (scores?.overall ?? 5) + 2)}/10.

**Target Audience:** Who this ${nicheLabel} ad is for on ${platformLabel}. What ${nicheLabel} buyers care about. What pain point drives ${intentLabel} action.

**Hook Direction:** 2-3 hook concepts optimized for ${platformLabel} ${nicheLabel} audiences with the first 3 seconds described for each.${weakDims.some(d => d.includes("hook")) ? ` PRIORITY FIX: Current hook scored ${scores?.hook ?? "?"}/10 — these hooks must be dramatically stronger. Reference what specifically failed in the current hook.` : ""}

**Format:** [UGC / Talking head / Lifestyle / Animation / Other] — why this format fits ${nicheLabel} audiences on ${platformLabel} for ${intentLabel}.

**Key Message:** The single most important thing a ${nicheLabel} buyer on ${platformLabel} should feel or understand to take ${intentLabel} action.

**Proof Points:** Specific evidence or credibility that resonates with ${nicheLabel} audiences — not generic social proof.

**CTA:** Exact CTA copy + placement following ${platformLabel} best practices for ${nicheLabel} ${intentLabel}.${weakDims.some(d => d.includes("cta")) ? ` PRIORITY FIX: Current CTA scored ${scores?.cta ?? "?"}/10 — make this dramatically more compelling for ${nicheLabel} ${intentLabel}.` : ""}

**Do:** 3 things the creative must include — each one addresses a specific weakness from the scorecard.
**Don't:** 3 things to avoid — each one references a specific mistake from the current ad.

Every line must be specific to ${nicheLabel} on ${platformLabel}. If a line could apply to any product in any niche, rewrite it.

---

## AD ANALYSIS
${analysisMarkdown}`;

  return callGeminiProxy({
    prompt,
    systemInstruction: `You are a senior creative strategist specializing in ${nicheLabel} advertising on ${platformLabel}. You write tight, actionable creative briefs for ${intentLabel} campaigns. Your briefs target the ad's specific weaknesses${weakDims.length ? ` (${weakDims.join(", ")})` : ""} — not generic improvement templates. Every recommendation must be executable by a creative team working on ${nicheLabel} ads.`,
    maxOutputTokens: 2048,
    temperature: 0.6,
  });
}

// ─── BATCH VERDICT ────────────────────────────────────────────────────────────

export interface BatchVerdictInput {
  fileName: string;
  scores: AnalysisResult["scores"];
}

export async function generateBatchVerdict(
  items: BatchVerdictInput[],
  _apiKey: string
): Promise<string> {
  if (items.length === 0) return "";

  const lines = items.map((item) => {
    const s = item.scores;
    if (!s) return `${item.fileName}: No scores`;
    return `${item.fileName}: Hook ${s.hook}/10, Clarity ${s.clarity}/10, CTA ${s.cta}/10, Production ${s.production}/10, Overall ${s.overall}/10`;
  });

  const prompt = `You have analyzed several video ads. Here are their filenames and overall scores (Hook, Message Clarity, CTA Effectiveness, Production Quality, Overall Ad Strength):

${lines.join("\n")}

Rank these ads from strongest to weakest and give a one sentence reason for each ranking. Write one paragraph: start with the strongest ad (filename + one sentence why), then the next, and so on until the weakest. Be direct and specific.`;

  return callGeminiProxy({
    prompt,
    systemInstruction: "You are a performance marketing creative analyst. You rank video ads from strongest to weakest and give one sentence per ad.",
    maxOutputTokens: 2048,
    temperature: 0.4,
  });
}
