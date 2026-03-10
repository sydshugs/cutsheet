export type Theme = "dark" | "light";
export const THEME_KEY = "cutsheet-theme";

export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "dark";
}

export const themes = {
  dark: {
    bg: "#0A0A0A",
    navBg: "rgba(10,10,10,0.9)",
    text: "#fff",
    textPrimary: "rgba(255,255,255,0.85)",
    textSecondary: "rgba(255,255,255,0.7)",
    textMuted: "rgba(255,255,255,0.35)",
    textFaint: "rgba(255,255,255,0.3)",
    textSubtle: "rgba(255,255,255,0.25)",
    surface: "rgba(255,255,255,0.06)",
    surfaceDim: "rgba(255,255,255,0.02)",
    surfaceMid: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.06)",
    borderMid: "rgba(255,255,255,0.1)",
    borderStrong: "rgba(255,255,255,0.12)",
    scorecardBg: "#0A0A0A",
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
    bg: "#F5F5F3",
    navBg: "rgba(245,245,243,0.9)",
    text: "#0A0A0A",
    textPrimary: "rgba(10,10,10,0.85)",
    textSecondary: "rgba(10,10,10,0.7)",
    textMuted: "rgba(0,0,0,0.35)",
    textFaint: "rgba(10,10,10,0.3)",
    textSubtle: "rgba(10,10,10,0.25)",
    surface: "#FFFFFF",
    surfaceDim: "rgba(0,0,0,0.02)",
    surfaceMid: "rgba(0,0,0,0.08)",
    border: "rgba(0,0,0,0.08)",
    borderMid: "rgba(0,0,0,0.1)",
    borderStrong: "rgba(0,0,0,0.12)",
    scorecardBg: "#FFFFFF",
    spinnerText: "rgba(10,10,10,0.6)",
    spinnerSub: "rgba(10,10,10,0.25)",
    h3Color: "rgba(10,10,10,0.5)",
    pColor: "rgba(10,10,10,0.75)",
    strongColor: "rgba(10,10,10,0.95)",
    liColor: "rgba(10,10,10,0.7)",
    codeColor: "rgba(10,10,10,0.8)",
    codeBg: "rgba(0,0,0,0.06)",
    hrColor: "rgba(0,0,0,0.06)",
    blockquoteColor: "rgba(10,10,10,0.5)",
    markdownText: "rgba(10,10,10,0.8)",
  },
} as const;

export type ThemeTokens = { [K in keyof typeof themes.dark]: string };
