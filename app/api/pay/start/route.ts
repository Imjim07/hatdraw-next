import { PAYWALL_MODE } from "@/lib/config";
import { startPayment } from "@/lib/paywall";
import { common } from "@/lib/copy/common";
import { santa } from "@/lib/copy/santa";

// Starts a payment. The server picks the tier and the amount from PRICING and makes the
// reference; the browser only passes how many people are in the circle (or that it wants a
// Year pass). Stored: reference, kind, tier, max people, amount, status. No email, no name.
// { kind: "draw", peopleCount, upgradeFrom? } | { kind: "pass" } → { reference, amountKobo, tier }
const json = (b: object, status = 200) => Response.json(b, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (PAYWALL_MODE !== "live" || !process.env.PAYSTACK_SECRET_KEY) return json({ ok: false, error: santa.errors.paymentsOff }, 503);
  let body: { kind?: unknown; peopleCount?: unknown; upgradeFrom?: unknown };
  try { body = await req.json(); } catch { return json({ ok: false, error: common.invalidRequest }, 400); }
  const kind = body.kind === "pass" ? "pass" : "draw";
  try {
    const r = await startPayment({ kind, peopleCount: Number(body.peopleCount), upgradeFrom: typeof body.upgradeFrom === "string" ? body.upgradeFrom.slice(0, 40) : undefined });
    if (!r.ok) return json({ ok: false, code: r.code, error: r.code === "too_many" ? santa.errors.tooMany : santa.errors.needsPayment }, r.status);
    return json({ ok: true, reference: r.reference, amountKobo: r.amountKobo, kind: r.kind, tier: r.tier ? { id: r.tier.id, label: r.tier.label } : null });
  } catch {
    console.error("[pay] start_failed");
    return json({ ok: false, error: common.somethingWrong }, 500);
  }
}
