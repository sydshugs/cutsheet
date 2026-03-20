// @vitest-environment node
// Tests for api/_lib/auth.ts — pure functions + mock-based auth verification

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Mock Supabase before importing auth
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock Upstash
vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: vi.fn(() => ({})) },
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn(),
}));

// Shared mock Supabase instance
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

// Re-create the chain for each call
function setupSupabaseMock(userId: string | null, subscriptionStatus: string | null) {
  if (userId) {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
  } else {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid token"),
    });
  }

  const singleMock = vi.fn().mockResolvedValue({
    data: subscriptionStatus ? { subscription_status: subscriptionStatus } : null,
    error: null,
  });
  const eqMock = vi.fn(() => ({ single: singleMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  mockSupabase.from.mockReturnValue({ select: selectMock });
}

import { isProOrTeam, verifyAuth, handlePreflight, setCorsHeaders } from "../_lib/auth";

// ─── Pure function tests ──────────────────────────────────────────────────────

describe("isProOrTeam", () => {
  it("returns true for pro", () => {
    expect(isProOrTeam("pro")).toBe(true);
  });

  it("returns true for team", () => {
    expect(isProOrTeam("team")).toBe(true);
  });

  it("returns false for free", () => {
    expect(isProOrTeam("free")).toBe(false);
  });
});

// ─── Auth verification tests ──────────────────────────────────────────────────

describe("verifyAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  });

  it("returns null if no authorization header", async () => {
    const req = { headers: {} } as VercelRequest;
    const result = await verifyAuth(req);
    expect(result).toBeNull();
  });

  it("returns null if authorization header is not Bearer", async () => {
    const req = { headers: { authorization: "Basic abc" } } as VercelRequest;
    const result = await verifyAuth(req);
    expect(result).toBeNull();
  });

  it("returns null for invalid token", async () => {
    setupSupabaseMock(null, null);
    const req = { headers: { authorization: "Bearer invalid-token" } } as VercelRequest;
    const result = await verifyAuth(req);
    expect(result).toBeNull();
  });

  it("returns free tier user when no profile", async () => {
    setupSupabaseMock("user-123", null);
    const req = { headers: { authorization: "Bearer valid-token" } } as VercelRequest;
    const result = await verifyAuth(req);
    expect(result).toEqual({
      id: "user-123",
      tier: "free",
      isPro: false,
    });
  });

  it("returns pro tier user", async () => {
    setupSupabaseMock("user-123", "pro");
    const req = { headers: { authorization: "Bearer valid-token" } } as VercelRequest;
    const result = await verifyAuth(req);
    expect(result).toEqual({
      id: "user-123",
      tier: "pro",
      isPro: true,
    });
  });

  it("returns team tier user", async () => {
    setupSupabaseMock("user-123", "team");
    const req = { headers: { authorization: "Bearer valid-token" } } as VercelRequest;
    const result = await verifyAuth(req);
    expect(result).toEqual({
      id: "user-123",
      tier: "team",
      isPro: true,
    });
  });
});

// ─── CORS / Preflight tests ──────────────────────────────────────────────────

describe("handlePreflight", () => {
  it("returns true and sends 204 for OPTIONS", () => {
    const req = { method: "OPTIONS", headers: {} } as VercelRequest;
    const setHeader = vi.fn();
    const status = vi.fn(() => ({ end: vi.fn() }));
    const res = { setHeader, status } as unknown as VercelResponse;

    const result = handlePreflight(req, res);
    expect(result).toBe(true);
    expect(status).toHaveBeenCalledWith(204);
  });

  it("returns false for non-OPTIONS and sets CORS headers", () => {
    const req = { method: "POST", headers: {} } as VercelRequest;
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as VercelResponse;

    const result = handlePreflight(req, res);
    expect(result).toBe(false);
    expect(setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", expect.any(String));
  });
});

describe("setCorsHeaders", () => {
  it("sets default origin when env is not set", () => {
    delete process.env.ALLOWED_ORIGIN;
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as VercelResponse;

    setCorsHeaders(res);
    expect(setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "https://cutsheet.xyz");
  });

  it("uses ALLOWED_ORIGIN env when set", () => {
    process.env.ALLOWED_ORIGIN = "https://staging.cutsheet.xyz";
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as VercelResponse;

    setCorsHeaders(res);
    expect(setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "https://staging.cutsheet.xyz");
  });
});
