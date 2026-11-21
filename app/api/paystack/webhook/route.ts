import { validWebhookSignature } from "@/lib/paystack";
import { paymentStore } from "@/lib/payments";
import { ensurePassRow } from "@/lib/paywall";

// Paystack calls this when a payment succeeds, so a payment is recorded as paid even if the
// buyer's browser closes. Signed with HMAC SHA-512 of PAYSTACK_SECRET_KEY; anything else is
// refused. The body's customer details (email etc.) are never read or stored.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) return new Response("Bad signature", { status: 401 });
  let event: { event?: string; data?: { reference?: string; amount?: number; currency?: string; status?: string } };
  try { event = JSON.parse(raw); } catch { return new Response("Bad body", { status: 400 }); }
  if (event.event !== "charge.success" || !event.data?.reference) return new Response("ok");

  const s = paymentStore();
  if (!s) return new Response("ok");
  const at = new Date();
  try {
    const row = await s.get(event.data.reference);
    // Only the exact amount the server asked for counts.
    if (!row || row.status !== "pending" || event.data.currency !== "NGN" || Number(event.data.amount) !== row.amount_kobo || event.data.status !== "success") return new Response("ok");
    await s.markPaid(row.reference, at);
    if (row.kind === "pass") await ensurePassRow(s, row.reference, at);
    return new Response("ok");
  } catch {
    console.error("[paystack] webhook_failed");
    return new Response("Retry", { status: 500 }); // Paystack retries
  }
}
