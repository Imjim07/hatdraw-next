import { randomInt } from "node:crypto";
import { draw } from "@/lib/draw";
import { seal } from "@/lib/seal";
import { PRICING, PAYWALL_MODE } from "@/lib/config";
import { verifyPayment } from "@/lib/paystack";
import type { DrawRequest, DrawResponse, EventInfo, RevealPayload } from "@/lib/types";

const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const fail = (error: string, status = 400, extra: object = {}) =>
  Response.json({ ok: false, error, ...extra } satisfies DrawResponse, { status });

export async function POST(req: Request) {
  let body: DrawRequest;
  try { body = await req.json(); } catch { return fail("Invalid request."); }

  const event: EventInfo = {
    name: clip(body.event?.name, 60),
    kind: ["friends", "family", "company"].includes(body.event?.kind) ? body.event.kind : "friends",
    budget: clip(body.event?.budget, 9).replace(/\D/g, ""),
    date: /^\d{4}-\d{2}-\d{2}$/.test(body.event?.date ?? "") ? body.event.date : "",
    where: clip(body.event?.where, 90),
    note: clip(body.event?.note, 200),
  };
  if (!event.name) return fail("Give your exchange a name.");

  const people = [...new Map(
    (Array.isArray(body.people) ? body.people : [])
      .map((p) => clip(p, 40)).filter(Boolean)
      .map((p) => [p.toLowerCase(), p] as const),
  ).values()];
  if (people.length < 3) return fail("You need at least 3 people.");
  if (people.length > PRICING.MAX_PEOPLE) return fail(`Maximum ${PRICING.MAX_PEOPLE} people per draw.`);

  const names = new Set(people);
  const ex = (Array.isArray(body.ex) ? body.ex : [])
    .filter((p): p is [string, string] => Array.isArray(p) && names.has(p[0]) && names.has(p[1]) && p[0] !== p[1]);

  // Paywall is enforced here, on the server, not in the browser.
  let demoUnlock = false;
  if (people.length > PRICING.FREE_LIMIT) {
    if (PAYWALL_MODE === "live") {
      const paid = await verifyPayment(clip(body.reference, 100), PRICING.ONE_TIME);
      if (!paid) return fail("This draw needs payment.", 402, { needsPayment: true });
    } else {
      demoUnlock = true;
    }
  }

  const result = draw(people, ex, body.circle !== false, (n) => randomInt(n));
  if (!result) return fail("Those keep-apart rules make a fair draw impossible. Remove one and try again.", 422);

  const map = new Map(result.pairs);
  const givers = people.map((g) => ({
    name: g,
    token: seal({ v: 1, e: event, g, r: map.get(g)! } satisfies RevealPayload),
  }));

  const res: DrawResponse = {
    ok: true,
    circle: result.circle,
    demoUnlock,
    givers,
    ...(body.blind === false ? { pairs: result.pairs } : {}),
  };
  return Response.json(res, { headers: { "Cache-Control": "no-store" } });
}
