import { describe, expect, it } from "vitest";
import { PRIVATE_PATH, gtmLoader } from "./analytics";

describe("analytics", () => {
  it("never runs on pages opened from a private link", () => {
    for (const p of ["/r", "/r/", "/ajo/AbCdEfGhIjKlMnOp/me", "/ajo/AbCdEfGhIjKlMnOp/admin", "/ajo/unsubscribe"]) expect(PRIVATE_PATH.test(p), p).toBe(true);
  });
  it("runs everywhere else", () => {
    for (const p of ["/", "/draw", "/ajo", "/ajo/AbCdEfGhIjKlMnOp", "/gifts", "/gifts/sample-adire-scarf", "/vendors", "/privacy", "/terms", "/robots"]) expect(PRIVATE_PATH.test(p), p).toBe(false);
  });
  it("loads the container", () => {
    expect(gtmLoader("GTM-TEST")).toContain('gtm.js?id="+"GTM-TEST"');
    expect(() => new Function(gtmLoader("GTM-TEST"))).not.toThrow(); // valid JavaScript
  });
});
