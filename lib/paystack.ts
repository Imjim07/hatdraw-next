// SERVER ONLY. Verifies a Paystack transaction by reference.
// Returns only what we keep (see lib/payments.ts): the reference, the amount and the
// status. Paystack's response also carries the payer's email and card details; they
// are never read, stored or logged here.
export type VerifiedPayment = { reference: string; amountNaira: number; status: "success" };

export async function verifyPayment(reference: string, minNaira: number): Promise<VerifiedPayment | null> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !reference) return null;
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const kobo = Number(j?.data?.amount);
    const paid =
      j?.status === true &&
      j.data?.status === "success" &&
      j.data?.currency === "NGN" &&
      kobo >= minNaira * 100; // Paystack amounts are in kobo
    return paid ? { reference, amountNaira: Math.floor(kobo / 100), status: "success" } : null;
  } catch {
    return null;
  }
}
