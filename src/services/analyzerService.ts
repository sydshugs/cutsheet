// analyzerService.ts
// Drop this into src/services/analyzerService.ts

import { generateImprovements as claudeImprovements } from "./claudeService";
import { supabase } from "../lib/supabase";
import { incrementAnalysisCount } from "./usageService";
import { inferUploadMimeType } from "../utils/uploadFileValidation";
import { validateScores } from "../utils/scoreGuardrails";

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
    const ct = response.headers.get("content-type") ?? "";
    if (response.status === 404 || ct.includes("text/html")) {
      throw new Error(
        "Analyze API is not reachable (404). Plain Vite does not run /api routes. Add DEV_API_PROXY_TARGET to .env or .env.local (e.g. https://cutsheet.xyz — same Supabase as VITE_SUPABASE_URL), restart dev, or run pnpm run dev:vercel from the repo root. Vite does not load .env.example.",
      );
    }
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { message?: string; error?: string }).message ?? (data as { error?: string }).error ?? `API error ${response.status}`);
  }

  const result = await response.json() as unknown;
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid API response: expected object from /api/analyze');
  }
  const resultObj = result as Record<string, unknown>;
  if (typeof resultObj.text !== 'string') {
    throw new Error('Invalid API response: missing or non-string "text" field from /api/analyze');
  }
  return resultObj.text;
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert performance marketing creative analyst with 10+ years experience buying and producing social creative across Meta, TikTok, and YouTube.

Your job is to analyze creative the way a senior media buyer would — not as a film critic, not as an AI assistant, but as someone whose job is to predict whether creative will perform and why.

Your analysis must be:
- Direct and opinionated. Don't hedge.
- If something is weak, say it's weak and explain why.
- Written like a human expert briefing a creative team, not a robot summarizing content.
- Focused on performance signals: hook strength, message clarity, retention, emotion.

SUBJECT-GROUNDING RULES — DO NOT HALLUCINATE:
Describe only what you can actually see in the creative. Do NOT infer a product, brand, offer, service, or call-to-action unless it is visibly present.

If the creative shows only a lifestyle scene (a person, place, activity, animal, travel moment, etc.) with no visible product, brand logo, or sales message, treat it as brand/lifestyle content:
- State explicitly that no product is visible.
- Do NOT invent a product, category, or offer to score against.
- Do NOT assume the creator is selling something.
- Score Hook, Clarity, and Production on what is actually shown.
- Do not penalize the creative for lacking a CTA when no CTA is intended — acknowledge it as brand/lifestyle content.

If you cannot determine what the creative is advertising with certainty, say so. Do not guess.

SCORING RULES — DETERMINISTIC:
You are a scoring engine. Apply these criteria mechanically and consistently.
For the same input, always produce the same score. Do not vary assessment based on phrasing — score only what is visually and factually present.
Scores must be integers 1–10. No decimals. No ranges. No "around" or "approximately."

EVIDENCE-CITATION RULE:
Before outputting any score, anchor it to a specific observation from the creative. Every score statement must be followed by a brief evidence clause citing what you saw (e.g., "Hook: 6/10 — opening frame is a wide beach shot with no text overlay and no motion in the first 0.5s"). No score without a cited observation. This prevents drift between runs.

Scoring scale:
1–3: Significant problems. Multiple critical issues present.
4–6: Functional but weak. Core elements present but underperforming.
7–8: Solid. Meets platform best practices with minor improvements possible.
9–10: Excellent. Exceeds platform benchmarks. Production-ready.

