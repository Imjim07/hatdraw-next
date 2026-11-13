import { describe, expect, it } from "vitest";
import { ANY, BANDS, bandOf, budgetLabel, matches, parseFilters, toggleCompare, toQuery, widen } from "./filters";

const gift = (price: number, forWhom: ("anyone" | "her" | "him" | "kids" | "colleague" | "couple")[] = ["anyone"], category = "home" as const) => ({ price, forWhom, category });

describe("budget bands → price filter", () => {
  const band = (id: string) => { const b = BANDS.find((x) => x.id === id)!; return { ...ANY, min: b.min, max: b.max }; };

  it("Under ₦10k includes ₦10,000 and below", () => {
    expect(matches(gift(9999), band("under-10k"))).toBe(true);
    expect(matches(gift(10000), band("under-10k"))).toBe(true);
    expect(matches(gift(10001), band("under-10k"))).toBe(false);
  });
  it("₦10–25k is above ₦10,000 up to ₦25,000", () => {
    expect(matches(gift(10000), band("10-25k"))).toBe(false);
    expect(matches(gift(10001), band("10-25k"))).toBe(true);
    expect(matches(gift(25000), band("10-25k"))).toBe(true);
    expect(matches(gift(25001), band("10-25k"))).toBe(false);
  });
  it("₦25–50k and ₦50k+ meet at ₦50,000 without overlapping", () => {
    expect(matches(gift(50000), band("25-50k"))).toBe(true);
    expect(matches(gift(50000), band("50k-plus"))).toBe(false);
    expect(matches(gift(50001), band("50k-plus"))).toBe(true);
    expect(matches(gift(9_000_000), band("50k-plus"))).toBe(true);
  });
  it("Any matches every price", () => {
    for (const p of [1, 10000, 60000]) expect(matches(gift(p), band("any"))).toBe(true);
  });
  it("every band round-trips through the URL", () => {
    for (const b of BANDS) {
      const f = { ...ANY, min: b.min, max: b.max };
      expect(bandOf(parseFilters(Object.fromEntries(new URLSearchParams(toQuery(f).slice(1))))), b.id).toBe(b.id);
    }
  });
});

describe("query-string parsing", () => {
  it("reads a shared filtered view", () => {
    expect(parseFilters({ max: "15000", for: "her", cat: "beauty" })).toEqual({ ...ANY, max: 15000, forWhom: "her", category: "beauty" });
  });
  it("bad values fall back to Any", () => {
    for (const v of ["abc", "-5", "0", "1.5", "1e5", "", "999999999", " 100"]) expect(parseFilters({ max: v }).max, v).toBeNull();
    expect(parseFilters({ for: "grandma" }).forWhom).toBeNull();
    expect(parseFilters({ cat: "cars" }).category).toBeNull();
    expect(parseFilters({ min: "nope" }).min).toBeNull();
  });
  it("an impossible range keeps only the ceiling", () => {
    expect(parseFilters({ min: "30000", max: "20000" })).toMatchObject({ min: null, max: 20000 });
  });
  it("repeated params use the first value", () => {
    expect(parseFilters({ max: ["5000", "9000"] }).max).toBe(5000);
  });
  it("compare keeps up to four valid, unique slugs", () => {
    expect(parseFilters({ compare: "a,b,a,Bad Slug,c,d,e" }).compare).toEqual(["a", "b", "c", "d"]);
  });
  it("a custom ceiling (from a reveal's budget) has no chip but a label", () => {
    const f = parseFilters({ max: "15000" });
    expect(bandOf(f)).toBeNull();
    expect(budgetLabel(f)).toBe("Under ₦15,000");
  });
});

describe("for whom", () => {
  it("'anyone' gifts show for her, him, colleagues and couples, but not kids", () => {
    expect(matches(gift(5000, ["anyone"]), { ...ANY, forWhom: "her" })).toBe(true);
    expect(matches(gift(5000, ["anyone"]), { ...ANY, forWhom: "kids" })).toBe(false);
    expect(matches(gift(5000, ["him"]), { ...ANY, forWhom: "her" })).toBe(false);
  });
});

describe("widening an empty budget", () => {
  it("steps to the next band edge, then Any", () => {
    expect(widen({ ...ANY, max: 10000 })?.max).toBe(25000);
    expect(widen({ ...ANY, max: 15000 })?.max).toBe(25000);
    expect(widen({ ...ANY, max: 50000 })?.max).toBeNull();
    expect(widen(ANY)).toBeNull();
  });
});

describe("compare", () => {
  it("toggles and keeps the newest four", () => {
    expect(toggleCompare(["a"], "a")).toEqual([]);
    expect(toggleCompare(["a", "b", "c", "d"], "e")).toEqual(["b", "c", "d", "e"]);
  });
  it("Any has an empty query", () => {
    expect(toQuery(ANY)).toBe("");
  });
});
