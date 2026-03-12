export type Theme = "dark" | "light";
export const THEME_KEY = "cutsheet-theme";

export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  // Default to light — primary experience is light shell
  return "light";
}

export const themes = {
  dark: {
    // Dark contexts only (modals / share page) with aurora-style background
    bg: "radial-gradient(circle at 0% 0%, rgba(99,102,241,0.2), transparent 55%), radial-gradient(circle at 100% 0%, rgba(65,88,208,0.25), transparent 55%), #0D0D0D",
    navBg: "rgba(13,13,13,0.92)",
    text: "#FAFAF9",
    textPrimary: "rgba(250,250,249,0.92)",
    textSecondary: "rgba(250,250,249,0.7)",
    textMuted: "rgba(250,250,249,0.45)",
    textFaint: "rgba(250,250,249,0.35)",
    textSubtle: "rgba(250,250,249,0.25)",
    surface: "rgba(17,17,16,0.9)",
    surfaceDim: "rgba(17,17,16,0.8)",
    surfaceMid: "rgba(17,17,16,0.98)",
    border: "rgba(250,250,249,0.12)",
    borderMid: "rgba(250,250,249,0.18)",
    borderStrong: "rgba(250,250,249,0.24)",
    scorecardBg: "rgba(17,17,16,0.95)",
    spinnerText: "rgba(255,255,255,0.6)",
    spinnerSub: "rgba(255,255,255,0.25)",
    h3Color: "rgba(255,255,255,0.5)",
    pColor: "rgba(255,255,255,0.75)",
    strongColor: "rgba(255,255,255,0.95)",
    liColor: "rgba(255,255,255,0.7)",
    codeColor: "rgba(255,255,255,0.8)",
    codeBg: "rgba(255,255,255,0.06)",
    hrColor: "rgba(255,255,255,0.06)",
    blockquoteColor: "rgba(255,255,255,0.5)",
    markdownText: "rgba(255,255,255,0.8)",
  },
  light: {
    // New light shell palette
    bg: "#FAFAF9",
    navBg: "rgba(250,250,249,0.92)",
    text: "#111110",
    textPrimary: "#111110",
    textSecondary: "#555552",
    textMuted: "#999996",
    textFaint: "rgba(17,17,16,0.4)",
    textSubtle: "rgba(17,17,16,0.28)",
    surface: "#FFFFFF",
    surfaceDim: "#FFFFFF",
    surfaceMid: "#FFFFFF",
    border: "rgba(0,0,0,0.07)",
    borderMid: "rgba(0,0,0,0.09)",
    borderStrong: "rgba(0,0,0,0.14)",
    scorecardBg: "#FFFFFF",
    spinnerText: "#555552",
    spinnerSub: "#999996",
    h3Color: "#555552",
    pColor: "#555552",
    strongColor: "#111110",
    liColor: "#555552",
    codeColor: "#111110",
    codeBg: "rgba(0,0,0,0.04)",
    hrColor: "rgba(0,0,0,0.06)",
    blockquoteColor: "#555552",
    markdownText: "#111110",
  },
} as const;

export type ThemeTokens = { [K in keyof typeof themes.dark]: string };
