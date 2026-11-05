// SERVER ONLY. Verifies a Paystack transaction by reference.
// TODO (needs Supabase): store used references so one payment
// can't unlock more than one draw.
export async function verifyPayment(reference: string, minNaira: number): Promise<boolean> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !reference) return false;
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" },
    );
    if (!res.ok) return false;
    const j = await res.json();
    return (
      j?.status === true &&
      j.data?.status === "success" &&
      j.data?.currency === "NGN" &&
      Number(j.data?.amount) >= minNaira * 100 // Paystack amounts are in kobo
    );
  } catch {
    return false;
  }
}
