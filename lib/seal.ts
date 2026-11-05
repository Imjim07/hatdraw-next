// SERVER ONLY. Encrypts reveal-link payloads with AES-256-GCM so nobody
// (including the organizer) can read a match from the link itself.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(): Buffer {
  const s = process.env.DRAW_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DRAW_SECRET is not set. Generate one with: openssl rand -base64 32");
    }
    return createHash("sha256").update("hatdraw-dev-only-secret").digest();
  }
  return createHash("sha256").update(s).digest();
}

export function seal(obj: unknown): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64url");
}

export function unseal<T>(token: string): T | null {
  try {
    const b = Buffer.from(token, "base64url");
    if (b.length < 29) return null;
    const d = createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}
