// SERVER ONLY. Secret tokens for admin and member links.
// 32 random bytes as base64url; only the SHA-256 hash is ever stored.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const newToken = () => randomBytes(32).toString("base64url");

/** Short random id for public URLs (unguessable, URL-safe). */
export const newPublicId = () => randomBytes(12).toString("base64url");

export const hashToken = (token: string) => createHash("sha256").update(token, "utf8").digest("hex");

/** Timing-safe check of a presented token against a stored hash. */
export function tokenMatches(token: string, storedHash: string): boolean {
  if (!token || !storedHash) return false;
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Tokens arrive from the URL fragment; reject anything that isn't the right shape before hashing. */
export const looksLikeToken = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{43}$/.test(t);
