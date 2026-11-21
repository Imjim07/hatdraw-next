// SERVER ONLY. The rules for paid draws and Year passes. Every amount comes from PRICING
// on the server; the browser never sets a price. Payment rows hold no email or name.
import { PRICING } from "./config";
import { kobo, tierById, tierFor, type Tier } from "./pricing";
import { paidExactly, verifyTransaction } from "./paystack";
import { hashCode, newPassCode, newReference, normalisePassCode, paymentStore, type PaymentRow, type PaymentStore } from "./payments";

export type Fail = { ok: false; code: string; status: number; [k: string]: unknown };
const fail = (code: string, status: number, extra: object = {}): Fail => ({ ok: false, code, status, ...extra });

const DAY = 86_400_000;

/** If Paystack has confirmed the exact amount, move a pending row to paid. Returns the row as it now stands. */
export async function settle(s: PaymentStore, row: PaymentRow, at: Date): Promise<PaymentRow> {
  if (row.status !== "pending") return row;
  if (!paidExactly(await verifyTransaction(row.reference), row.amount_kobo)) return row;
  await s.markPaid(row.reference, at);
  return { ...row, status: "paid", paid_at: at.toISOString() };
}

// ---- starting a payment ----
export type Started = { ok: true; reference: string; amountKobo: number; kind: "draw" | "upgrade" | "pass"; tier: Tier | null };

export async function startPayment(input: { kind: "draw" | "pass"; peopleCount?: number; upgradeFrom?: string }, at = new Date()): Promise<Started | Fail> {
  const s = paymentStore();
  if (!s) return fail("payments_off", 503);
  const reference = newReference();

  if (input.kind === "pass") {
    const amount = kobo(PRICING.YEAR_PASS.price);
    await s.create({ reference, kind: "pass", tier: null, max_people: PRICING.YEAR_PASS.maxPeople, amount_kobo: amount, upgrade_of: null }, at);
    return { ok: true, reference, amountKobo: amount, kind: "pass", tier: null };
  }

  const people = Number(input.peopleCount);
  let tier: Tier | null;
  try { tier = tierFor(people); } catch { return fail("too_many", 400); }
  if (!tier) return fail("free", 400);

  if (input.upgradeFrom) {
    // Names were added after paying: pay only the difference to the bigger tier.
    let base = await s.get(input.upgradeFrom);
    if (!base || base.kind !== "draw") return fail("payment_not_found", 404);
    base = await settle(s, base, at);
    if (base.status !== "paid") return fail(base.status === "used" ? "payment_used" : "payment_pending", 402);
    if (people <= base.max_people) return fail("no_upgrade_needed", 400);
    const amount = kobo(tier.price) - base.amount_kobo;
    await s.create({ reference, kind: "upgrade", tier: tier.id, max_people: tier.max, amount_kobo: amount, upgrade_of: base.reference }, at);
    return { ok: true, reference, amountKobo: amount, kind: "upgrade", tier };
  }

  const amount = kobo(tier.price);
  await s.create({ reference, kind: "draw", tier: tier.id, max_people: tier.max, amount_kobo: amount, upgrade_of: null }, at);
  return { ok: true, reference, amountKobo: amount, kind: "draw", tier };
}

// ---- unlocking one draw with a payment ----
export type Unlock = { ok: true; claim: () => Promise<boolean>; release: () => Promise<void> };

/**
 * Checks that `reference` pays for a draw of `people`. Nothing is used up yet: the caller
 * runs the draw, then calls claim() (one reference, one draw). If the draw fails on our
 * side the reference is untouched and can be retried.
 */