Return analysis in exact structured markdown format. Do not add commentary before or after the structured output.`;

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
- **CTA:** Exact action requested and timestamp. If no in-creative CTA exists but the platform provides a native CTA button (e.g. Meta's "Shop Now", "Learn More"), note: "Platform CTA: [button text]" — this is not a problem, it's an intentional platform-native approach.

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

## 📋 VERDICT
- State: [not_ready | needs_work | ready] — "not_ready" if fundamental issues present (note: relying on platform-native CTA is NOT a fundamental issue), "needs_work" if 5-7/10, "ready" if 8+/10
- Headline: [one sentence verdict — what this ad does and what's missing, max 15 words]
- Sub: [one sentence explanation — the key issue or strength, max 20 words]

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
- CTA Effectiveness: X/10 (if the creative relies on a platform-native CTA button instead of an in-creative CTA, score the end-frame's ability to drive action INTO that button — visual direction, timing, and clarity of the final moment — not the presence of CTA text in the video itself)
- Production Quality: X/10
- Overall Ad Strength: X/10

Scoring anchors — match each score to ONE anchor. Do NOT average, round, or split the difference. Pick the anchor whose description fits what you observed.

Hook Strength:
- 2: Static shot. No motion, no text, no scroll-stop factor.
- 3: One static element with subtle motion or one small text overlay. Still mostly static and predictable.
- 4: Has motion OR text, but opener is generic ("Check this out" / "Have you ever...") or low-contrast.
- 5: Motion or text overlay but opener is predictable. Moderate scroll-stop, no genuine pattern interrupt.
- 6: Motion AND text, plus one specific attention element (sharp cut, bold claim, unexpected subject). Earns 2–3 seconds.
- 7: Specific pattern interrupt plus clear curiosity gap or bold visual. Earns the next 5 seconds.
- 8: Immediate pattern interrupt — unexpected visual, bold claim, or strong curiosity gap in first frame.
- 9: Exceptional. Platform-native, pattern-interrupt-dense, unique. Viewer cannot scroll past.

Message Clarity:
- 2: Nothing coherent. Viewer leaves with no understanding of what is being advertised.
- 3: Unclear what the product is or does. No value proposition visible.
- 4: Product is identifiable but promise is absent, contradictory, or fully buried.
- 5: Product visible with partial or fragmented value prop that takes most of the ad to land.
- 6: Value prop is present and legible, but requires effort to parse or is cluttered by competing copy.
- 7: Clear value prop but generic — could apply to any competitor in the space.
- 8: Clear, specific value prop with one differentiator stated in under 5 seconds.
- 9: Unforgettable single-sentence promise, reinforced by visuals. Differentiator woven into the hook itself.

CTA Effectiveness:
- 2: No call to action present, or a generic "Learn More" with no urgency.
- 3: CTA appears but is a throwaway line with no visual anchor or reason to act.
- 4: Generic CTA ("Shop Now") buried in the creative — barely visible, no incentive.
- 5: CTA exists but is weak — small text, buried, or generic ("Shop Now" with no incentive).
- 6: Clear CTA with one specific reason to act, but low visual weight or late timing.
- 7: Clear, specific CTA with visual anchor and a reason to click ("Tap the link — free trial ends Friday").
- 8: Clear, urgent, specific CTA with a reason to act now ("Get 30% off — ends tonight").
- 9: CTA is visually dominant, urgent, specific, and matches the emotional peak of the ad.

Production Quality:
- 2: Unusable quality. Distracting compression, lighting, or sound issues.
- 3: Poor lighting, low resolution, awkward framing, amateur look.
- 4: Functional but inconsistent — mixed lighting, shaky camera, rough cuts.
- 5: Clean capture but flat composition, no intentional design.
- 6: Acceptable — lighting and framing are competent but unmemorable.
- 7: Intentional composition, clean lighting, consistent brand style, platform-native feel.
- 8: Professional grade — clean lighting, intentional composition, platform-native style.
- 9: Reference-quality. Every frame is intentional and contributes to the message.

---

## 🪝 HOOK DETAIL
Evaluate ONLY the first 3 seconds. Does it create a pattern interrupt? Does it earn the next 5 seconds of attention? Score strictly — a generic product shot opening is a 2, not a 6.
- Hook Type: [Pattern Interrupt | Curiosity Gap | Bold Claim | Social Proof | Problem-Agitate | Question Hook | None detected]
- Hook Verdict: [Scroll-Stopper | Needs Work | Weak Open]
- First 3 Seconds: [one sentence describing exactly what happens in the first 3 seconds]
- Hook Fix: [one sentence actionable fix if Hook Strength < 8, or "None needed" if >= 8]

---

## 🔧 IMPROVEMENTS
List exactly 3-5 specific, actionable suggestions. Each line MUST start with priority and category tags. Each fix must be a MAXIMUM of 10 words. Punchy and direct. No parenthetical examples. No filler phrases.
1. [HIGH|MEDIUM|LOW] [CTA|VISUAL|HOOK|LAYOUT|TRUST|COPY] — [max 10 word fix]
2. [HIGH|MEDIUM|LOW] [CTA|VISUAL|HOOK|LAYOUT|TRUST|COPY] — [max 10 word fix]
3. [HIGH|MEDIUM|LOW] [CTA|VISUAL|HOOK|LAYOUT|TRUST|COPY] — [max 10 word fix]
BAD: "HIGH CTA — Add a prominent CTA button (e.g. Shop Now) to guide user action"
GOOD: "HIGH CTA — Add a contrasting CTA button below the headline"

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
- Do not add any text between the markdown and the JSON block other than the section header above

---

## #️⃣ HASHTAGS
Provide platform-specific hashtag recommendations. Mix reach levels: 3 mega (1M+ posts), 4 mid-range (100K–1M posts), 5 niche (<100K posts). Format:
TIKTOK: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12
META: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12
INSTAGRAM: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12

---

Do NOT include a budget recommendation section. Budget guidance is handled separately.`;

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

