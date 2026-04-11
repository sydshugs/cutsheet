/**
 * Supabase RLS verification script.
 * Queries pg_tables and pg_policies via helper RPC functions to verify
 * that every user-facing table has Row Level Security with auth.uid() policies.
 *
 * PREREQUISITE: Run this SQL in your Supabase SQL Editor first:
 *
 *   CREATE OR REPLACE FUNCTION public.rls_check_tables()
 *   RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
 *     SELECT json_agg(row_to_json(t))
 *     FROM (
 *       SELECT tablename, rowsecurity
 *       FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
 *     ) t;
 *   $$;
 *
 *   CREATE OR REPLACE FUNCTION public.rls_check_policies()
 *   RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
 *     SELECT json_agg(row_to_json(t))
 *     FROM (
 *       SELECT tablename, policyname, cmd, qual, with_check
 *       FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname
 *     ) t;
 *   $$;
 *
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 * Run: npm run verify:rls
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// ── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env or environment."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Expected RLS configuration ──────────────────────────────────────────────

interface ExpectedPolicy {
  cmd: string;       // SELECT, INSERT, UPDATE, DELETE, or ALL
  authPattern: string; // Substring that must appear in qual or with_check
  description: string;
}

interface TableExpectation {
  policies: ExpectedPolicy[];
  notes?: string;
}

const EXPECTED: Record<string, TableExpectation> = {
  profiles: {
    policies: [
      { cmd: "SELECT", authPattern: "auth.uid()", description: "Users read own profile" },
      { cmd: "UPDATE", authPattern: "auth.uid()", description: "Users update own profile" },
      { cmd: "INSERT", authPattern: "auth.uid()", description: "Users insert own profile" },
    ],
  },
  user_profiles: {
    policies: [
      { cmd: "SELECT", authPattern: "auth.uid()", description: "Users read own user_profile" },
      { cmd: "UPDATE", authPattern: "auth.uid()", description: "Users update own user_profile" },
      { cmd: "INSERT", authPattern: "auth.uid()", description: "Users insert own user_profile" },
    ],
  },
  analyses: {
    policies: [
      { cmd: "SELECT", authPattern: "auth.uid()", description: "Users read own analyses" },
      { cmd: "INSERT", authPattern: "auth.uid()", description: "Users insert own analyses" },
      { cmd: "DELETE", authPattern: "auth.uid()", description: "Users delete own analyses" },
    ],
    notes: "May also have anon SELECT for public share links — acceptable",
  },
  suggestion_feedback: {
    policies: [
      { cmd: "SELECT", authPattern: "auth.uid()", description: "Users read own feedback" },
      { cmd: "INSERT", authPattern: "auth.uid()", description: "Users insert own feedback" },
    ],
  },
  beta_codes: {
    policies: [],
    notes: "Service-role only — no user-facing policies needed",
  },
};

// ── Types ───────────────────────────────────────────────────────────────────

interface TableRow { tablename: string; rowsecurity: boolean }
interface PolicyRow {
  tablename: string;
  policyname: string;
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Supabase RLS Verification ===\n");

  const { data: tablesRaw, error: tablesErr } = await supabase.rpc("rls_check_tables");
  const { data: policiesRaw, error: policiesErr } = await supabase.rpc("rls_check_policies");

  if (tablesErr || policiesErr) {
    console.error("Cannot query RLS status. Create the helper functions first.\n");
    console.error("Run this SQL in your Supabase SQL Editor:\n");
    console.error(`  CREATE OR REPLACE FUNCTION public.rls_check_tables()
  RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
    SELECT json_agg(row_to_json(t))
    FROM (SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename) t;
  $$;

  CREATE OR REPLACE FUNCTION public.rls_check_policies()
  RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
    SELECT json_agg(row_to_json(t))
    FROM (SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname) t;
  $$;\n`);
    if (tablesErr) console.error("tables error:", tablesErr.message);
    if (policiesErr) console.error("policies error:", policiesErr.message);
    process.exit(1);
  }

  const tables: TableRow[] = tablesRaw ?? [];
  const policies: PolicyRow[] = policiesRaw ?? [];

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // ── Check 1: RLS enabled on expected tables ───────────────────────────
  console.log("--- RLS Enabled ---\n");

  for (const tableName of Object.keys(EXPECTED)) {
    const table = tables.find((t) => t.tablename === tableName);
    if (!table) {
      console.log(`  SKIP  ${tableName} — not found in database`);
      warnings++;
      continue;
    }
    if (table.rowsecurity) {
      console.log(`  PASS  ${tableName} — RLS enabled`);
      passed++;
    } else {
      console.log(`  FAIL  ${tableName} — RLS DISABLED`);
      failed++;
    }
  }

  // ── Check 2: Unexpected tables without RLS ────────────────────────────
  console.log("\n--- Other Tables Without RLS ---\n");

  const knownTables = new Set(Object.keys(EXPECTED));
  for (const table of tables) {
    if (knownTables.has(table.tablename)) continue;
    if (!table.rowsecurity) {
      console.log(`  WARN  ${table.tablename} — RLS disabled (not in expected list)`);
      warnings++;
    }
  }
  if (warnings === 0) console.log("  (none)");

  // ── Check 3: Policy verification ──────────────────────────────────────
  console.log("\n--- Policy Verification ---\n");

  for (const [tableName, expectation] of Object.entries(EXPECTED)) {
    const tablePolicies = policies.filter((p) => p.tablename === tableName);

    if (expectation.policies.length === 0) {
      console.log(`  PASS  ${tableName} — service-role only, no user policies needed`);
      passed++;
      continue;
    }

    if (tablePolicies.length === 0) {
      console.log(`  FAIL  ${tableName} — NO policies found (expected ${expectation.policies.length})`);
      failed++;
      continue;
    }

    for (const expected of expectation.policies) {
      const match = tablePolicies.find((p) => {
        const cmdMatch = p.cmd === expected.cmd || p.cmd === "ALL";
        const authMatch =
          (p.qual?.includes(expected.authPattern)) ||
          (p.with_check?.includes(expected.authPattern));
        return cmdMatch && authMatch;
      });

      if (match) {
        console.log(`  PASS  ${tableName}.${expected.cmd} — ${expected.description}`);
        passed++;
      } else {
        console.log(`  FAIL  ${tableName}.${expected.cmd} — MISSING: ${expected.description}`);
        failed++;
      }
    }

    // Warn about overly permissive policies (qual = true without auth.uid)
    for (const policy of tablePolicies) {
      const qualIsTrue = policy.qual === "true" || policy.qual === "(true)";
      const checkHasAuth = policy.with_check?.includes("auth.uid()");
      if (qualIsTrue && !checkHasAuth && tableName !== "analyses") {
        console.log(`  WARN  ${tableName} — permissive policy "${policy.policyname}" (qual=true)`);
        warnings++;
      }
    }

    if (expectation.notes) {
      console.log(`  NOTE  ${expectation.notes}`);
    }
  }

  // ── Check 4: Dangerous patterns ───────────────────────────────────────
  console.log("\n--- Dangerous Patterns ---\n");

  let dangerousFound = false;
  for (const policy of policies) {
    if (
      (policy.cmd === "DELETE" || policy.cmd === "UPDATE") &&
      !policy.qual?.includes("auth.uid()") &&
      !EXPECTED[policy.tablename]?.notes?.includes("service-role")
    ) {
      console.log(
        `  WARN  ${policy.tablename}.${policy.cmd} — "${policy.policyname}" lacks auth.uid() guard`
      );
      warnings++;
      dangerousFound = true;
    }
  }
  if (!dangerousFound) console.log("  (none found)");

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log(`${"=".repeat(50)}\n`);

  if (failed > 0) {
    console.log("ACTION: Fix failures by running supabase/fix_rls_policies.sql");
    console.log("in your Supabase SQL Editor, then re-run: npm run verify:rls\n");
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
