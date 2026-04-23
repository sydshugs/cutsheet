/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  PlatformOptimizationCard,
  type PlatformOptimizationEntry,
} from "./PlatformOptimizationCard";
import {
  toPlatformOptimizationEntries,
  toPlatformOptimizationEntry,
} from "./platformOptimizationAdapter";
import type { PlatformScore } from "../../services/claudeService";

const baseEntry: PlatformOptimizationEntry = {
  name: "TikTok",
  score: 8.5,
  verdict: "Strong native feel with excellent pacing.",
  signals: [
    { type: "pass", label: "Vertical 9:16" },
    { type: "pass", label: "Fast Hook" },
    { type: "fail", label: "Trending Audio" },
  ],
  recommendations: [
    "Add a trending track at 10% volume.",
    "Use native text-to-speech for the first 3 seconds.",
  ],
};

describe("PlatformOptimizationCard", () => {
  it("renders nothing when entries is empty", () => {
    const { container } = render(<PlatformOptimizationCard entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders one row per entry", () => {
    const entries: PlatformOptimizationEntry[] = [
      baseEntry,
      { ...baseEntry, name: "Instagram Reels", score: 6.0 },
      { ...baseEntry, name: "YouTube Shorts", score: 3.2 },
    ];
    render(<PlatformOptimizationCard entries={entries} />);
    expect(screen.getAllByTestId("platform-entry")).toHaveLength(3);
  });

  it("pluralizes the header summary for 2+ platforms", () => {
    const entries: PlatformOptimizationEntry[] = [
      baseEntry,
      { ...baseEntry, name: "Instagram Reels", score: 6.0 },
    ];
    render(<PlatformOptimizationCard entries={entries} />);
    expect(screen.getByText("2 platforms analyzed")).toBeInTheDocument();
  });

  it("uses singular in the header for exactly 1 platform", () => {
    render(<PlatformOptimizationCard entries={[baseEntry]} />);
    expect(screen.getByText("1 platform analyzed")).toBeInTheDocument();
  });

  it("maps score 8.5 to EXCELLENT", () => {
    render(<PlatformOptimizationCard entries={[baseEntry]} />);
    expect(screen.getByTestId("status-badge")).toHaveTextContent("EXCELLENT");
  });

  it("maps score 6.0 to GOOD", () => {
    render(
      <PlatformOptimizationCard
        entries={[{ ...baseEntry, score: 6.0 }]}
      />,
    );
    expect(screen.getByTestId("status-badge")).toHaveTextContent("GOOD");
  });

  it("maps score 3.2 to NEEDS WORK", () => {
    render(
      <PlatformOptimizationCard
        entries={[{ ...baseEntry, score: 3.2 }]}
      />,
    );
    expect(screen.getByTestId("status-badge")).toHaveTextContent("NEEDS WORK");
  });

  it("renders signal pills with pass/fail variants", () => {
    render(<PlatformOptimizationCard entries={[baseEntry]} />);
    expect(screen.getAllByTestId("signal-pass")).toHaveLength(2);
    expect(screen.getAllByTestId("signal-fail")).toHaveLength(1);
    expect(screen.getByText("Vertical 9:16")).toBeInTheDocument();
    expect(screen.getByText("Trending Audio")).toBeInTheDocument();
  });

  it("renders numbered recommendation chips in indigo #6366f1", () => {
    render(<PlatformOptimizationCard entries={[baseEntry]} />);
    const chips = screen.getAllByTestId("recommendation-chip");
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveTextContent("1");
    expect(chips[1]).toHaveTextContent("2");
    // ONE COLOR RULE — indigo applied to recommendation chips
    expect(chips[0].className).toContain("#6366f1");
    expect(chips[0].className).toContain("text-[#6366f1]");
  });

  it("renders the header with BarChart2 icon and 'Platform Optimization' title", () => {
    render(<PlatformOptimizationCard entries={[baseEntry]} />);
    expect(
      screen.getByRole("heading", { name: /platform optimization/i }),
    ).toBeInTheDocument();
  });

  it("renders the decorative chevron on each row", () => {
    const entries: PlatformOptimizationEntry[] = [
      baseEntry,
      { ...baseEntry, name: "Reels", score: 6.0 },
    ];
    const { container } = render(
      <PlatformOptimizationCard entries={entries} />,
    );
    const rows = screen.getAllByTestId("platform-entry");
    for (const row of rows) {
      const chevrons = row.querySelectorAll("svg.lucide-chevron-down");
      expect(chevrons.length).toBe(1);
    }
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("renders verdict text inside each entry", () => {
    render(<PlatformOptimizationCard entries={[baseEntry]} />);
    expect(
      screen.getByText("Strong native feel with excellent pacing."),
    ).toBeInTheDocument();
  });

  it("clamps the score bar width between 0 and 100%", () => {
    const overflow: PlatformOptimizationEntry = { ...baseEntry, score: 99 };
    const under: PlatformOptimizationEntry = { ...baseEntry, score: -5 };
    const { rerender } = render(
      <PlatformOptimizationCard entries={[overflow]} />,
    );
    expect(screen.getByTestId("score-bar-fill")).toHaveStyle({ width: "100%" });
    rerender(<PlatformOptimizationCard entries={[under]} />);
    expect(screen.getByTestId("score-bar-fill")).toHaveStyle({ width: "0%" });
  });
});

describe("platformOptimizationAdapter", () => {
  it("maps a PlatformScore to a PlatformOptimizationEntry", () => {
    const score: PlatformScore = {
      platform: "tiktok",
      score: 8.2,
      verdict: "Strong native feel.",
      signals: [
        { label: "Vertical 9:16", pass: true },
        { label: "Trending Audio", pass: false },
      ],
      improvements: ["Add a trending track.", "Use TTS for hook."],
    };
    const entry = toPlatformOptimizationEntry(score);
    expect(entry.name).toBe("TikTok");
    expect(entry.score).toBe(8.2);
    expect(entry.verdict).toBe("Strong native feel.");
    expect(entry.signals).toEqual([
      { type: "pass", label: "Vertical 9:16" },
      { type: "fail", label: "Trending Audio" },
    ]);
    expect(entry.recommendations).toEqual([
      "Add a trending track.",
      "Use TTS for hook.",
    ]);
  });

  it("maps known short platform tokens to display labels", () => {
    const cases: Array<[string, string]> = [
      ["reels", "Instagram Reels"],
      ["shorts", "YouTube Shorts"],
      ["meta", "Meta Feed"],
      ["instagram", "Instagram"],
      ["pinterest", "Pinterest"],
      ["facebook", "Facebook"],
    ];
    for (const [input, expected] of cases) {
      const entry = toPlatformOptimizationEntry({
        platform: input,
        score: 5,
        verdict: "",
      });
      expect(entry.name).toBe(expected);
    }
  });

  it("falls back to tips when improvements is empty", () => {
    const entry = toPlatformOptimizationEntry({
      platform: "meta",
      score: 6,
      verdict: "",
      improvements: [],
      tips: ["Tip A", "Tip B"],
    });
    expect(entry.recommendations).toEqual(["Tip A", "Tip B"]);
  });

  it("returns empty entries for null or empty input", () => {
    expect(toPlatformOptimizationEntries(null)).toEqual([]);
    expect(toPlatformOptimizationEntries(undefined)).toEqual([]);
    expect(toPlatformOptimizationEntries([])).toEqual([]);
  });

  it("caps recommendations at 3 items", () => {
    const entry = toPlatformOptimizationEntry({
      platform: "tiktok",
      score: 7,
      verdict: "",
      improvements: ["a", "b", "c", "d", "e"],
    });
    expect(entry.recommendations).toHaveLength(3);
    expect(entry.recommendations).toEqual(["a", "b", "c"]);
  });

  it("handles missing signals gracefully", () => {
    const entry = toPlatformOptimizationEntry({
      platform: "tiktok",
      score: 7,
      verdict: "",
    });
    expect(entry.signals).toEqual([]);
  });
});
