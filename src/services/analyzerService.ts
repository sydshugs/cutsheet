// analyzerService.ts
// Drop this into src/services/analyzerService.ts

import { generateImprovements as claudeImprovements } from "./claudeService";
import { supabase } from "../lib/supabase";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const MAX_TOKENS = 8192;

// ─── SERVER-SIDE GEMINI PROXY ────────────────────────────────────────────────

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return session.access_token;
}

async function callGeminiProxy(params: {
  base64Data: string;
  mimeType: string;
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

  try {
    // 1. Convert file to base64
    emit("uploading", "Reading video file...");
    const base64Data = await fileToBase64(file);

    // 2. Build prompt — format-aware
    const isImage = file.type.startsWith("image/");
    emit("processing", isImage ? "Analyzing your static creative..." : "Analyzing your creative...");

    const basePrompt = isImage ? STATIC_ANALYSIS_PROMPT : ANALYSIS_PROMPT;
    const parts: string[] = [];
    if (contextPrefix) parts.push(contextPrefix);
    if (userContext) parts.push(userContext);
    parts.push(basePrompt);
    const prompt = parts.join('\n\n');

    // 3. Call server-side Gemini proxy (key never leaves the server)
    const markdown = await callGeminiProxy({
      base64Data,
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

    emit("complete");

    return {
      markdown,
      scores,
      improvements,
      budget,
      hashtags,
      scenes,
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
  _apiKey: string
): Promise<string> {
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

  // Text-only call — no media, just prompt
  return callGeminiProxy({ prompt, maxOutputTokens: 2048, temperature: 0.4 });
}

// ─── GENERATE BRIEF ───────────────────────────────────────────────────────────

export async function generateBrief(
  analysisMarkdown: string,
  _apiKey: string
): Promise<string> {
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

  return callGeminiProxy({
    prompt,
    systemInstruction: "You are a senior creative strategist. You write tight, actionable creative briefs that creative teams can execute immediately.",
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
