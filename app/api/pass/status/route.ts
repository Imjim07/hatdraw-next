import { passStatus } from "@/lib/paywall";
import { santa } from "@/lib/copy/santa";

// { code } → expiry and draws left. Any code that doesn't work gets the same answer, so
// this can't be used to find out whether a code exists.
export async function POST(req: Request) {
  let code = "";
  try { code = String((await req.json())?.code ?? "").slice(0, 40); } catch { /* treated as invalid */ }
  const r = await passStatus(code).catch(() => null);
  if (!r || !r.ok) return Response.json({ ok: false, error: santa.paywall.passInvalid }, { status: 403, headers: { "Cache-Control": "no-store" } });
  return Response.json({ ok: true, expiresAt: r.expiresAt, drawsLeft: r.drawsLeft }, { headers: { "Cache-Control": "no-store" } });
}
