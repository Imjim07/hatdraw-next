import { randomInt } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  REDRAW_WINDOW_MS, applySwaps, buildTurns, canRedraw, drawOrder, lagosToday, nextTurnIndex,
  payoutAmount, payoutDates, redrawLabel, swapExpired, validatePins,
} from "./logic";

const rng = (n: number) => randomInt(n);
const members = ["a", "b", "c", "d", "e", "f", "g", "h"];

describe("drawOrder", () => {
  it("always respects pins", () => {
    const pins = [{ member: "c", turn: 1 }, { member: "h", turn: 5 }];
    for (let i = 0; i < 2000; i++) {
      const o = drawOrder(members, pins, rng);
      expect(o[0]).toBe("c");
      expect(o[4]).toBe("h");
      expect([...o].sort()).toEqual([...members].sort());
    }
  });

  it("over 10,000 draws, each unpinned member lands in each free turn about equally often", () => {
    const six = ["a", "b", "c", "d", "e", "f"];
    const pins = [{ member: "a", turn: 2 }, { member: "b", turn: 6 }];
    const free = [1, 3, 4, 5]; // 1-based turns left for c, d, e, f
    const counts = new Map<string, number>();
    const N = 10_000;
    for (let i = 0; i < N; i++) {
      drawOrder(six, pins, rng).forEach((m, t) => counts.set(`${m}@${t + 1}`, (counts.get(`${m}@${t + 1}`) ?? 0) + 1));
    }
    const expected = N / free.length; // 2,500; σ ≈ 43, so ±10% is ~6σ
    for (const m of ["c", "d", "e", "f"]) for (const t of free) {
      const c = counts.get(`${m}@${t}`) ?? 0;
      expect(c).toBeGreaterThan(expected * 0.9);
      expect(c).toBeLessThan(expected * 1.1);
    }
    expect(counts.get("a@2")).toBe(N);
    expect(counts.get("b@6")).toBe(N);
  });

  it("validates pins", () => {
    expect(() => validatePins(members, [{ member: "a", turn: 0 }])).toThrow(/between 1 and 8/);
    expect(() => validatePins(members, [{ member: "a", turn: 9 }])).toThrow(/between 1 and 8/);
    expect(() => validatePins(members, [{ member: "a", turn: 1.5 }])).toThrow();
    expect(() => validatePins(members, [{ member: "a", turn: 2 }, { member: "b", turn: 2 }])).toThrow(/pinned twice/);
    expect(() => validatePins(members, [{ member: "a", turn: 2 }, { member: "a", turn: 3 }])).toThrow(/one turn/);
    expect(() => validatePins(members, [{ member: "z", turn: 2 }])).toThrow(/isn't in the group/);
    expect(() => validatePins(members, [])).not.toThrow();
  });

  it("can pin everyone", () => {
    const pins = members.map((m, i) => ({ member: m, turn: members.length - i }));
    expect(drawOrder(members, pins, rng)).toEqual([...members].reverse());
  });
});

describe("payoutDates", () => {
  it("weekly and biweekly step by 7 and 14 days, across month and year ends", () => {
    expect(payoutDates("2026-12-24", "weekly", 3)).toEqual(["2026-12-24", "2026-12-31", "2027-01-07"]);
    expect(payoutDates("2026-02-20", "biweekly", 3)).toEqual(["2026-02-20", "2026-03-06", "2026-03-20"]);
  });
  it("monthly keeps the same day, falling back to the month's last day", () => {
    expect(payoutDates("2027-01-31", "monthly", 4)).toEqual(["2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30"]);
  });
  it("handles leap years", () => {
    expect(payoutDates("2028-01-31", "monthly", 2)).toEqual(["2028-01-31", "2028-02-29"]);
    expect(payoutDates("2028-02-29", "monthly", 13).at(-1)).toBe("2029-02-28");
    expect(payoutDates("2028-02-22", "weekly", 2)).toEqual(["2028-02-22", "2028-02-29"]);
  });
  it("rolls over the year for monthly", () => {
    expect(payoutDates("2026-11-30", "monthly", 4)).toEqual(["2026-11-30", "2026-12-30", "2027-01-30", "2027-02-28"]);
  });
});

describe("amounts, swaps, schedule", () => {
  it("payout is amount × members", () => {
    expect(payoutAmount(20_000, 8)).toBe(160_000);
  });
  it("applies swaps in order", () => {
    expect(applySwaps(["a", "b", "c", "d"], [{ a: "a", b: "c" }])).toEqual(["c", "b", "a", "d"]);
    expect(applySwaps(["a", "b", "c", "d"], [{ a: "a", b: "c" }, { a: "a", b: "d" }])).toEqual(["c", "b", "d", "a"]);
    expect(applySwaps(["a", "b"], [{ a: "a", b: "zz" }])).toEqual(["a", "b"]);
    expect(applySwaps(["a", "b"], [{ a: "a", b: "b" }, { a: "b", b: "a" }])).toEqual(["a", "b"]);
  });
  it("labels a pin only while the member is still in their agreed turn", () => {
    const names = new Map([["a", "Ada"], ["b", "Bola"]]);
    const t = buildTurns(["a", "b"], names, new Map([["a", 1]]), ["2027-01-01", "2027-02-01"], 5000);
    expect(t).toEqual([
      { turn: 1, date: "2027-01-01", name: "Ada", amount: 10_000, pinned: true },
      { turn: 2, date: "2027-02-01", name: "Bola", amount: 10_000, pinned: false },
    ]);
    expect(buildTurns(["b", "a"], names, new Map([["a", 1]]), ["x", "y"], 1)[1].pinned).toBe(false);
  });
  it("finds the next turn", () => {
    const d = ["2027-01-01", "2027-02-01", "2027-03-01"];
    expect(nextTurnIndex(d, "2026-12-01")).toBe(0);
    expect(nextTurnIndex(d, "2027-02-01")).toBe(1);
    expect(nextTurnIndex(d, "2027-03-02")).toBe(-1);
  });
  it("words redraw counts", () => {
    expect([0, 1, 2, 5].map(redrawLabel)).toEqual(["", "redrawn once", "redrawn twice", "redrawn 5 times"]);
  });
});

describe("redraw window", () => {
  const drawnAt = "2026-11-12T15:32:00.000Z";
  const at = (ms: number) => new Date(Date.parse(drawnAt) + ms);
  it("allows instant redraws for 10 minutes only", () => {
    expect(canRedraw({ mode: "instant", drawn_at: drawnAt }, at(0))).toBe(true);
    expect(canRedraw({ mode: "instant", drawn_at: drawnAt }, at(REDRAW_WINDOW_MS - 1))).toBe(true);
    expect(canRedraw({ mode: "instant", drawn_at: drawnAt }, at(REDRAW_WINDOW_MS))).toBe(false);
    expect(canRedraw({ mode: "instant", drawn_at: drawnAt }, at(-1))).toBe(false);
  });
  it("never allows live redraws", () => {
    expect(canRedraw({ mode: "live", drawn_at: drawnAt }, at(1000))).toBe(false);
  });
  it("expires pending swaps after 72 hours", () => {
    expect(swapExpired(drawnAt, at(72 * 3600_000 - 1))).toBe(false);
    expect(swapExpired(drawnAt, at(72 * 3600_000))).toBe(true);
  });
  it("uses Nigeria's date", () => {
    expect(lagosToday(new Date("2026-11-12T23:30:00Z"))).toBe("2026-11-13");
    expect(lagosToday(new Date("2026-11-12T22:59:00Z"))).toBe("2026-11-12");
  });
});
