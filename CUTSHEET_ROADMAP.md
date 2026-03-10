# Cutsheet — Build Roadmap & Prompts

## ✅ Completed
- [x] Core video upload + Gemini analysis
- [x] Scene breakdown, hook scoring, emotion arc
- [x] Score card with animated bars + arc
- [x] URL input (direct video URLs)
- [x] Timestamp click-to-seek
- [x] Share scorecard as PNG
- [x] Dark/light mode toggle
- [x] Local analysis history drawer
- [x] Updated fonts (Outfit + JetBrains Mono)
- [x] Cutsheet logo mark (clipped corner)
- [x] Animated loading state (ripple rings)
- [x] Landing page (landing.html)
- [x] Public scorecard links (Supabase integration)

---

## 🔨 This Week — Make It Stickier

### [ ] 1. Brief Generator
**What it does:** Converts the analysis into a ready-to-send creative brief.

**Claude Code prompt:**
```
Add a "Generate Brief" button to the app.

It should appear in the results panel after analysis is complete, 
below the Creative Verdict section.

When clicked it calls Gemini with this system prompt:
"You are a senior creative strategist. You write tight, actionable 
creative briefs that creative teams can execute immediately."

And this user prompt (inject the existing analysis markdown as context):
"Based on this video ad analysis, write a creative brief for the 
next iteration of this ad. Structure it exactly like this:

## Creative Brief

**Objective:** One sentence on what this ad should achieve.

**Target Audience:** Who this is for, what they care about, 
what their pain point is.

**Hook Direction:** 2-3 hook concepts with the first 3 seconds 
described for each.

**Format:** [UGC / Talking head / Lifestyle / Animation / Other] 
— and why this format fits the audience.

**Key Message:** The single most important thing the viewer 
should feel or understand.

**Proof Points:** What evidence or credibility to include.

**CTA:** Exact CTA copy + placement recommendation.

**Do:** 3 things the creative must include or achieve.
**Don't:** 3 things to avoid based on weaknesses in the current ad.

Be specific. No generic advice. Every line should be actionable."

Show the brief in a new tab/panel next to the analysis output.
Add a copy and download button for the brief.
Use the same markdown styling as the analysis output.
```

---

### [ ] 2. PDF Export
**What it does:** Exports a branded Cutsheet report as a PDF.

**Claude Code prompt:**
```
Add a PDF export feature to the app.

Install: npm install jspdf html2canvas

When the user clicks "Export PDF" (add this button next to 
"Export .md" in the nav), generate a PDF report with:

Page 1 — Cover
- Cutsheet logo + wordmark top left
- "Creative Analysis Report" as headline
- Video filename
- Analysis date and time
- Overall score large and centered with the arc visualization

Page 2+ — Full Analysis
- All sections from the markdown analysis rendered cleanly
- Score card with all 5 bars
- JetBrains Mono for labels, Outfit for body text
- Dark background (#0A0A0A), red accents (#FF4444)
- Cutsheet logo watermark in footer of every page

File should download as: [filename]_cutsheet_report.pdf

Use jsPDF with html2canvas to capture the rendered analysis 
panel and convert to PDF. Do not use print CSS.
```

---

### [x] 3. Public Scorecard Links ✅
**What it does:** Shareable URL for each analysis — `cutsheet.app/s/abc123`

**Status:** COMPLETE

**Implementation:**
- Supabase integration with `analyses` table
- 8-character random alphanumeric slugs
- "Share Link" button in nav
- Public share page at `/s/[slug]`
- React Router for routing
- Toast notification on link copy
- Read-only scorecard display
- Full markdown analysis rendering
- "Analyzed with Cutsheet" footer

**Setup required:**
See SUPABASE_SETUP.md for database configuration instructions.

---

## 💰 Next Week — Make It Chargeable

### [ ] 4. Stripe Paywall
**What it does:** 3 free analyses then $29/mo Pro.

