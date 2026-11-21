import { issuePass } from "@/lib/paywall";
import { common } from "@/lib/copy/common";
import { santa } from "@/lib/copy/santa";

// After paying for a Year pass: { reference } → the code, shown once. Only its hash is kept.
const json = (b: object, status = 200) => Response.json(b, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  let reference = "";
  try { reference = String((await req.json())?.reference ?? "").slice(0, 40); } catch { return json({ ok: false, error: common.invalidRequest }, 400); }
  try {
    const r = await issuePass(reference);
    if (!r.ok) return json({ ok: false, code: r.code, error: r.code === "already_issued" ? santa.pass.alreadyIssued : r.code === "payment_pending" ? santa.errors.paymentPending : santa.pass.issueFailed }, r.status);
    return json({ ok: true, code: r.code, expiresAt: r.expiresAt, drawsLeft: r.drawsLeft });
  } catch {
    console.error("[pass] issue_failed");
    return json({ ok: false, error: santa.pass.issueFailed }, 500);
  }
}