## 📋 VERDICT
- State: [not_ready | needs_work | ready] — "not_ready" if missing CTA or fundamental issues, "needs_work" if 5-7/10, "ready" if 8+/10
- Headline: [one sentence verdict — what this ad does and what's missing, max 15 words]
- Sub: [one sentence explanation — the key issue or strength, max 20 words]

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

Scoring anchors — use these as calibration reference:
- Hook 2/10: Static product shot with no text, no motion, no pattern interrupt. Generic thumbnail.
- Hook 5/10: Has movement or text overlay but hook is predictable. "Check this out" type opener.
- Hook 8/10: Immediate pattern interrupt — unexpected visual, bold claim, or strong curiosity gap in first frame.
- CTA 2/10: No call to action present, or a generic "Learn More" with no urgency.
- CTA 5/10: CTA exists but is weak — small text, buried, or generic ("Shop Now" with no incentive).
- CTA 8/10: Clear, urgent, specific CTA with a reason to act now ("Get 30% off — ends tonight").
- Message 3/10: Unclear what the product is or does. No value proposition visible.
- Message 7/10: Clear value prop but generic — could apply to any competitor in the space.
- Production 3/10: Poor lighting, low resolution, awkward framing, amateur look.
- Production 8/10: Professional grade — clean lighting, intentional composition, platform-native style.

---

## 🪝 HOOK DETAIL
Evaluate the above-the-fold visual impact. Does it stop the scroll? Score strictly — a generic stock photo with small text is a 2, not a 6.
- Hook Type: [Pattern Interrupt | Curiosity Gap | Bold Claim | Social Proof | Problem-Agitate | Question Hook | None detected]
- Hook Verdict: [Scroll-Stopper | Needs Work | Weak Open]
- First Glance: [one sentence describing the immediate visual impression above the fold]
- Hook Fix: [one sentence actionable fix if Hook Strength < 8, or "None needed" if >= 8]

---

## 🔧 IMPROVEMENTS
List exactly 3-5 specific, actionable suggestions for this static creative.
Each suggestion should apply to the STATIC format as-is. Do NOT suggest adding animation or video.
Each line MUST start with priority and category tags. Each fix must be a MAXIMUM of 10 words. Punchy and direct. No parenthetical examples. No filler phrases.
1. [HIGH|MEDIUM|LOW] [CTA|VISUAL|HOOK|LAYOUT|TRUST|COPY] — [max 10 word fix]
2. [HIGH|MEDIUM|LOW] [CTA|VISUAL|HOOK|LAYOUT|TRUST|COPY] — [max 10 word fix]
3. [HIGH|MEDIUM|LOW] [CTA|VISUAL|HOOK|LAYOUT|TRUST|COPY] — [max 10 word fix]
BAD: "HIGH CTA — Add a prominent CTA button (e.g. Shop Now) to guide user action"
GOOD: "HIGH CTA — Add a contrasting CTA button below the headline"

---

## 🎥 MOTION TEST IDEA
If this static ad could work as a video or motion graphic, describe the concept in one sentence.
Focus ONLY on visual motion: product reveals, text animations, parallax, zoom transitions, brand element movement.
Do NOT reference CTA buttons, Shop Now text, urgency copy, discount overlays, or any conversion mechanics — those belong to the ad platform, not the creative.
MOTION TEST IDEA: [one sentence describing how to adapt this as a short video ad — visual motion only, no CTA or urgency elements]

---

## #️⃣ HASHTAGS
Provide platform-specific hashtag recommendations. Mix reach levels: 3 mega (1M+ posts), 4 mid-range (100K–1M posts), 5 niche (<100K posts). Format:
META: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12
INSTAGRAM: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12

---

Do NOT include a budget recommendation section. Budget guidance is handled separately.`;

// ─── ORGANIC VIDEO ANALYSIS PROMPT ──────────────────────────────────────────

const ORGANIC_ANALYSIS_PROMPT = `Analyze this ORGANIC creator video and return a structured breakdown in this exact format.
This is organic creator content, NOT a paid ad. Score on reach, saves, shares, rewatch — not CTA or conversion.
Do NOT invent a product or brand if none is visible. If this is brand/lifestyle content, score it as brand/lifestyle content.

---

## 🎣 HOOK ANALYSIS (0–3s)
- **Opening frame:** What is the very first visual the viewer sees?
- **Hook type:** [Pattern Interrupt / Curiosity Gap / Bold Claim / Social Proof / Problem-Agitate / Question Hook / None detected]
- **Hook strength:** [Weak / Moderate / Strong] — one sentence explaining why
- **Scroll-stop factor:** Would a thumb stop here on the For You / Reels feed? Why or why not?

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
- **Format:** [Day-in-life / Tutorial / Story / Skit / Vlog / Reaction / POV / Aesthetic / Other]
- **Core idea:** The single biggest idea, moment, or feeling this video delivers
- **Proof points:** Evidence, credibility, or relatability signals (or "None — this is brand/lifestyle content")

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

## 📋 VERDICT
- State: [not_ready | needs_work | ready] — "not_ready" if fundamental content issues present, "needs_work" if 5-7/10, "ready" if 8+/10
- Headline: [one sentence verdict — what this video does and what's missing, max 15 words]
- Sub: [one sentence explanation — the key strength or issue, max 20 words]

---

## 🧠 CREATIVE VERDICT
IMPORTANT: Do not mention the user's role, niche, or platform in the Creative Verdict. Write the verdict as expert analysis of the creative itself only.
Three paragraphs written as a content strategist debriefing a creator:
1. What this video does well and why it likely works organically (or doesn't)
2. Who the target audience appears to be and whether the content matches them
3. One specific, actionable recommendation to improve organic performance — NOT CTA or offer related

If no product or brand is visible, explicitly acknowledge this is brand/lifestyle content and do not penalize the absence of a sales message.

---

## 📊 QUICK SCORES
All scores must be whole numbers (integers) only. Never use decimals like 7.5.
Every score MUST be followed by an evidence clause citing a specific observation (e.g., "Hook Strength: 6/10 — opening is a static beach shot with no on-screen text").
- Hook Strength: X/10 — [evidence]
- Message Clarity: X/10 — [evidence]
- Shareability & Rewatch: X/10 — [evidence] (Would a viewer share, save, or rewatch? Does it trigger algorithm engagement signals?)
- Production Quality: X/10 — [evidence]
- Overall Content Strength: X/10 — [evidence]

Scoring anchors — match each score to ONE anchor.

Hook Strength:
- 2: Static shot. No motion, no text, no audio variation. Zero scroll-stop factor.
- 3: Minimal motion or one text element, but predictable and low-energy.
- 4: Motion plus text, but opener feels generic ("Check this out" / "POV: me doing X").
- 5: Clear but predictable opener. Motion, text, and one attention element but no genuine pattern interrupt.
- 6: One specific pattern interrupt (sharp cut, unexpected subject, bold moment). Earns 2–3 seconds.
- 7: Strong pattern interrupt plus clear curiosity gap or bold visual. Earns the next 5 seconds.
- 8: Immediate scroll-stop. Unexpected visual + audio hook + strong curiosity gap in first 1.5s.
- 9: Exceptional. Platform-native, pattern-interrupt-dense, unique. Viewer cannot scroll past.

Message Clarity:
- 2: Nothing is clear. Viewer leaves with no core idea.
- 3: Idea is buried, fragmented, or contradicted by the visuals.
- 4: Core idea is present but takes most of the video to land.
- 5: Idea is clear but generic — could be any creator in the space.
- 6: Specific, clear core idea, but pacing or cuts slow its delivery.
- 7: Clear, specific idea delivered in under 5 seconds of the video's intent window.
- 8: Crisp single-takeaway, reinforced by visuals and pacing.
- 9: Unforgettable one-line idea; the video is built entirely around delivering it.

Shareability & Rewatch:
- 2: No reason to share, save, or rewatch. Forgettable.
- 3: One mild beat, but no clear share trigger.
- 4: Mildly entertaining or informative, but nothing a viewer would actively send to someone.
- 5: Functional — a niche viewer might save it, but mass share signal is absent.
- 6: One specific share trigger (relatable moment, quotable line, useful tip, oddly satisfying beat).
- 7: Multiple share or save triggers stacked. Strong DM-able quality for a defined audience.
- 8: High rewatch loop (callback, payoff at the end, layered detail). Broad share impulse.
- 9: Viral-grade. Built explicitly around a share, save, or rewatch mechanism viewers cannot resist.

Production Quality:
- 2: Poor lighting, low resolution, awkward framing, distracting audio.
- 3: Functional but inconsistent — mixed lighting, shaky camera, rough audio.
- 4: Clean capture but flat composition, no intentional design.
- 5: Acceptable — lighting and framing are competent but unmemorable.
- 6: Intentional composition, clean lighting, authentic creator style.
- 7: Platform-native aesthetic, consistent style, confident cuts, clean audio.
- 8: Professional-grade creator production — every element is intentional and platform-native.
- 9: Reference-quality organic content. Every frame is intentional and distinctive.

Do NOT invent a product or brand if none is visible. Score only what is shown. If the creative is brand/lifestyle, say so in the evidence clause.

---

## 🪝 HOOK DETAIL
Evaluate ONLY the first 3 seconds. Does it create a pattern interrupt? Does it earn the next 5 seconds of attention? Score strictly — a generic static opening is a 2, not a 6.
- Hook Type: [Pattern Interrupt | Curiosity Gap | Bold Claim | Social Proof | Problem-Agitate | Question Hook | None detected]
- Hook Verdict: [Scroll-Stopper | Needs Work | Weak Open]
- First 3 Seconds: [one sentence describing exactly what happens in the first 3 seconds]
- Hook Fix: [one sentence actionable fix if Hook Strength < 8, or "None needed" if >= 8]

---

## 🔧 IMPROVEMENTS
List exactly 4-6 specific, actionable suggestions for improving ORGANIC performance (reach, saves, shares, rewatch).
Do NOT suggest adding CTAs, product mentions, offers, urgency language, or conversion tactics — this is organic content.
Do NOT suggest mentioning a product that is not visibly in the creative.
Each line MUST start with priority and category tags. Each fix must be a MAXIMUM of 10 words. Punchy and direct. No parenthetical examples. No filler phrases.
1. [HIGH|MEDIUM|LOW] [HOOK|VISUAL|COPY|LAYOUT|TRUST] — [max 10 word fix]
2. [HIGH|MEDIUM|LOW] [HOOK|VISUAL|COPY|LAYOUT|TRUST] — [max 10 word fix]
3. [HIGH|MEDIUM|LOW] [HOOK|VISUAL|COPY|LAYOUT|TRUST] — [max 10 word fix]
BAD: "HIGH HOOK — Add a follow CTA to drive subscribers"
GOOD: "HIGH HOOK — Open on the dog mid-jump, not the empty beach"

---

Do NOT include a budget recommendation section. This is organic content — there is no ad spend.

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
      "improve": "What could be improved (organic lens — reach, saves, rewatch)"
    }
  ]
}
\`\`\`

Rules:
- Include 3–6 scenes that cover the full duration of the creative
- Timestamps use the format "M:SS — M:SS"
- title is 3–5 words, plain text, no punctuation
- visual, working, improve are each one sentence
- Do not add any text between the markdown and the JSON block other than the section header above

---

## #️⃣ HASHTAGS
Provide platform-specific organic hashtag recommendations. Mix reach levels: mega (1M+ posts), mid-range (100K–1M posts), niche (<100K posts). Format (use EXACTLY these labels):
TIKTOK: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10 #tag11 #tag12
INSTAGRAM REELS: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8
YOUTUBE SHORTS: #tag1 #tag2 #tag3 #tag4 #tag5

---

Do NOT include a budget recommendation section. This is organic content — there is no ad spend.`;

