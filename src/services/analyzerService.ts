// analyzerService.ts
// Drop this into src/services/analyzerService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

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
- Overall Ad Strength: X/10`;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  markdown: string;
  scores: {
    hook: number;
    clarity: number;
    cta: number;
    production: number;
    overall: number;
  } | null;
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
    const hookMatch = markdown.match(/Hook Strength:\s*(\d+)\/10/);
    const clarityMatch = markdown.match(/Message Clarity:\s*(\d+)\/10/);
    const ctaMatch = markdown.match(/CTA Effectiveness:\s*(\d+)\/10/);
    const productionMatch = markdown.match(/Production Quality:\s*(\d+)\/10/);
    const overallMatch = markdown.match(/Overall Ad Strength:\s*(\d+)\/10/);

    if (!hookMatch || !clarityMatch || !ctaMatch || !productionMatch || !overallMatch) {
      return null;
    }

    return {
      hook: parseInt(hookMatch[1]),
      clarity: parseInt(clarityMatch[1]),
      cta: parseInt(ctaMatch[1]),
      production: parseInt(productionMatch[1]),
      overall: parseInt(overallMatch[1]),
    };
  } catch {
    return null;
  }
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

    // 3. Build request with inline video data
    emit("processing", "Gemini is analyzing your creative...");
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type as "video/mp4" | "video/webm" | "video/quicktime",
          data: base64Data,
        },
      },
      {
        text: ANALYSIS_PROMPT,
      },
    ]);

    // 4. Extract response
    const response = result.response;
    const markdown = response.text();

    if (!markdown || markdown.trim().length === 0) {
      throw new Error("Gemini returned an empty response. Try again.");
    }

    // 5. Parse scores from markdown
    const scores = parseScores(markdown);

    emit("complete");

    return {
      markdown,
      scores,
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
