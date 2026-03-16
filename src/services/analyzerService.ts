// analyzerService.ts
// Drop this into src/services/analyzerService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateImprovements as claudeImprovements } from "./claudeService";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const MODEL = "gemini-2.5-flash"; // updated from deprecated 2.0 models
const MAX_TOKENS = 8192;

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
Three paragraphs written as a media buyer debriefing a creative team:
1. What this ad does well and why it likely works (or doesn't)
2. Who the target audience appears to be and whether the messaging matches them
3. One specific, actionable recommendation to improve performance

---

## 📊 QUICK SCORES
- Hook Strength: X/10
- Message Clarity: X/10
- CTA Effectiveness: X/10
- Production Quality: X/10
- Overall Ad Strength: X/10

---

## 🔧 IMPROVEMENTS
After your analysis, list exactly 3-5 specific, actionable suggestions to improve this creative. Each suggestion should be one sentence, direct, and specific to what you observed in this creative. Format as a numbered list.
1. [Specific improvement based on what you observed]
2. [Specific improvement based on what you observed]
3. [Specific improvement based on what you observed]

---

## 💰 BUDGET RECOMMENDATION
Based on the ad's quality and likely performance, recommend a media buying strategy. Use this exact format:
- **Verdict:** [Boost It / Test It / Fix First] — "Boost It" means the ad is strong enough to scale spend immediately, "Test It" means it has potential but should be tested with a small budget first, "Fix First" means the creative needs improvement before any spend.
- **Platform:** [Meta / TikTok / YouTube / Meta + TikTok / All platforms] — the best-fit platform(s) for this creative style and audience.
- **Daily Budget:** [$X–$Y/day] — a specific daily budget range recommendation (e.g. "$50–$100/day").
- **Duration:** [X days / X weeks] — how long to run at this budget before evaluating (e.g. "7 days", "2 weeks").
- **Reason:** One sentence explaining why this budget and timeline make sense for this specific creative.

---

## #️⃣ HASHTAGS
Recommend platform-specific hashtags based on the creative content, theme, and audience. Format exactly as:
TIKTOK: #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
META: #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
INSTAGRAM: #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5

Rules:
- TikTok: trending, short, broad discovery tags (5 tags)
- Meta: interest and demographic targeting tags (5 tags)
- Instagram: niche community + aesthetic tags (5 tags)
- All tags should be relevant to the actual creative content analyzed
- No generic filler tags like #fyp #viral unless genuinely appropriate`;

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

export interface AnalysisResult {
  markdown: string;
  scores: {
    hook: number;
    clarity: number;
    cta: number;
    production: number;
    overall: number;
  } | null;
  improvements: string[];
  budget: BudgetRecommendation | null;
  hashtags?: Hashtags;
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:video/mp4;base64,
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
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
  apiKey: string,
  onStatusChange?: (status: AnalysisStatus, message?: string) => void
): Promise<AnalysisResult> {
  const emit = (status: AnalysisStatus, message?: string) => {
    onStatusChange?.(status, message);
  };

  try {
    // 1. Init client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        temperature: 0.4, // low temp = consistent structured output
      },
    });

    // 2. Convert file to base64
    emit("uploading", "Reading video file...");
    const base64Data = await fileToBase64(file);

    // 3. Build request with inline data — format-aware prompt
    const isImage = file.type.startsWith("image/");
    emit("processing", isImage ? "Gemini is analyzing your static creative..." : "Gemini is analyzing your creative...");

    const staticPrefix = `This is a STATIC AD CREATIVE (image). Analyze it as a static advertisement. For Hook Strength, assess the visual impact and scroll-stop potential of the static image. For Pacing & Retention, assess visual hierarchy and how the eye moves through the composition instead. All other metrics apply as normal.\n\n`;
    const prompt = isImage ? staticPrefix + ANALYSIS_PROMPT : ANALYSIS_PROMPT;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type as string,
          data: base64Data,
        },
      },
      {
        text: prompt,
      },
    ]);

    // 4. Extract response
    const response = result.response;
    const markdown = response.text();

    if (!markdown || markdown.trim().length === 0) {
      throw new Error("Gemini returned an empty response. Try again.");
    }

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
      const enhanced = await claudeImprovements(markdown, scores);
      if (enhanced.length > 0) improvements = enhanced;
    } catch { /* silent fallback — keep Gemini improvements */ }

    // 7. Parse budget recommendation from markdown
    const budget = parseBudget(markdown);

    // 8. Parse hashtag recommendations from markdown
    const hashtags = parseHashtags(markdown);

    emit("complete");

    return {
      markdown,
      scores,
      improvements,
      budget,
      hashtags,
      timestamp: new Date(),
      fileName: file.name,
    };
  } catch (err) {
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
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
  });

  const prompt = `You are a performance marketing creative analyst. Two video ad analyses are provided below.

Given these two ad analyses, which creative is stronger and why? Be direct. Give a verdict, key differences, and one recommendation for each.

Format your response exactly as:

## VERDICT
State clearly which ad is stronger and why in 2–3 sentences.

## KEY DIFFERENCES
- [3–5 bullet points comparing the two ads head to head]

## RECOMMENDATION FOR AD A
One specific, actionable recommendation.

## RECOMMENDATION FOR AD B
One specific, actionable recommendation.

---

## AD A ANALYSIS
${markdownA}

---

## AD B ANALYSIS
${markdownB}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ─── GENERATE BRIEF ───────────────────────────────────────────────────────────

export async function generateBrief(
  analysisMarkdown: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction:
      "You are a senior creative strategist. You write tight, actionable creative briefs that creative teams can execute immediately.",
    generationConfig: { maxOutputTokens: 2048, temperature: 0.6 },
  });

  const prompt = `Based on this video ad analysis, write a creative brief for the next iteration of this ad. Structure it exactly like this:

