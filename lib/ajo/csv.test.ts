import { describe, expect, it } from "vitest";
import { cell, fileSafe, scheduleCsv } from "./csv";

describe("schedule CSV", () => {
  const turns = [
    { turn: 1, date: "2026-12-01", name: "Ọ̀pẹ́", amount: 160000, pinned: true },
    { turn: 2, date: "2027-01-01", name: 'Tolu "T" Ade', amount: 160000, pinned: false },
    { turn: 3, date: "2027-02-01", name: "=HYPERLINK(1)", amount: 160000, pinned: false },
  ];
  const csv = scheduleCsv(turns);
  const lines = csv.replace(/^﻿/, "").trimEnd().split("\r\n");

  it("has a header and one row per turn, in order", () => {
    expect(csv.startsWith("﻿")).toBe(true);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe("Turn,Date,Day,Collects,Amount (NGN),Agreed before the draw");
    expect(lines[1]).toBe("1,2026-12-01,Tuesday,Ọ̀pẹ́,160000,Yes");
  });
  it("quotes and defuses awkward names", () => {
    expect(lines[2]).toContain('"Tolu ""T"" Ade"');
    expect(lines[3]).toContain(`"'=HYPERLINK(1)"`);
    expect(cell("-5")).toBe(`"'-5"`);
    expect(cell(42)).toBe("42");
  });
  it("makes safe file names", () => {
    expect(fileSafe("Ikoyi Wives / Monthly!")).toBe("Ikoyi-Wives-Monthly");
    expect(fileSafe("ọ̀")).toBe("ajo");
  });
});