// ─── ORGANIC STATIC ANALYSIS PROMPT ─────────────────────────────────────────

const ORGANIC_STATIC_ANALYSIS_PROMPT = `Analyze this ORGANIC creator STATIC post and return a structured breakdown in this exact format.
This is a single-frame organic image — NOT a video, NOT a paid ad. Do NOT use timestamps anywhere.
Score on save-worthiness, shareability, and feed stopping power — not CTA or conversion.
Do NOT invent a product or brand if none is visible. If this is brand/lifestyle content, score it as brand/lifestyle content.

---

## 🎣 HOOK ANALYSIS
- **Visual impact:** What is the first thing the eye is drawn to?
- **Hook type:** [Pattern Interrupt / Curiosity Gap / Bold Claim / Social Proof / Problem-Agitate / Question Hook / None detected]
- **Hook strength:** [Weak / Moderate / Strong] — one sentence explaining why
- **Scroll-stop factor:** Would a thumb stop here on a Feed / Explore / Pinterest Home? Why or why not?

---

## 🎯 FIRST-GLANCE HOOK
- **What the viewer absorbs in 0.5s:** [describe the gestalt — one sentence]
- **Above-the-fold dominant element:** [subject / typography / color block / composition / other]
- **Curiosity or stopping mechanism:** [describe what, if anything, prompts a pause]

---

## 🎨 VISUAL ANALYSIS
- **Composition:** [Rule of thirds / Centered / Diagonal / Symmetrical / Negative space / Other] — one sentence on effectiveness
- **Color & light:** Describe the palette and lighting quality
- **Subject:** What is the subject of the image? If no clear subject, say so.
- **On-image text:** List any visible text verbatim, in reading order (or "None")

---

## 📢 MESSAGING STRUCTURE
- **Format:** [Lifestyle / Educational / Aesthetic / Behind-the-scenes / POV / Quote card / Data viz / Other]
- **Core idea:** The single biggest idea, moment, or feeling this image delivers
- **Proof points:** Evidence, credibility, or relatability signals (or "None — this is brand/lifestyle content")

---

## 😮 EMOTIONAL IMPACT
- **Primary emotion evoked:** [Curiosity / Warmth / Aspiration / Relatability / Nostalgia / Awe / Other]
- **Tone:** [Minimal / Playful / Bold / Intimate / Cinematic / Casual / Other]
- **Does the emotion match the core idea?** Yes/No — one sentence explaining

---

## 📋 VERDICT
- State: [not_ready | needs_work | ready] — "not_ready" if fundamental issues present, "needs_work" if 5-7/10, "ready" if 8+/10
- Headline: [one sentence verdict — what this image does and what's missing, max 15 words]
- Sub: [one sentence explanation — the key strength or issue, max 20 words]

---

## 🧠 CREATIVE VERDICT
IMPORTANT: Do not mention the user's role, niche, or platform in the Creative Verdict. Write the verdict as expert analysis of the creative itself only.
Three paragraphs written as a content strategist debriefing a creator:
1. What this image does well visually and in messaging
2. Who the target audience appears to be and whether the image speaks to them
3. One specific, actionable recommendation to improve organic performance — NOT CTA or offer related

If no product or brand is visible, explicitly acknowledge this is brand/lifestyle content and do not penalize the absence of a sales message.

---

## 📊 QUICK SCORES
All scores must be whole numbers (integers) only. Never use decimals like 7.5.
Every score MUST be followed by an evidence clause citing a specific observation (e.g., "Hook Strength: 7/10 — high-contrast black subject against white negative space grabs the eye immediately").
- Hook Strength: X/10 — [evidence] (visual impact and scroll-stop potential in a feed)
- Message Clarity: X/10 — [evidence]
- Shareability & Save-Worthiness: X/10 — [evidence] (Would someone DM this to a friend? Save it? Pin it?)
- Production Quality: X/10 — [evidence] (design polish, typography, composition)
- Overall Content Strength: X/10 — [evidence]

Scoring anchors — match each score to ONE anchor.

Hook Strength:
- 2: Generic stock-feeling image. No contrast, no distinct subject, no visual tension.
- 3: One visible element but flat composition and muddy color.
- 4: Subject is identifiable but composition and light are weak.
- 5: Acceptable scroll-stop — one clear subject, decent framing, but predictable.
- 6: Clear subject plus one pattern interrupt (color block, unexpected angle, bold crop).
- 7: Strong focal point plus secondary element that rewards a second look.
- 8: Immediate scroll-stop. Distinctive subject + intentional composition + bold color or light.
- 9: Exceptional. Singular, unmistakable image. Cannot be mistaken for anything else in the feed.

Message Clarity:
- 2: Unclear what the image is about.
- 3: Subject guessable but the idea behind the image is absent or contradictory.
- 4: Idea is present but requires reading all on-image text to decipher.
- 5: Idea is clear but generic — could be any creator in the space.
- 6: Specific, clear core idea, but competing elements dilute the delivery.
- 7: Clear, specific idea delivered at first glance.
- 8: Crisp single-takeaway reinforced by both subject and any on-image text.
- 9: Image and idea are inseparable — you understand the idea the instant you see it.

Shareability & Save-Worthiness:
- 2: No reason to save or share. Forgettable.
- 3: One mild point of interest but no clear save or DM trigger.
- 4: Mildly appealing — a niche viewer might save, but no mass share signal.
- 5: Functional. One specific viewer persona would save it.
- 6: One specific trigger — a useful tip, a quotable moment, aspirational visual, or Pinterest-worthy aesthetic.
- 7: Multiple save or share triggers stacked (aesthetic + usefulness, or relatability + quotability).
- 8: High save rate expected — image is reference-worthy, quote-worthy, or visually collectible.
- 9: Viral-grade static. Explicitly built around a save, pin, or share mechanism viewers cannot resist.

Production Quality:
- 2: Poor lighting, low resolution, awkward cropping, amateur composition.
- 3: Functional but inconsistent — lighting or color correction is rough.
- 4: Clean capture but flat composition, no intentional design.
- 5: Acceptable — framing and light are competent but unmemorable.
- 6: Intentional composition, clean lighting, consistent style.
- 7: Platform-native aesthetic, confident composition, polished typography (if any).
- 8: Professional-grade — every element intentional, typography and composition aligned.
- 9: Reference-quality static. Every pixel is intentional and distinctive.

Do NOT invent a product or brand if none is visible. Score only what is shown. If the creative is brand/lifestyle, say so in the evidence clause.

---

## 🪝 HOOK DETAIL
Evaluate the above-the-fold visual impact. Does it stop the scroll? Score strictly — a generic stock photo with small text is a 2, not a 6.
- Hook Type: [Pattern Interrupt | Curiosity Gap | Bold Claim | Social Proof | Problem-Agitate | Question Hook | None detected]
- Hook Verdict: [Scroll-Stopper | Needs Work | Weak Open]
- First Glance: [one sentence describing the immediate visual impression above the fold]
- Hook Fix: [one sentence actionable fix if Hook Strength < 8, or "None needed" if >= 8]

---

## 🔧 IMPROVEMENTS
List exactly 4-6 specific, actionable suggestions for improving ORGANIC performance (saves, shares, Pin potential, feed scroll-stop).
Do NOT suggest adding CTAs, product mentions, offers, urgency language, or conversion tactics — this is organic content.
Do NOT suggest mentioning a product that is not visibly in the creative.
Each line MUST start with priority and category tags. Each fix must be a MAXIMUM of 10 words. Punchy and direct. No parenthetical examples. No filler phrases.
1. [HIGH|MEDIUM|LOW] [HOOK|VISUAL|COPY|LAYOUT|TRUST] — [max 10 word fix]
2. [HIGH|MEDIUM|LOW] [HOOK|VISUAL|COPY|LAYOUT|TRUST] — [max 10 word fix]
3. [HIGH|MEDIUM|LOW] [HOOK|VISUAL|COPY|LAYOUT|TRUST] — [max 10 word fix]
BAD: "HIGH VISUAL — Add a Shop Now overlay to drive clicks"
GOOD: "HIGH VISUAL — Crop tighter to eliminate dead space on left"

---

## #️⃣ HASHTAGS
Provide platform-specific organic hashtag recommendations. Mix reach levels: mega, mid-range, niche. Format (use EXACTLY these labels):
META: #tag1 #tag2 #tag3
INSTAGRAM: #tag1 #tag2 #tag3 #tag4 #tag5
PINTEREST: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8

---

Do NOT include a budget recommendation section. This is organic content — there is no ad spend.`;

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
  youtube_shorts?: string[];
  reels?: string[];
  pinterest?: string[];
}

