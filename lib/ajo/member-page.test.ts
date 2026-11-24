import { describe, expect, it } from "vitest";
import { countdown, firstName, lastSwap, maskEmail, payoutIcs, previewRows, thisTurn } from "./member-page";
import { ajo } from "@/lib/copy/ajo";
import type { PublicTurn } from "./types";

const T = (turn: number, date: string, name: string): PublicTurn => ({ turn, date, name, amount: 600_000, pinned: false });
const turns = [T(1, "2026-11-25", "Ada"), T(2, "2026-12-02", "Tunde Bakare"), T(3, "2026-12-09", "Chidi"), T(4, "2026-12-16", "Femi"), T(5, "2026-12-23", "Gbenga")];

describe("countdown", () => {
  it("counts days, then tomorrow, today and past", () => {
    expect(countdown("2026-11-24", "2026-12-02")).toEqual({ kind: "days", days: 8 });
    expect(countdown("2026-12-01", "2026-12-02")).toEqual({ kind: "tomorrow" });
    expect(countdown("2026-12-02", "2026-12-02")).toEqual({ kind: "today" });
    expect(countdown("2026-12-03", "2026-12-02")).toEqual({ kind: "past" });
  });
  it("words each state, and never says paid or collected for the past", () => {
    const m = ajo.member;
    expect(m.countdown({ kind: "days", days: 8 })).toBe("in 8 days");
    expect(m.countdown({ kind: "tomorrow" })).toBe("tomorrow");
    expect(m.todayIsYours).toBe("Today is your turn");
    expect(m.wasOn("Wed, 2 Dec 2026")).toBe("Your turn was on Wed, 2 Dec 2026");
    expect(m.wasOn("x")).not.toMatch(/paid|collected/i);
  });
});

describe("contribution", () => {
  it("is the stored amount each member pays per turn; the payout is that times the members", () => {
    expect(ajo.member.yourContribution(60_000)).toBe("Your contribution: ₦60,000");
    expect(ajo.member.youNext(60_000)).toBe("You collect next. Everyone contributes ₦60,000, you included.");
  });
});

describe("this turn and the preview", () => {
  it("picks the next turn that isn't mine", () => {
    expect(thisTurn(turns, "Tunde Bakare", "2026-11-24").turn?.name).toBe("Ada");
    const next = thisTurn(turns, "Tunde Bakare", "2026-11-26");
    expect(next.mineNext).toBe(true);
    expect(thisTurn(turns, "Ada", "2026-12-24").finished).toBe(true);
  });
  it("shows the next three, plus my own row when it's further out", () => {
    expect(previewRows(turns, "Gbenga", "2026-11-24").map((t) => t.turn)).toEqual([1, 2, 3, 5]);
    expect(previewRows(turns, "Chidi", "2026-11-24").map((t) => t.turn)).toEqual([1, 2, 3]);
  });
  it("greets by first name", () => expect(firstName("  Tunde Bakare ")).toBe("Tunde"));
});

describe("maskEmail", () => {
  it("keeps the first character and the domain", () => {
    expect(maskEmail("tunde@gmail.com")).toBe("t••••@gmail.com");
    expect(maskEmail("a@b.ng")).toBe("a••••@b.ng");
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});

describe("lastSwap", () => {
  it("finds the latest swap I was in", () => {
    expect(lastSwap([{ a: "Ada", b: "Tunde", at: "2026-11-05" }, { a: "Femi", b: "Chidi", at: "2026-11-06" }], "Tunde")).toEqual({ with: "Ada", at: "2026-11-05" });
    expect(lastSwap([], "Tunde")).toBeNull();
  });
});

describe("payoutIcs", () => {
  it("is one all-day event on the payout date, escaped", () => {
    const ics = payoutIcs({ uid: "abc-turn-2@x", date: "2026-12-02", summary: "Lekki, Wives ajo: you collect ₦600,000", description: "x; y", stamp: "2026-11-24T10:00:00.000Z" });
    expect(ics).toContain("DTSTART;VALUE=DATE:20261202\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20261203\r\n");
    expect(ics).toContain("SUMMARY:Lekki\\, Wives ajo: you collect ₦600\\,000\r\n");
    expect(ics).toContain(String.raw`DESCRIPTION:x\; y`);
    expect(ics).toContain("DTSTAMP:20261124T100000Z");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
  it("crosses month and year ends", () => {
    expect(payoutIcs({ uid: "u", date: "2026-12-31", summary: "s", description: "d", stamp: "2026-11-24T10:00:00Z" })).toContain("DTEND;VALUE=DATE:20270101");
  });
});