## Creative Brief

**Objective:** One sentence on what this ad should achieve.

**Target Audience:** Who this is for, what they care about, what their pain point is.

**Hook Direction:** 2-3 hook concepts with the first 3 seconds described for each.

**Format:** [UGC / Talking head / Lifestyle / Animation / Other] — and why this format fits the audience.

**Key Message:** The single most important thing the viewer should feel or understand.

**Proof Points:** What evidence or credibility to include.

**CTA:** Exact CTA copy + placement recommendation.

**Do:** 3 things the creative must include or achieve.
**Don't:** 3 things to avoid based on weaknesses in the current ad.

Be specific. No generic advice. Every line should be actionable.

---

## AD ANALYSIS
${analysisMarkdown}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ─── BATCH VERDICT ────────────────────────────────────────────────────────────

export interface BatchVerdictInput {
  fileName: string;
  scores: AnalysisResult["scores"];
}

export async function generateBatchVerdict(
  items: BatchVerdictInput[],
  apiKey: string
): Promise<string> {
  if (items.length === 0) return "";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction:
      "You are a performance marketing creative analyst. You rank video ads from strongest to weakest and give one sentence per ad.",
    generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
  });

  const lines = items.map((item) => {
    const s = item.scores;
    if (!s) return `${item.fileName}: No scores`;
    return `${item.fileName}: Hook ${s.hook}/10, Clarity ${s.clarity}/10, CTA ${s.cta}/10, Production ${s.production}/10, Overall ${s.overall}/10`;
  });

  const prompt = `You have analyzed several video ads. Here are their filenames and overall scores (Hook, Message Clarity, CTA Effectiveness, Production Quality, Overall Ad Strength):

${lines.join("\n")}

Rank these ads from strongest to weakest and give a one sentence reason for each ranking. Write one paragraph: start with the strongest ad (filename + one sentence why), then the next, and so on until the weakest. Be direct and specific.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
