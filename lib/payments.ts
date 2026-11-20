// SERVER ONLY. Records each verified Big circle payment, so one payment unlocks one draw.
// Stored: the Paystack reference, the amount, the status, the draw's internal id and the
// time. Never the payer's email, name or card details.
import { createClient } from "@supabase/supabase-js";

export type PaymentRow = { reference: string; amount_naira: number; status: "success"; draw_id: string; created_at: string };

const g = globalThis as unknown as { __payments?: Map<string, PaymentRow> };
const memory = () => (g.__payments ??= new Map());

/**
 * Claims a payment reference for a draw. "used": that reference already unlocked a draw.
 * "unavailable": there's no database to record it in (the draw still goes ahead, as before
 * payments were recorded).
 */
export async function claimPayment(p: Omit<PaymentRow, "created_at">, at = new Date()): Promise<"ok" | "used" | "unavailable"> {
  const row: PaymentRow = { ...p, created_at: at.toISOString() };
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const res = await db.from("payments").insert(row);
    if (res.error?.code === "23505") return "used"; // primary key: the reference
    if (res.error) { console.error("[payments] record_failed"); return "unavailable"; }
    return "ok";
  }
  if (process.env.AJO_STORE === "memory" || process.env.NODE_ENV === "test") {
    if (memory().has(row.reference)) return "used";
    memory().set(row.reference, row);
    return "ok";
  }
  return "unavailable";
}

/** Test hook: what the in-memory store holds. */
export const memoryPayments = () => [...memory().values()];
