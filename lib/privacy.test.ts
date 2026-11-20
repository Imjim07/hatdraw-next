import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { claimPayment, memoryPayments } from "./payments";

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });

describe("Secret Santa stays stateless", () => {
  // Every console call in the draw and reveal routes, with its arguments.
  const calls = ["app/api/draw", "app/api/reveal"].flatMap(files).flatMap((f) =>
    [...readFileSync(f, "utf8").matchAll(/console\.(log|info|warn|error|debug)\(([^;]*)\)/g)].map((m) => ({ f, args: m[2] })));

  it("never logs the body, names, tokens or the decrypted payload", () => {
    for (const c of calls) expect(c.args, c.f).not.toMatch(/\b(body|names?|people|tokens?|payload|data|givers?|pairs?|req)\b/i);
  });

  it("never writes Santa data to a database", () => {
    for (const f of ["app/api/draw", "app/api/reveal"].flatMap(files)) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/supabase|\.insert\(|\.from\(/i);
    }
  });
});

describe("Paystack records", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("hold the reference, amount, status, draw id and time, and nothing about the payer", async () => {
    vi.stubEnv("SUPABASE_URL", ""); vi.stubEnv("NODE_ENV", "test");
    expect(await claimPayment({ reference: "ref_1", amount_naira: 700, status: "success", draw_id: "d1" })).toBe("ok");
    const row = memoryPayments().find((p) => p.reference === "ref_1")!;
    expect(Object.keys(row).sort()).toEqual(["amount_naira", "created_at", "draw_id", "reference", "status"]);
  });

  it("let one payment unlock only one draw", async () => {
    vi.stubEnv("SUPABASE_URL", ""); vi.stubEnv("NODE_ENV", "test");
    await claimPayment({ reference: "ref_2", amount_naira: 700, status: "success", draw_id: "d2" });
    expect(await claimPayment({ reference: "ref_2", amount_naira: 700, status: "success", draw_id: "d3" })).toBe("used");
  });

  it("have no email column in any table", () => {
    for (const f of readdirSync("supabase/migrations")) {
      const sql = readFileSync(join("supabase/migrations", f), "utf8");
      const payments = sql.match(/create table payments \(([\s\S]*?)\n\);/);
      if (payments) expect(payments[1]).not.toMatch(/email|name|card/i);
    }
  });
});
