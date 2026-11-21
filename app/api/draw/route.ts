import { randomInt } from "node:crypto";
import { draw } from "@/lib/draw";
import { seal } from "@/lib/seal";
import { MAX_PEOPLE, PAYWALL_MODE } from "@/lib/config";
import { tierFor } from "@/lib/pricing";
import { unlockWithPayment, spendPassDraw, type Fail, type PassInfo, type Unlock } from "@/lib/paywall";
import { common } from "@/lib/copy/common";
import { santa } from "@/lib/copy/santa";
import type { DrawRequest, DrawResponse, EventInfo, RevealPayload } from "@/lib/types";

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const fail = (error: string, status = 400, extra: object = {}) =>
  Response.json({ ok: false, error, ...extra } satisfies DrawResponse, { status });

const MESSAGES: Record<string, string> = {
  payment_not_found: santa.errors.paymentNotFound,
  payment_used: santa.errors.paymentUsed,
  payment_pending: santa.errors.paymentPending,
  payment_too_small: santa.errors.needsPayment,
  payments_off: santa.errors.paymentsOff,
  too_many: santa.errors.tooMany,
  pass_invalid: santa.paywall.passInvalid,
  pass_too_big: santa.paywall.passTooBig,
};
function payFail(f: Fail, people = 0) {
  const { ok: _ok, status, code, ...extra } = f;
  void _ok;
  const tier = extra.tier as { label: string } | undefined;
  const error = code === "tier_upgrade" && tier ? santa.paywall.upgrade(people, tier.label, Number(extra.extraKobo) / 100) : MESSAGES[code] ?? santa.errors.needsPayment;
  return fail(error, status, { needsPayment: true, code, ...extra });
}

export async function POST(req: Request) {
  let body: DrawRequest;
  try { body = await req.json(); } catch { return fail(common.invalidRequest); }

  const event: EventInfo = {
    name: clip(body.event?.name, 60),
    kind: ["friends", "family", "company"].includes(body.event?.kind) ? body.event.kind : "friends",
    budget: clip(body.event?.budget, 9).replace(/\D/g, ""),
    date: /^\d{4}-\d{2}-\d{2}$/.test(body.event?.date ?? "") ? body.event.date : "",
    where: clip(body.event?.where, 90),
    note: clip(body.event?.note, 200),
  };
  if (!event.name) return fail(santa.errors.noName);

  const people = [...new Map(
    (Array.isArray(body.people) ? body.people : [])
      .map((p) => clip(p, 40)).filter(Boolean)
      .map((p) => [p.toLowerCase(), p] as const),
  ).values()];
  if (people.length < 3) return fail(santa.errors.tooFew);
  if (people.length > MAX_PEOPLE) return fail(santa.errors.tooMany);

  const names = new Set(people);
  const ex = (Array.isArray(body.ex) ? body.ex : [])
    .filter((p): p is [string, string] => Array.isArray(p) && names.has(p[0]) && names.has(p[1]) && p[0] !== p[1]);

  // Paywall, enforced here on the server. The price comes from PRICING (lib/pricing.ts);
  // the browser only passes a Paystack reference or a Year pass code.
  let demoUnlock = false, unlock: Unlock | null = null, passCode = "", pass: PassInfo | undefined;
  if (tierFor(people.length)) {
    if (PAYWALL_MODE !== "live") demoUnlock = true;
    else if (body.passCode) passCode = clip(body.passCode, 40);
    else {
      const u = await unlockWithPayment(clip(body.reference, 40), people.length);
      if (!u.ok) return payFail(u, people.length);
      unlock = u;
    }
  }

  // Work the draw out first: it changes nothing, so a failure here leaves the payment unused.
  const result = draw(people, ex, body.circle !== false, (n) => randomInt(n));
  if (!result) return fail(santa.errors.rulesTooStrict, 422);

  // Then use up the payment (one reference, one draw) or one draw of the pass.
  if (unlock && !(await unlock.claim())) return payFail({ ok: false, code: "payment_used", status: 402 });
  if (passCode) {
    const r = await spendPassDraw(passCode, people.length);
    if (!r.ok) return payFail(r, people.length);
    pass = { expiresAt: r.expiresAt, drawsLeft: r.drawsLeft };
  }

  const map = new Map(result.pairs);
  const givers = people.map((g) => ({
    name: g,
    token: seal({ v: 1, e: event, g, r: map.get(g)! } satisfies RevealPayload),
  }));

  const res: DrawResponse = {
    ok: true,
    circle: result.circle,
    demoUnlock,
    ...(pass ? { pass } : {}),
    givers,
    ...(body.blind === false ? { pairs: result.pairs } : {}),
  };
  return Response.json(res, { headers: { "Cache-Control": "no-store" } });
}
