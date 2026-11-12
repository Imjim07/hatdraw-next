import { describe, expect, it } from "vitest";
import { hashToken, looksLikeToken, newPublicId, newToken, tokenMatches } from "./tokens";

describe("tokens", () => {
  it("are 32 random bytes as base64url", () => {
    const t = newToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(t, "base64url")).toHaveLength(32);
    expect(newToken()).not.toBe(t);
    expect(looksLikeToken(t)).toBe(true);
  });
  it("store only a SHA-256 hash and compare it timing-safely", () => {
    const t = newToken();
    const h = hashToken(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain(t);
    expect(tokenMatches(t, h)).toBe(true);
    expect(tokenMatches(newToken(), h)).toBe(false);
    expect(tokenMatches("", h)).toBe(false);
    expect(tokenMatches(t, "abc")).toBe(false);
  });
  it("reject malformed tokens before hashing", () => {
    expect(looksLikeToken("short")).toBe(false);
    expect(looksLikeToken("x".repeat(43) + "!")).toBe(false);
    expect(looksLikeToken(42)).toBe(false);
  });
  it("public ids are url-safe and unguessable", () => {
    expect(newPublicId()).toMatch(/^[A-Za-z0-9_-]{16}$/);
  });
});