export async function unlockWithPayment(reference: string, people: number, at = new Date()): Promise<Unlock | Fail> {
  const s = paymentStore();
  if (!s) return fail("payments_off", 503);
  let row = await s.get(reference);
  if (!row || row.kind === "pass") return fail("payment_not_found", 402);
  if (row.status === "used") return fail("payment_used", 402);
  row = await settle(s, row, at);
  if (row.status !== "paid") return fail("payment_pending", 402);

  let base: PaymentRow | null = null;
  if (row.kind === "upgrade") {
    base = await s.get(row.upgrade_of!);
    if (!base) return fail("payment_not_found", 402);
    base = await settle(s, base, at);
    if (base.status !== "paid") return fail(base.status === "used" ? "payment_used" : "payment_pending", 402);
  }

  if (people > row.max_people) {
    // Crossed into a bigger tier after paying: offer to pay the difference.
    let next: Tier | null = null;
    try { next = tierFor(people); } catch { return fail("too_many", 400); }
    const paidKobo = row.amount_kobo + (base?.amount_kobo ?? 0);
    if (row.kind === "upgrade") return fail("payment_too_small", 402); // one top-up per draw keeps this simple
    return fail("tier_upgrade", 402, { upgradeFrom: reference, tier: next, extraKobo: kobo(next!.price) - paidKobo });
  }

  const refs = base ? [row.reference, base.reference] : [row.reference];
  return {
    ok: true,
    claim: async () => {
      const done: string[] = [];
      for (const r of refs) {
        if (!(await s.claim(r, at))) { for (const d of done) await s.release(d); return false; }
        done.push(r);
      }
      return true;
    },
    release: async () => { for (const r of refs) await s.release(r); },
  };
}

// ---- Year passes ----
export type PassInfo = { expiresAt: string; drawsLeft: number };
const info = (expires_at: string, draws_used: number): PassInfo => ({ expiresAt: expires_at, drawsLeft: Math.max(0, PRICING.YEAR_PASS.maxDraws - draws_used) });

/**
 * After a pass payment: makes the code and shows it once. Only the hash is stored. If the
 * webhook got there first it made the pass with an unshown code; this replaces that code.
 * A code already shown can only be replaced by support (scripts/reissue-pass.ts).
 */
export async function issuePass(reference: string, at = new Date()): Promise<({ ok: true; code: string } & PassInfo) | Fail> {
  const s = paymentStore();
  if (!s) return fail("payments_off", 503);
  let row = await s.get(reference);
  if (!row || row.kind !== "pass") return fail("payment_not_found", 404);
  row = await settle(s, row, at);
  if (row.status === "pending") return fail("payment_pending", 402);

  const code = newPassCode();
  const existing = await s.passByReference(reference);
  if (existing) {
    if (existing.code_issued) return fail("already_issued", 409);
    await s.setPassCode(reference, hashCode(code));
    return { ok: true, code, ...info(existing.expires_at, existing.draws_used) };
  }
  const expires = new Date(at.getTime() + PRICING.YEAR_PASS.days * DAY).toISOString();
  await s.createPass({ code_hash: hashCode(code), payment_reference: reference, expires_at: expires, code_issued: true }, at);
  await s.claim(reference, at); // the payment has bought its pass
  return { ok: true, code, ...info(expires, 0) };
}

/** The webhook's half: a paid pass gets its row (with a code nobody has seen yet). */
export async function ensurePassRow(s: PaymentStore, reference: string, at: Date) {
  if (await s.passByReference(reference)) return;
  const expires = new Date(at.getTime() + PRICING.YEAR_PASS.days * DAY).toISOString();
  await s.createPass({ code_hash: hashCode(newPassCode()), payment_reference: reference, expires_at: expires, code_issued: false }, at);
}

/** Expiry and draws left, for "Year pass active until …". The same refusal for any code that doesn't work. */
export async function passStatus(rawCode: string, at = new Date()): Promise<({ ok: true } & PassInfo) | Fail> {
  const s = paymentStore();
  const code = normalisePassCode(rawCode);
  if (!s || !code) return fail("pass_invalid", 403);
  const p = await s.passByHash(hashCode(code));
  if (!p || Date.parse(p.expires_at) <= at.getTime() || p.draws_used >= PRICING.YEAR_PASS.maxDraws) return fail("pass_invalid", 403);
  return { ok: true, ...info(p.expires_at, p.draws_used) };
}

/** Uses one draw of a pass. Call after the draw itself has been worked out. */
export async function spendPassDraw(rawCode: string, people: number, at = new Date()): Promise<({ ok: true } & PassInfo) | Fail> {
  const s = paymentStore();
  const code = normalisePassCode(rawCode);
  if (!s || !code) return fail("pass_invalid", 403);
  if (people > PRICING.YEAR_PASS.maxPeople) return fail("pass_too_big", 403);
  const r = await s.claimPassDraw(hashCode(code), people, at);
  if (!r) return fail("pass_invalid", 403); // wrong, expired or used up: one answer for all
  return { ok: true, ...info(r.expires_at, r.draws_used) };
}

export { tierById };
