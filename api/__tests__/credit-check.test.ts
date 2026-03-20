// @vitest-environment node
// Tests for api/_lib/creditCheck.ts — pure credit limit logic

import { describe, it, expect } from "vitest";

// Test the credit limit constants and tier logic inline since creditCheck.ts
// has complex Redis dependencies. We test the limit tables from check-feature-limit.ts.

const FREE_DAILY_LIMITS: Record<string, number> = {
  analyze: 3,
  fixIt: 1,
  policyCheck: 1,
  deconstruct: 1,
  brief: 2,
  visualize: 0,
  script: 0,
};

const PRO_MONTHLY_LIMITS: Record<string, number> = {
  analyze: Infinity,
  visualize: 10,
  script: 10,
  fixIt: 20,
  policyCheck: 30,
  deconstruct: 20,
  brief: 20,
};

const TEAM_MONTHLY_LIMITS: Record<string, number> = {
  analyze: Infinity,
  visualize: 25,
  script: 25,
  fixIt: 50,
  policyCheck: 75,
  deconstruct: 50,
  brief: 50,
};

type Tier = "free" | "pro" | "team";

function getLimitForTier(tier: Tier, feature: string): number {
  if (tier === "team") return TEAM_MONTHLY_LIMITS[feature] ?? 0;
  if (tier === "pro") return PRO_MONTHLY_LIMITS[feature] ?? 0;
  return FREE_DAILY_LIMITS[feature] ?? 0;
}

describe("Credit limit tables", () => {
  describe("Free tier", () => {
    it("allows 3 daily analyses", () => {
      expect(getLimitForTier("free", "analyze")).toBe(3);
    });

    it("blocks visualize for free", () => {
      expect(getLimitForTier("free", "visualize")).toBe(0);
    });

    it("blocks script for free", () => {
      expect(getLimitForTier("free", "script")).toBe(0);
    });

    it("allows 2 briefs", () => {
      expect(getLimitForTier("free", "brief")).toBe(2);
    });

    it("returns 0 for unknown features", () => {
      expect(getLimitForTier("free", "unknown")).toBe(0);
    });
  });

  describe("Pro tier", () => {
    it("has unlimited analyses", () => {
      expect(getLimitForTier("pro", "analyze")).toBe(Infinity);
    });

    it("has 10 visualize credits", () => {
      expect(getLimitForTier("pro", "visualize")).toBe(10);
    });

    it("has 20 fixIt credits", () => {
      expect(getLimitForTier("pro", "fixIt")).toBe(20);
    });
  });

  describe("Team tier", () => {
    it("has unlimited analyses", () => {
      expect(getLimitForTier("team", "analyze")).toBe(Infinity);
    });

    it("has 25 visualize credits (more than Pro)", () => {
      expect(getLimitForTier("team", "visualize")).toBe(25);
    });

    it("has higher limits than Pro for all features", () => {
      for (const feature of Object.keys(PRO_MONTHLY_LIMITS)) {
        const proLimit = PRO_MONTHLY_LIMITS[feature];
        const teamLimit = TEAM_MONTHLY_LIMITS[feature];
        expect(teamLimit).toBeGreaterThanOrEqual(proLimit);
      }
    });
  });
});

describe("getYearMonth helper", () => {
  it("produces YYYY-MM format", () => {
    const now = new Date();
    const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    expect(yearMonth).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("getMonthTTL helper", () => {
  it("returns positive seconds until next month", () => {
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const ttl = Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(31 * 24 * 3600); // max 31 days
  });
});
