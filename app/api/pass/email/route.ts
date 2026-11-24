import { passStatus } from "@/lib/paywall";
import { normalisePassCode } from "@/lib/payments";
import { sendEmail } from "@/lib/email";
import { passHtml } from "@/lib/pass-email";
import { dayMonthYear } from "@/lib/config";
import { santa } from "@/lib/copy/santa";

// Emails a Year pass code to the address the buyer types. The address is used to send and
// then dropped: never stored, never logged. Only a working code can be sent.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (b: object, status = 200) => Response.json(b, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  let raw: { code?: unknown; email?: unknown } = {};
  try { raw = await req.json(); } catch { /* checked below */ }
  const email = String(raw.email ?? "").trim().slice(0, 254);
  const code = normalisePassCode(String(raw.code ?? ""));
  if (!EMAIL.test(email)) return json({ ok: false, error: santa.pass.badEmail }, 400);
  const status = code ? await passStatus(code).catch(() => null) : null;
  if (!code || !status || !status.ok) return json({ ok: false, error: santa.paywall.passInvalid }, 403);
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
  const date = dayMonthYear(status.expiresAt);
  const sent = await sendEmail({ to: email, subject: santa.pass.emailSubject, text: santa.pass.emailBody(code, date, site), html: passHtml({ site, code, date }) });
  return sent ? json({ ok: true }) : json({ ok: false, error: santa.pass.sendFailed }, 502);
}
