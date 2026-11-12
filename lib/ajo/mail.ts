// SERVER ONLY. Reminder emails through the Resend send API (batch endpoint).
// Without RESEND_API_KEY nothing is sent. With the in-memory test store, emails
// are recorded in an outbox instead (that's how tests "mock" Resend).
import { createHmac, timingSafeEqual } from "node:crypto";
import { isMemoryStore } from "./store";

export type Email = { to: string; subject: string; text: string; unsubscribeUrl: string };

/** Resend's free tier allows 100 emails a day; override with REMINDER_DAILY_LIMIT. */
export const dailyLimit = () => Math.max(0, Number(process.env.REMINDER_DAILY_LIMIT) || 100);

const g = globalThis as unknown as { __ajoOutbox?: Email[] };
export const testOutbox = () => (g.__ajoOutbox ??= []);

/** Sends up to 100 emails per call. Returns how many were accepted. */
export async function sendBatch(emails: Email[]): Promise<number> {
  if (!emails.length) return 0;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (isMemoryStore()) { testOutbox().push(...emails); return emails.length; }
    console.warn("[ajo] RESEND_API_KEY is not set; reminders were not sent");
    return 0;
  }
  const from = process.env.REMINDER_FROM_EMAIL || "HatDraw <reminders@hatdraw.app>";
  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(chunk.map((e) => ({
        from, to: [e.to], subject: e.subject, text: e.text,
        headers: { "List-Unsubscribe": `<${e.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }))),
    });
    if (!res.ok) { console.error(`[ajo] Resend batch failed with status ${res.status}`); break; }
    sent += chunk.length;
  }
  return sent;
}

// Unsubscribe links can't carry the member's personal token (only its hash is
// stored), so they carry the member id signed with a server secret. The
// signature only allows switching reminders off.
function unsubKey() {
  const s = process.env.CRON_SECRET || process.env.DRAW_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production" && !isMemoryStore()) throw new Error("Set CRON_SECRET to sign unsubscribe links.");
    return "hatdraw-dev-only-unsubscribe";
  }
  return "ajo-unsubscribe:" + s;
}
export const signMember = (memberId: string) => createHmac("sha256", unsubKey()).update(memberId).digest("base64url");
export function verifyMember(memberId: string, sig: string) {
  const a = Buffer.from(signMember(memberId)), b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
