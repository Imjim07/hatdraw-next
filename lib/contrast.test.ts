import { describe, expect, it } from "vitest";
import { contrast } from "./contrast";
import { PALETTE as P } from "./palette";

// Text/background pairs the design allows for normal text. Each must stay ≥ 4.5:1,
// so a future colour edit can't quietly break readability.
const ALLOWED: [string, string, string][] = [
  ["ink on cloud", P.ink, P.cloud],
  ["indigo on cloud", P.indigo, P.cloud],
  ["cloud on indigo", P.cloud, P.indigo],
  ["cloud on ink", P.cloud, P.ink],
  ["ink on indigo mist", P.ink, P.indigoMist],
  ["indigo on indigo mist", P.indigo, P.indigoMist],
  ["ink on persimmon", P.ink, P.persimmon],
  ["ink on palm gold", P.ink, P.palmGold],
  ["indigo on palm gold", P.indigo, P.palmGold],
  ["palm gold on indigo", P.palmGold, P.indigo],
  ["palm gold on ink", P.palmGold, P.ink],
  ["persimmon on ink", P.persimmon, P.ink],
  ["muted text on cloud", P.textMuted, P.cloud],
  ["muted text on indigo mist", P.textMuted, P.indigoMist],
  ["muted text on indigo", P.textMutedOnIndigo, P.indigo],
  ["danger on cloud", P.danger, P.cloud],
];
// Pairs the design forbids for normal text (kept here so nobody "fixes" them into use).
const FORBIDDEN: [string, string, string][] = [
  ["cloud on persimmon", P.cloud, P.persimmon],
  ["indigo on persimmon", P.indigo, P.persimmon],
  ["persimmon on cloud", P.persimmon, P.cloud],
  ["palm gold on cloud", P.palmGold, P.cloud],
  ["persimmon on indigo", P.persimmon, P.indigo],
];

describe("palette contrast", () => {
  it.each(ALLOWED)("%s is at least 4.5:1", (_, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(FORBIDDEN)("%s stays below 4.5:1 (never used for text)", (_, fg, bg) => {
    expect(contrast(fg, bg)).toBeLessThan(4.5);
  });
});
