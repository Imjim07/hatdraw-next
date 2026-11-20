import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SAMPLE_PRODUCTS } from "./samples";

// The production seed must never publish products: every row stays active = false,
// and the in-memory test store mirrors exactly those rows.
const sql = readFileSync(join(__dirname, "../../supabase/seed/gift_products.sql"), "utf8");
const rows = [...sql.matchAll(/^\s*\('([a-z0-9-]+)', '([^']+)', '(?:[^']|'')*', (\d+), '\{[^}]*\}', '(\w+)', '\{[^}]*\}', '\{[^}]*\}', (\d+), (true|false), (true|false), \d+, '([0-9a-f-]{36})'\)[,;]$/gm)];

describe("gift seed", () => {
  it("has six sample rows", () => {
    expect(rows).toHaveLength(6);
  });
  it("every row is inactive", () => {
    for (const r of rows) expect(r[7], r[1]).toBe("false");
  });
  it("every product is clearly a sample", () => {
    for (const r of rows) expect(r[2]).toMatch(/^\[Sample\] /);
  });
  it("matches the in-memory sample products", () => {
    expect(rows.map((r) => [r[1], r[2], Number(r[3]), r[4], Number(r[5]), r[6] === "true", r[8]]))
      .toEqual(SAMPLE_PRODUCTS.map((p) => [p.slug, p.name, p.price, p.category, p.leadTimeDays, p.inStock, p.vendor.id]));
  });
  it("every sample vendor is inactive and clearly a sample", () => {
    const vendors = [...sql.matchAll(/^\s*\('([0-9a-f-]{36})', '([a-z0-9-]+)', '((?:[^']|'')*)', '(\d+)', '\{[^}]*\}', '[^']*', '[^']*', (?:now\(\)|null), (true|false)\)[,;]?$/gm)];
    expect(vendors).toHaveLength(2);
    for (const v of vendors) { expect(v[3]).toMatch(/^\[Sample\] /); expect(v[5]).toBe("false"); }
  });
});