export type HookType = "Pattern Interrupt" | "Curiosity Gap" | "Bold Claim" | "Social Proof" | "Problem-Agitate" | "Question Hook" | "None detected";
export type HookVerdict = "Scroll-Stopper" | "Needs Work" | "Weak Open";

export interface HookDetail {
  hookType: HookType;
  verdict: HookVerdict;
  firstImpression: string;  // "First 3 Seconds" for video, "First Glance" for static
  hookFix: string | null;   // null if score >= 8
}

export interface Verdict {
  state: 'not_ready' | 'needs_work' | 'ready';
  headline: string;
  sub: string;
}

export interface StructuredImprovement {
  priority: 'high' | 'medium' | 'low';
  category: string;
  text: string;
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
  structuredImprovements?: StructuredImprovement[];
  verdict?: Verdict;
  budget: BudgetRecommendation | null;
  hashtags?: Hashtags;
  scenes?: Scene[];
  thumbnailDataUrl?: string;
  timestamp: Date;
  fileName: string;
  platformCta?: string | null;
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

/** Multi-pattern score extractor — tries 3 regex patterns per label for resilience. */
export function extractScore(text: string, ...labels: string[]): number {
  for (const label of labels) {
    // Pattern 1: "Label: X/10" or "Label: X / 10"
    const p1 = new RegExp(`${label}[:\\s]+([\\d.]+)\\s*(?:\\/\\s*10)?`, 'i');
    const m1 = text.match(p1);
    if (m1) return parseFloat(m1[1]);

    // Pattern 2: "Label — X/10" or "Label – X"
    const p2 = new RegExp(`${label}\\s*[—–-]+\\s*([\\d.]+)`, 'i');
    const m2 = text.match(p2);
    if (m2) return parseFloat(m2[1]);

    // Pattern 3: "X/10" on the same line as the label
    const p3 = new RegExp(`${label}[^\\n]*?(\\d+(?:\\.\\d)?)\\s*\\/\\s*10`, 'i');
    const m3 = text.match(p3);
    if (m3) return parseFloat(m3[1]);
  }
  return 0;
}

export function parseScores(markdown: string): AnalysisResult["scores"] {
  try {
    const hook = extractScore(markdown, 'Hook Strength', 'Hook', 'Thumb-Stop');
    const clarity = extractScore(markdown, 'Message Clarity', 'Message', 'Sound-Off', 'Retention', 'Audio & Captions');
    const cta = extractScore(markdown, 'CTA Effectiveness', 'CTA', 'Call to Action', 'Shareability & Save-Worthiness', 'Shareability & Rewatch', 'Shareability');
    const production = extractScore(markdown, 'Production Quality', 'Production', 'Visual', 'Brand');
    const overall = extractScore(markdown, 'Overall Ad Strength', 'Overall Ad', 'Overall Content Strength', 'Overall', 'Total Score');

    if (!hook && !clarity && !cta && !production && !overall) {
      console.warn("[parseScores] No dimensions found in response");
      return null;
    }

    return {
      hook: Math.round(hook),
      clarity: Math.round(clarity),
      cta: Math.round(cta),
      production: Math.round(production),
      overall: Math.round(overall),
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

/** Extract platform CTA if the AI detected one (e.g. "Platform CTA: Shop Now") */
export function parsePlatformCta(markdown: string): string | null {
  const match = markdown.match(/Platform CTA:\s*(.+?)(?:\n|$)/i);
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, '');
}

/** Auto-detect whether this ad relies on a platform CTA (no in-creative CTA) */
export function detectCtaFree(markdown: string, platform: string, format: string): boolean {
  if (platform !== 'Meta' || format !== 'video') return false;

  const noCta = /no (?:in-creative |in creative |visible )?CTA|CTA[:\s]+(?:none|absent|missing|not present)/i.test(markdown);
  const platformCta = parsePlatformCta(markdown) !== null;

  return noCta || platformCta;
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

export function parseVerdict(markdown: string, scores?: { overall: number } | null): Verdict | undefined {
  try {
    const match = markdown.match(/##\s*(?:📋\s*)?VERDICT\s*\n([\s\S]*?)(?=\n---|\n##|$)/i);
    if (match) {
      const section = match[1].trim();
      const stateMatch = section.match(/State:\s*\[?(not_ready|needs_work|ready)\]?/i);
      const headlineMatch = section.match(/Headline:\s*\[?(.*?)\]?\s*$/m);
      const subMatch = section.match(/Sub:\s*\[?(.*?)\]?\s*$/m);
      if (stateMatch && headlineMatch) {
        const stripQuotes = (s: string) => s.replace(/^\[|\]$/g, '').replace(/^["']|["']$/g, '').trim();
        return {
          state: stateMatch[1].toLowerCase() as Verdict['state'],
          headline: stripQuotes(headlineMatch[1]),
          sub: subMatch ? stripQuotes(subMatch[1]) : '',
        };
      }
    }
    // Fallback: derive from scores + creative verdict first sentence
    if (scores) {
      const verdictSection = markdown.match(/##\s*(?:🧠\s*)?CREATIVE VERDICT\s*\n([\s\S]*?)(?=\n---|\n##|$)/i);
      const firstSentence = verdictSection?.[1]?.trim().split(/[.!]\s/)?.[0] ?? '';
      const secondSentence = verdictSection?.[1]?.trim().split(/[.!]\s/)?.[1] ?? '';
      const sq = (s: string) => s.replace(/^["']|["']$/g, '').trim();
      return {
        state: scores.overall >= 8 ? 'ready' : scores.overall >= 5 ? 'needs_work' : 'not_ready',
        headline: firstSentence ? sq(firstSentence) + '.' : 'Analysis complete',
        sub: secondSentence ? sq(secondSentence) + '.' : '',
      };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function parseStructuredImprovements(markdown: string): StructuredImprovement[] | undefined {
  try {
    const match = markdown.match(/##\s*(?:🔧\s*)?IMPROVEMENTS\s*\n([\s\S]*?)(?=\n---|\n##|$)/i);
    if (!match) return undefined;

    const lines = match[1].trim().split('\n').filter(l => l.trim().length > 0 && !l.startsWith('#'));
    const results: StructuredImprovement[] = [];

    for (const line of lines) {
      const cleaned = line.replace(/^\d+\.\s*/, '').trim();

      // Format 1: [HIGH|CTA] — text (bracket-pipe with priority)
      const bracketPriorityMatch = cleaned.match(/^\[(HIGH|MEDIUM|LOW)\|([A-Z]+)\]\s*[—–\-]?\s*(.+)$/i);
      // Format 2: HIGH CTA — text (space-separated with priority)
      const spacePriorityMatch = cleaned.match(/^(HIGH|MEDIUM|LOW)\s+(CTA|VISUAL|HOOK|LAYOUT|TRUST|COPY)\s*[—–\-]\s*(.+)$/i);
      // Format 3: [CTA] — text (bracket category only, no priority)
      const bracketCategoryMatch = cleaned.match(/^\[(CTA|VISUAL|HOOK|LAYOUT|TRUST|COPY)\]\s*[—–\-]?\s*(.+)$/i);

      if (bracketPriorityMatch) {
        results.push({
          priority: bracketPriorityMatch[1].toLowerCase() as StructuredImprovement['priority'],
          category: bracketPriorityMatch[2].toLowerCase(),
          text: bracketPriorityMatch[3].trim(),
        });
      } else if (spacePriorityMatch) {
        results.push({
          priority: spacePriorityMatch[1].toLowerCase() as StructuredImprovement['priority'],
          category: spacePriorityMatch[2].toLowerCase(),
          text: spacePriorityMatch[3].trim(),
        });
      } else if (bracketCategoryMatch) {
        results.push({
          priority: results.length === 0 ? 'high' : results.length === 1 ? 'medium' : 'low',
          category: bracketCategoryMatch[1].toLowerCase(),
          text: bracketCategoryMatch[2].trim(),
        });
      } else {
        // Fallback: strip any remaining bracket prefix patterns, infer priority from position
        const strippedText = cleaned.replace(/^\[.*?\]\s*[—–\-]?\s*/, '').trim();
        results.push({
          priority: results.length === 0 ? 'high' : results.length === 1 ? 'medium' : 'low',
          category: 'visual',
          text: strippedText || cleaned,
        });
      }
    }

    return results.length > 0 ? results : undefined;
  } catch {
    return undefined;
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
    const youtube_shorts = extract("YOUTUBE SHORTS") || extract("YOUTUBE");
    const reels = extract("INSTAGRAM REELS") || extract("REELS");
    const pinterest = extract("PINTEREST");

    const all = [...tiktok, ...meta, ...instagram, ...youtube_shorts, ...reels, ...pinterest];
    if (all.length === 0) return undefined;

    return {
      tiktok, meta, instagram,
      ...(youtube_shorts.length > 0 && { youtube_shorts }),
      ...(reels.length > 0 && { reels }),
      ...(pinterest.length > 0 && { pinterest }),
    };
  } catch {
    return undefined;
  }
}

export function parseScenes(markdown: string): Scene[] | undefined {
  try {
    // Look for a fenced ```json block containing a "scenes" array
    const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)```/i);
    if (!jsonBlockMatch) return undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonBlockMatch[1].trim());
    } catch {
      console.warn('[parseScenes] Failed to parse scene JSON block:', jsonBlockMatch[1].slice(0, 200));
      return undefined;
    }
    if (!parsed || typeof parsed !== 'object') return undefined;
    const scenes = (parsed as Record<string, unknown>).scenes;
    if (!Array.isArray(scenes) || scenes.length === 0) return undefined;
    return scenes as Scene[];
  } catch {
    return undefined;
  }
}

// Recalculate overall score — delegates to validateScores as single source of truth.
// validateScores clamps all values to 1.0-10.0 and recalculates overall as dimension average.
export function recalculateOverallScore(
  scores: AnalysisResult["scores"]
): AnalysisResult["scores"] {
  if (!scores) return scores;

  const validated = validateScores(scores as Record<string, number>);
  return {
    hook: validated.hook,
    clarity: validated.clarity,
    cta: validated.cta,
    production: validated.production,
    overall: validated.overall,
  } as AnalysisResult["scores"];
}

// ─── MAIN ANALYZER ────────────────────────────────────────────────────────────

export async function analyzeVideo(
  file: File,
  _apiKey: string,
  onStatusChange?: (status: AnalysisStatus, message?: string) => void,
  contextPrefix?: string,
  userContext?: string,
  sessionMemory?: string,
  contentType: "paid" | "organic" = "paid"
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

    const resolvedMime = inferUploadMimeType(file);
    if (resolvedMime === "application/octet-stream") {
      throw new Error("Could not detect file type — rename the file with a standard extension (.mp4, .mov, .jpg, …) or pick the file using Browse.");
    }

    // 2. Build prompt — format-aware
    const isImage = resolvedMime.startsWith("image/");
    emit("processing", isImage ? "Analyzing your static creative..." : "Analyzing your creative...");

    const isOrganic = contentType === "organic";
    const basePrompt = isOrganic
      ? (isImage ? ORGANIC_STATIC_ANALYSIS_PROMPT : ORGANIC_ANALYSIS_PROMPT)
      : (isImage ? STATIC_ANALYSIS_PROMPT : ANALYSIS_PROMPT);
    const parts: string[] = [];
    if (contextPrefix) parts.push(contextPrefix);
    if (userContext) parts.push(userContext);
    parts.push(basePrompt);
    const prompt = parts.join('\n\n');

    // 3. Call server-side Gemini proxy with file URL (not base64)
    const markdown = await callGeminiProxy({
      fileUrl: uploaded.fileUrl,
      mimeType: resolvedMime,
      prompt,
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: MAX_TOKENS,
      temperature: 0,
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
      const enhanced = await claudeImprovements(markdown, scores, userContext, undefined, sessionMemory, contentType);
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

    // 11. Parse verdict from markdown (graceful — never throws)
    const verdict = parseVerdict(markdown, scores);

    // 12. Parse structured improvements with priority/category (graceful — never throws)
    const structuredImprovements = parseStructuredImprovements(markdown);

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
      structuredImprovements,
      verdict,
      budget,
      hashtags,
      scenes,
      timestamp: new Date(),
      fileName: file.name,
      platformCta: !isImage ? parsePlatformCta(markdown) : null,
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
    temperature: 0,
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
  brandVoice?: string,
  isOrganic?: boolean,
): Promise<string> {
  const nicheLabel = niche || (isOrganic ? "creator content" : "performance marketing");
  const platformLabel = platform || (isOrganic ? "this platform" : "paid social");
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

  const promptPaid = `You are writing a creative brief for the next iteration of a ${nicheLabel} ad on ${platformLabel}. The current ad scored ${scores?.overall ?? "?"}/10 overall. The user's goal is ${intentLabel} (${intentObjective}).

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

  const promptOrganic = `You are writing a creator brief for the next iteration of a ${nicheLabel} creator's post on ${platformLabel}. The current post scored ${scores?.overall ?? "?"}/10 overall. The goal is organic performance — scroll-stop, save rate, share appeal, rewatch, audience growth. This is organic creator content — NOT a paid ad.

${weakDims.length ? `CRITICAL WEAKNESSES TO FIX (these are the #1 priority):\n${weakDims.map(d => `→ ${d}`).join("\n")}\nEvery section of this brief must address at least one of these weaknesses.\n` : ""}
${scores ? `CURRENT SCORES: Hook ${scores.hook}/10 | Clarity ${scores.clarity}/10 | Shareability ${scores.cta}/10 | Production ${scores.production}/10 | Overall ${scores.overall}/10` : ""}

Never recommend conversion tactics, CTAs, offers, pricing, discounts, or ad-style urgency. Never use ad terminology (impression, CPA, CTR, CPM, ROAS, funnel, lead, conversion).

Structure the brief exactly like this:

## Creative Brief

**Objective:** One sentence — what this creator's post must achieve on ${platformLabel} for organic performance (scroll-stop, save, share, rewatch, reach). Current score: ${scores?.overall ?? "?"}/10. Target: ${Math.min(10, (scores?.overall ?? 5) + 2)}/10.

**Target Audience:** Feed scrollers on ${platformLabel} who save, share, or rewatch ${nicheLabel} content. What they care about. What would make them stop scrolling. NOT shoppers or buyers — feed viewers.

**Hook Direction:** 2-3 organic hook concepts (pattern interrupt, curiosity gap, relatable moment, creator-to-camera opener) with the first 3 seconds described for each.${weakDims.some(d => d.includes("hook")) ? ` PRIORITY FIX: Current hook scored ${scores?.hook ?? "?"}/10 — these hooks must be dramatically stronger. Reference what specifically failed in the current hook.` : ""} NO CTAs in the hook. NO product reveals.

**Format:** [Authentic cut / POV storytelling / Lifestyle vignette / Day-in-the-life / Talking head / Voiceover with b-roll / Other creator-native format] — why this fits the creator and audience. NOT "UGC product demonstration" — UGC as a format term is paid advertising vocabulary.

**Key Message:** The single most important thing a feed viewer on ${platformLabel} should feel or take away from this post. NOT a product pitch or value proposition.

**Proof Points:** 3 creator-credibility signals specific to THIS creator and niche — lived experience, community trust, niche expertise, trend participation, audience relevance. NEVER review counts, star ratings, testimonials-as-social-proof, money-back guarantees, or risk-free trials.

**CTA:** A SOFT ENGAGEMENT PROMPT — examples: "save for your next ${nicheLabel} moment", "comment your favorite part", "share with someone who'd love this", "follow for part 2". NEVER "Shop Now", "Link in bio", "Free Shipping", "Use code", "discount", "buy now", or any purchase language.${weakDims.some(d => d.includes("cta")) ? ` PRIORITY FIX: Current shareability/engagement score was ${scores?.cta ?? "?"}/10 — make the engagement prompt more compelling and specific.` : ""}

**Do:** 3 things the creative must include — each one addresses a specific weakness from the scorecard and is organic-native (save-worthy moment, share trigger, rewatchability, trend awareness, creator-voice authenticity).
**Don't:** 3 things to avoid — each one calls out a specific ad-voice pattern the creator must not adopt (no "Shop Now", no product pitch, no urgency copy, no hard sell, no ad terminology).

Every line must be specific to ${nicheLabel} on ${platformLabel}. If a line could apply to any product in any niche, rewrite it.

---

## POST ANALYSIS
${analysisMarkdown}`;

  const prompt = isOrganic ? promptOrganic : promptPaid;

  const systemInstructionPaid = `You are a senior creative strategist specializing in ${nicheLabel} advertising on ${platformLabel}. You write tight, actionable creative briefs for ${intentLabel} campaigns. Your briefs target the ad's specific weaknesses${weakDims.length ? ` (${weakDims.join(", ")})` : ""} — not generic improvement templates. Every recommendation must be executable by a creative team working on ${nicheLabel} ads.${brandVoice ? `\n\n${brandVoice}` : ""}`;

  const systemInstructionOrganic = `You are a senior organic content strategist helping a ${nicheLabel} creator plan their next post on ${platformLabel}. You write tight, actionable creator briefs targeting the content's specific weaknesses${weakDims.length ? ` (${weakDims.join(", ")})` : ""} — not generic templates. You write for organic performance (scroll-stop, save, share, rewatch), NEVER for conversion.

Anti-leak rules (non-negotiable):
- NEVER write "Shop Now", "Link in bio", "Free Shipping", "Use code", "discount", or any conversion/purchase copy.
- NEVER cite review counts, star ratings, or money-back guarantees as proof points — use creator credibility (lived experience, community trust, niche expertise).
- NEVER describe the format as "UGC product demonstration" — use creator-native format names.
- NEVER invent a product or brand if none is visible in the analysis.${brandVoice ? `\n\n${brandVoice}` : ""}`;

  const systemInstruction = isOrganic ? systemInstructionOrganic : systemInstructionPaid;

  return callGeminiProxy({
    prompt,
    systemInstruction,
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
    temperature: 0,
  });
}
