// SERVER ONLY. Paystack: verifying a transaction, and checking a webhook's signature.
// Paystack's responses also carry the payer's email and card details; they are never
// read, stored or logged here.
import { createHmac, timingSafeEqual } from "node:crypto";

export type Verified = { reference: string; status: string; amountKobo: number; currency: string };

/** Asks Paystack about a reference. Null if Paystack can't be reached or doesn't know it. */
export async function verifyTransaction(reference: string): Promise<Verified | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !reference) return null;
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }, cache: "no-store",
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (j?.status !== true || !j.data) return null;
    return { reference, status: String(j.data.status), amountKobo: Number(j.data.amount), currency: String(j.data.currency) };
  } catch {
    return null;
  }
}

/** True only for a successful NGN payment of exactly the amount the server asked for. */
export const paidExactly = (v: Verified | null, amountKobo: number) =>
  !!v && v.status === "success" && v.currency === "NGN" && v.amountKobo === amountKobo;

/** Paystack signs each webhook body with HMAC SHA-512 of the secret key (x-paystack-signature). */
export function validWebhookSignature(rawBody: string, signature: string | null, secret = process.env.PAYSTACK_SECRET_KEY): boolean {
  if (!secret || !signature) return false;
  const want = Buffer.from(createHmac("sha512", secret).update(rawBody).digest("hex"));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
}
