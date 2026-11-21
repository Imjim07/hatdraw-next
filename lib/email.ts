// SERVER ONLY. One email through Resend: from EMAIL_FROM, replies to support. The address
// is used to send and nothing else: never stored, never logged. Without RESEND_API_KEY,
// tests and local development record emails in an in-memory outbox instead.
import { CONTACT, emailFrom } from "./config";

export type OutEmail = { to: string; subject: string; text: string };
const g = globalThis as unknown as { __outbox?: OutEmail[] };
export const outbox = () => (g.__outbox ??= []);

export async function sendEmail(e: OutEmail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production" && process.env.AJO_STORE !== "memory") { console.warn("[email] RESEND_API_KEY is not set"); return false; }
    outbox().push(e);
    return true;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: emailFrom(), to: [e.to], reply_to: CONTACT.support, subject: e.subject, text: e.text }),
    });
    if (!res.ok) console.error(`[email] resend_failed ${res.status}`);
    return res.ok;
  } catch {
    console.error("[email] resend_unreachable");
    return false;
  }
}