**Claude Code prompt:**
```
Add Stripe-based paywall to the app.

Free tier: 3 analyses total (tracked in localStorage 
key "cutsheet-usage-count")
Pro tier: unlimited analyses at $29/mo

Install: npm install @stripe/stripe-js
Add VITE_STRIPE_PUBLISHABLE_KEY to .env

When the user hits their 3rd analysis:
- After it completes, show an upgrade modal
- Modal shows: "You've used your 3 free analyses"
- Two options: "Upgrade to Pro — $29/mo" and "Maybe Later"
- Upgrade button redirects to Stripe Checkout

Create a /success route that:
- Shows a success message
- Sets localStorage key "cutsheet-pro" to true
- Removes the analysis limit

For now use Stripe Checkout (hosted page), not embedded.
Add a small "Pro" badge in the nav when user is on pro plan.
Add a "Upgrade to Pro" button in the nav for free users 
after they've used 1+ analyses.
```

---

### [ ] 5. Batch Upload
**What it does:** Analyze multiple videos at once, get a batch summary.

**Claude Code prompt:**
```
Add batch analysis mode to the app.

Add a "Batch" toggle in the nav that switches to batch mode.

Batch mode:
- Upload up to 10 video files at once (multi-file dropzone)
- Show a queue list with filename, size, and status 
  (pending / analyzing / complete / error) for each
- "Run Batch Analysis" button starts processing sequentially 
  (one at a time, not parallel — avoid rate limits)
- Show a progress indicator: "Analyzing 2 of 5..."
- Each video shows a mini score card when complete

After all videos are processed, show a Batch Summary section:
- Table comparing all videos with their 5 scores side by side
- Highlight the highest score in each column in green
- Highlight the lowest in red
- One paragraph AI verdict: call Gemini with all overall scores 
  and filenames and ask "Rank these ads from strongest to weakest 
  and give a one sentence reason for each ranking."
- Export batch summary as CSV button

Save all batch analyses to history individually.
Keep single analysis as the default mode.
```

---

## 🚀 Week After — Make It Viral

### [ ] 6. Chrome Extension
**What it does:** Right-click any video on TikTok/Meta Ads Library and analyze it.

**Claude Code prompt:**
```
Create a Chrome extension for Cutsheet in a new folder 
called /cutsheet-extension at the project root.

Structure:
cutsheet-extension/
  manifest.json
  popup.html
  popup.js
  content.js
  background.js
  icons/ (16, 48, 128px — use the Cutsheet logo mark)

manifest.json:
- Manifest V3
- Name: "Cutsheet — Video Ad Analyzer"
- Permissions: activeTab, contextMenus, storage
- Content scripts on: tiktok.com, facebook.com, 
  instagram.com, twitter.com, youtube.com

Features:
1. Context menu — right-click any video element on supported 
   sites → "Analyze with Cutsheet"
2. Popup — shows last 5 analyses from the extension
3. When triggered, extracts the video URL from the page, 
   opens a new tab to cutsheet.app with the URL pre-filled 
   in the URL input field using a query param:
   cutsheet.app?url=[encoded video url]

In App.tsx, add logic to read the ?url query param on mount 
and auto-populate the URL input field if present.

Write a README.md in the extension folder with:
- How to load in Chrome (developer mode)
- How to package for Chrome Web Store submission
```

---

## 🔮 Backlog — Nice to Have

### [ ] Competitor swipe file
Save analyzed videos to a personal library tagged by brand, format, niche. Filter and search your swipe file.

### [ ] Score benchmarks by niche
"Your hook score of 8 beats 73% of DTC skincare ads analyzed this week." Needs aggregate data — build after you have real users.

### [ ] Re-analyze
Run the same video through again after editing. Show score diff: Hook +2, CTA +1.

### [ ] Weekly digest email
Summary of recent analyses, trends, top performing creative. Needs auth + email provider (Resend).

### [ ] Embed widget
Drop a scorecard into Notion, Slack, or a client report via iframe.

### [ ] API access tier
Let power users pipe analyses into their own tools. $99/mo tier. Needs proper auth + rate limiting.

---

## 🛠 Tech Stack Reference
- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + inline styles
- **AI:** Google Gemini 2.0 Flash (gemini-2.0-flash)
- **Fonts:** Outfit + JetBrains Mono
- **PDF:** jsPDF + html2canvas (pending)
- **Database:** Supabase (pending)
- **Payments:** Stripe (pending)
- **Extension:** Chrome MV3 (pending)

## 🔑 Env Variables
```
VITE_GEMINI_API_KEY=
VITE_SUPABASE_URL=        # add when building public links
VITE_SUPABASE_ANON_KEY=   # add when building public links
VITE_STRIPE_PUBLISHABLE_KEY=  # add when building paywall
```
