// SERVER ONLY. Payments and Year passes. No email, name or card details are ever stored:
// a payment is a reference, what it buys and its status; a pass is the SHA-256 of its code.
//
// Production: Supabase (service-role key). Tests and local development without Supabase:
// an in-memory store (AJO_STORE=memory or NODE_ENV=test), so the flows can be exercised
// end to end.
import { createHash, randomInt } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PRICING } from "./config";

export type PaymentKind = "draw" | "upgrade" | "pass";
export type PaymentStatus = "pending" | "paid" | "used";
export type PaymentRow = {
  reference: string; kind: PaymentKind; tier: "mid" | "big" | null; max_people: number; amount_kobo: number;
  status: PaymentStatus; upgrade_of: string | null; created_at: string; paid_at: string | null; used_at: string | null;
};
export type PassRow = { code_hash: string; payment_reference: string; expires_at: string; draws_used: number; code_issued: boolean; created_at: string };

// ---- references and codes ----
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const pick = (n: number, rnd = randomInt) => Array.from({ length: n }, () => CODE_ALPHABET[rnd(CODE_ALPHABET.length)]).join("");
/** KDR- plus 10 characters: a Paystack reference. */
export const newReference = (rnd = randomInt) => "KDR-" + pick(10, rnd);
export const REFERENCE = /^KDR-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$/;
/** KDR-XXXX-XXXX-XXXX-XXXX: a Year pass code. */
export const newPassCode = (rnd = randomInt) => "KDR-" + [0, 1, 2, 3].map(() => pick(4, rnd)).join("-");
/** Accepts the code however it's typed: any case, spaces, missing dashes. */
export function normalisePassCode(raw: string): string | null {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = s.startsWith("KDR") ? s.slice(3) : s;
  if (!new RegExp(`^[${CODE_ALPHABET}]{16}$`).test(body)) return null;
  return "KDR-" + body.match(/.{4}/g)!.join("-");
}
export const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");

// ---- the store ----
export interface PaymentStore {
  create(row: Omit<PaymentRow, "status" | "created_at" | "paid_at" | "used_at">, at: Date): Promise<void>;
  get(reference: string): Promise<PaymentRow | null>;
  /** pending → paid. */
  markPaid(reference: string, at: Date): Promise<void>;
  /** paid → used. False if it wasn't paid (already used, or never paid). */
  claim(reference: string, at: Date): Promise<boolean>;
  /** used → paid, when a draw couldn't finish after its payment was claimed. */
  release(reference: string): Promise<void>;

  passByReference(reference: string): Promise<PassRow | null>;
  passByHash(hash: string): Promise<PassRow | null>;
  createPass(row: Omit<PassRow, "draws_used" | "created_at">, at: Date): Promise<void>;
  /** A new code for an existing pass (same expiry, same draws used). */
  setPassCode(reference: string, hash: string): Promise<void>;
  /** Uses one draw, atomically. Null if the pass is missing, expired, used up, or too small. */
  claimPassDraw(hash: string, people: number, at: Date): Promise<{ expires_at: string; draws_used: number } | null>;
}

const g = globalThis as unknown as { __payments?: { pay: Map<string, PaymentRow>; pass: PassRow[] } };
export const memoryPayments = () => (g.__payments ??= { pay: new Map<string, PaymentRow>(), pass: [] as PassRow[] });

function memoryStore(): PaymentStore {
  // Read the store on every call (tests reset it; modules may be loaded more than once).
  const db = { get pay() { return memoryPayments().pay; }, get pass() { return memoryPayments().pass; } };
  return {
    async create(row, at) { db.pay.set(row.reference, { ...row, status: "pending", created_at: at.toISOString(), paid_at: null, used_at: null }); },
    async get(ref) { const r = db.pay.get(ref); return r ? { ...r } : null; },
    async markPaid(ref, at) { const r = db.pay.get(ref); if (r && r.status === "pending") Object.assign(r, { status: "paid", paid_at: at.toISOString() }); },
    async claim(ref, at) { const r = db.pay.get(ref); if (!r || r.status !== "paid") return false; Object.assign(r, { status: "used", used_at: at.toISOString() }); return true; },
    async release(ref) { const r = db.pay.get(ref); if (r && r.status === "used") Object.assign(r, { status: "paid", used_at: null }); },
    async passByReference(ref) { const p = db.pass.find((x) => x.payment_reference === ref); return p ? { ...p } : null; },
    async passByHash(h) { const p = db.pass.find((x) => x.code_hash === h); return p ? { ...p } : null; },
    async createPass(row, at) { db.pass.push({ ...row, draws_used: 0, created_at: at.toISOString() }); },
    async setPassCode(ref, h) { const p = db.pass.find((x) => x.payment_reference === ref); if (p) Object.assign(p, { code_hash: h, code_issued: true }); },
    async claimPassDraw(h, people, at) {
      const p = db.pass.find((x) => x.code_hash === h);
      const Y = PRICING.YEAR_PASS;
      if (!p || Date.parse(p.expires_at) <= at.getTime() || p.draws_used >= Y.maxDraws || people > Y.maxPeople) return null;
      p.draws_used++;
      return { expires_at: p.expires_at, draws_used: p.draws_used };
    },
  };
}

function supabaseStore(db: SupabaseClient): PaymentStore {
  const must = <T>(r: { data: T | null; error: { message: string } | null }) => { if (r.error) throw new Error("payments_db_failed"); return r.data as T; };
  return {
    async create(row) { must(await db.from("payments").insert(row)); },
    async get(ref) { return must(await db.from("payments").select("*").eq("reference", ref).maybeSingle()) as PaymentRow | null; },
    async markPaid(ref, at) { must(await db.from("payments").update({ status: "paid", paid_at: at.toISOString() }).eq("reference", ref).eq("status", "pending")); },
    async claim(ref, at) {
      const rows = must(await db.from("payments").update({ status: "used", used_at: at.toISOString() }).eq("reference", ref).eq("status", "paid").select("reference")) as unknown[];
      return rows.length > 0;
    },
    async release(ref) { must(await db.from("payments").update({ status: "paid", used_at: null }).eq("reference", ref).eq("status", "used")); },
    async passByReference(ref) { return must(await db.from("year_passes").select("code_hash,payment_reference,expires_at,draws_used,code_issued,created_at").eq("payment_reference", ref).maybeSingle()) as PassRow | null; },
    async passByHash(h) { return must(await db.from("year_passes").select("code_hash,payment_reference,expires_at,draws_used,code_issued,created_at").eq("code_hash", h).maybeSingle()) as PassRow | null; },
    async createPass(row) { must(await db.from("year_passes").insert(row)); },
    async setPassCode(ref, h) { must(await db.from("year_passes").update({ code_hash: h, code_issued: true }).eq("payment_reference", ref)); },
    async claimPassDraw(h, people, at) {
      const Y = PRICING.YEAR_PASS;
      const rows = must(await db.rpc("claim_year_pass", { p_code_hash: h, p_people: people, p_max_people: Y.maxPeople, p_max_draws: Y.maxDraws, p_now: at.toISOString() })) as { expires_at: string; draws_used: number }[];
      return rows[0] ?? null;
    },
  };
}

let cached: PaymentStore | null = null;
/** The store, or null when payments can't be recorded (no database configured). */
export function paymentStore(): PaymentStore | null {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return (cached = supabaseStore(createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })));
  if (process.env.AJO_STORE === "memory" || process.env.NODE_ENV === "test") return (cached = memoryStore());
  return null;
}
/** Tests: start from an empty store. */
export function resetMemoryPayments() { delete g.__payments; cached = null; }
