import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BRAND, CONTACT, emailFrom } from "@/lib/config";
import { copy } from "@/lib/copy";

// Every string in the copy, including what each placeholder function returns.
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (typeof v === "function") {
    const args = [1, 2, 3, 4, 5].map(() => new Proxy({}, { get: (_, k) => (k === Symbol.toPrimitive ? () => "1" : typeof k === "string" && /date/i.test(k) ? "2026-12-01" : "Tolu") }));
    try { strings((v as (...a: unknown[]) => unknown)(...args), out); } catch { /* needs real arguments */ }
    try { strings((v as (...a: unknown[]) => unknown)("Tolu", "Ada", "2026-12-01", 3, "2026-12-08"), out); } catch { /* ignore */ }
    try { strings((v as (...a: unknown[]) => unknown)(3, 2), out); } catch { /* ignore */ }
  } else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}
const all = strings(copy);
const sources = ["lib/copy.ts", ...readdirSync("lib/copy").map((f) => `lib/copy/${f}`)].map((f) => readFileSync(f, "utf8"));

describe("copy", () => {
  it("never words the use cases like gambling (raffle, lottery, betting, jackpot, odds)", () => {
    const uc = strings(copy.landing.useCases);
    expect(uc.length).toBeGreaterThan(20);
    for (const t of uc) expect(t, t).not.toMatch(/\b(raffles?|lotter(y|ies)|bet(s|ting)?|jackpots?|odds)\b/i);
  });

  it("has a few hundred strings", () => expect(all.length).toBeGreaterThan(300));

  it("stores Yoruba text in NFC form", () => {
    for (const s of all) expect(s, s).toBe(s.normalize("NFC"));
    for (const src of sources) expect(src === src.normalize("NFC")).toBe(true);
    expect(BRAND.name).toBe(BRAND.name.normalize("NFC"));
    expect(BRAND.display).toBe(BRAND.display.normalize("NFC"));
  });

  it("never names the old brands or the hat", () => {
    for (const s of all) {
      expect(s, s).not.toMatch(/hatdraw|cadara/i);
      expect(s, s).not.toMatch(/\bhats?\b/i);
    }
  });

  it("types the brand only through BRAND", () => {
    for (const src of sources) expect(src).not.toMatch(/Kádàrá|Kadara\b/);
  });

  it("uses Pidgin only where the deck does", () => {
    const pidgin = all.filter((s) => /\b(don land|shake am|nobody go)\b/i.test(s));
    expect(new Set(pidgin)).toEqual(new Set(["E don land! Everyone's matched."]));
  });

  it("speaks of organisers, not admins or organizers", () => {
    for (const s of all) expect(s, s).not.toMatch(/\b(organizer|admin)\b/i);
  });
});

describe("email addresses", () => {
  it("are all on the brand's domain", () => {
    for (const a of Object.values(CONTACT)) expect(a).toMatch(/@kadaradraw\.com$/);
    expect(emailFrom()).toMatch(/<[^>]+@kadaradraw\.com>$/);
  });
});
