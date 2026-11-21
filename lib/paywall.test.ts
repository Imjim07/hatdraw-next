import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PRICING } from "./config";
import { memoryPayments, resetMemoryPayments } from "./payments";

// Paystack is faked: verify answers with whatever amount "was paid" for each reference.
const paidKobo = new Map<string, number>();
function fakePaystack() {
  vi.stubGlobal("fetch", async (url: string) => {
    const ref = decodeURIComponent(String(url).split("/").pop() ?? "");
    const amount = paidKobo.get(ref);
    return new Response(JSON.stringify(amount == null ? { status: false } : { status: true, data: { status: "success", currency: "NGN", amount } }), { status: amount == null ? 404 : 200 });
  });
}
const names = (n: number) => Array.from({ length: n }, (_, i) => `Person ${i + 1}`);
const DAY = 86_400_000;

async function drawRoute() {
  vi.resetModules();
  return (await import("@/app/api/draw/route")).POST;
}
async function draw(people: number, extra: object) {
  const POST = await drawRoute();
  const res = await POST(new Request("https://x.test/api/draw", { method: "POST", body: JSON.stringify({ event: { name: "Office" }, people: names(people), ex: [], circle: false, blind: true, ...extra }) }));
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_PAYWALL_MODE", "live"); vi.stubEnv("PAYSTACK_SECRET_KEY", "sk_test_x");
  vi.stubEnv("SUPABASE_URL", ""); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", ""); vi.stubEnv("DRAW_SECRET", "test-draw-secret");
  resetMemoryPayments(); paidKobo.clear(); fakePaystack();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("paying for one draw", () => {
  it("the server sets the amount from the circle size", async () => {
    const { startPayment } = await import("./paywall");
    const mid = await startPayment({ kind: "draw", peopleCount: 20 });
    const big = await startPayment({ kind: "draw", peopleCount: 60 });
    expect(mid.ok && mid.amountKobo).toBe(150_000);
    expect(big.ok && big.amountKobo).toBe(750_000);
    expect(mid.ok && mid.reference).toMatch(/^KDR-[A-Z2-9]{10}$/);
    expect(await startPayment({ kind: "draw", peopleCount: 10 })).toMatchObject({ ok: false, code: "free" });
  });

  it("a Mid circle (₦1,500) reference can't unlock a draw of 60, and offers the difference", async () => {
    const { startPayment } = await import("./paywall");
    const p = await startPayment({ kind: "draw", peopleCount: 20 });
    if (!p.ok) throw new Error("start failed");
    paidKobo.set(p.reference, 150_000);
    const r = await draw(60, { reference: p.reference });
    expect(r.status).toBe(402);
    expect(r.body).toMatchObject({ ok: false, code: "tier_upgrade", upgradeFrom: p.reference, extraKobo: 600_000 });
    expect(memoryPayments().pay.get(p.reference)!.status).toBe("paid"); // not used up

    // Paying the difference unlocks it.
    const up = await startPayment({ kind: "draw", peopleCount: 60, upgradeFrom: p.reference });
    if (!up.ok) throw new Error("upgrade failed");
    expect(up.amountKobo).toBe(600_000);
    paidKobo.set(up.reference, 600_000);
    expect((await draw(60, { reference: up.reference })).status).toBe(200);
  });

  it("a payment for less than the server asked never counts", async () => {
    const { startPayment } = await import("./paywall");
    const p = await startPayment({ kind: "draw", peopleCount: 60 });
    if (!p.ok) throw new Error("start failed");
    paidKobo.set(p.reference, 150_000); // someone paid ₦1,500 against a ₦7,500 reference
    expect((await draw(60, { reference: p.reference })).body.code).toBe("payment_pending");
  });

  it("one reference unlocks one draw", async () => {
    const { startPayment } = await import("./paywall");
    const p = await startPayment({ kind: "draw", peopleCount: 20 });
    if (!p.ok) throw new Error("start failed");
    paidKobo.set(p.reference, 150_000);
    expect((await draw(20, { reference: p.reference })).status).toBe(200);
    const again = await draw(20, { reference: p.reference });
    expect(again.status).toBe(402);
    expect(again.body.code).toBe("payment_used");
  });

  it("a draw that fails on our side leaves the reference usable", async () => {
    const { startPayment } = await import("./paywall");
    const p = await startPayment({ kind: "draw", peopleCount: 16 });
    if (!p.ok) throw new Error("start failed");
    paidKobo.set(p.reference, 150_000);
    const POST = await drawRoute();
    const people = names(16);
    // Everyone kept apart from everyone: no fair draw exists.
    const ex = people.flatMap((a, i) => people.slice(i + 1).map((b) => [a, b]));
    const bad = await POST(new Request("https://x.test/api/draw", { method: "POST", body: JSON.stringify({ event: { name: "X" }, people, ex, circle: false, blind: true, reference: p.reference }) }));
    expect(bad.status).toBe(422);
    expect((await draw(16, { reference: p.reference })).status).toBe(200);
  });

  it("an unknown reference unlocks nothing", async () => {
    expect((await draw(20, { reference: "KDR-AAAAAAAAAA" })).status).toBe(402);
    expect((await draw(20, {})).status).toBe(402);
  });
});

describe("Year pass", () => {
  async function buyPass(at = new Date()) {
    const { startPayment, issuePass } = await import("./paywall");
    const p = await startPayment({ kind: "pass" }, at);
    if (!p.ok) throw new Error("start failed");
    expect(p.amountKobo).toBe(1_500_000);
    paidKobo.set(p.reference, 1_500_000);
    const r = await issuePass(p.reference, at);
    if (!r.ok) throw new Error("issue failed " + r.code);
    return { ...r, reference: p.reference };
  }

  it("stores only the code's hash", async () => {
    const { code } = await buyPass();
    expect(code).toMatch(/^KDR-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(JSON.stringify(memoryPayments())).not.toContain(code);
  });

  it("works for draw 25 and is refused at draw 26", async () => {
    const { code } = await buyPass();
    for (let i = 1; i <= PRICING.YEAR_PASS.maxDraws; i++) {
      const r = await draw(30, { passCode: code });
      expect(r.status, `draw ${i}`).toBe(200);
      expect(r.body.pass.drawsLeft).toBe(PRICING.YEAR_PASS.maxDraws - i);
    }
    const r26 = await draw(30, { passCode: code });
    expect(r26.status).toBe(403);
    expect(r26.body.code).toBe("pass_invalid");
  });

  it("is refused once expired", async () => {
    const { code } = await buyPass(new Date(Date.now() - 366 * DAY));
    expect((await draw(30, { passCode: code })).body.code).toBe("pass_invalid");
  });

  it("refuses a wrong code with the same answer as an expired one", async () => {
    const expired = (await buyPass(new Date(Date.now() - 366 * DAY))).code;
    const a = await draw(30, { passCode: "KDR-AAAA-BBBB-CCCC-DDDD" });
    const b = await draw(30, { passCode: expired });
    expect(a.status).toBe(b.status);
    expect(a.body).toEqual(b.body);
  });

  it("accepts the code however it's typed", async () => {
    const { code } = await buyPass();
    expect((await draw(30, { passCode: " " + code.toLowerCase().replace(/-/g, " ") })).status).toBe(200);
  });

  it("shows the code once; support reissues after that", async () => {
    const { reference } = await buyPass();
    const { issuePass } = await import("./paywall");
    expect(await issuePass(reference)).toMatchObject({ ok: false, code: "already_issued" });
  });

  it("covers circles of up to 500", async () => {
    const { code } = await buyPass();
    const { spendPassDraw } = await import("./paywall");
    expect(await spendPassDraw(code, 501)).toMatchObject({ ok: false });
    expect(await spendPassDraw(code, 500)).toMatchObject({ ok: true });
  });
});

describe("Paystack webhook", () => {
  const sign = (body: string, key = "sk_test_x") => createHmac("sha512", key).update(body).digest("hex");
  async function hook(body: string, sig: string | null) {
    const { POST } = await import("@/app/api/paystack/webhook/route");
    return POST(new Request("https://x.test/api/paystack/webhook", { method: "POST", body, headers: sig ? { "x-paystack-signature": sig } : {} }));
  }

  it("rejects a bad or missing signature", async () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "KDR-AAAAAAAAAA" } });
    expect((await hook(body, sign(body, "wrong-key"))).status).toBe(401);
    expect((await hook(body, null)).status).toBe(401);
  });

  it("marks a payment paid, even if the browser closed", async () => {
    const { startPayment } = await import("./paywall");
    const p = await startPayment({ kind: "pass" });
    if (!p.ok) throw new Error("start failed");
    const body = JSON.stringify({ event: "charge.success", data: { reference: p.reference, amount: p.amountKobo, currency: "NGN", status: "success", customer: { email: "x@example.com" } } });
    expect((await hook(body, sign(body))).status).toBe(200);
    expect(memoryPayments().pay.get(p.reference)!.status).toBe("paid");
    expect(memoryPayments().pass).toHaveLength(1); // the pass exists; its code comes from support or the buyer's screen
    expect(JSON.stringify(memoryPayments())).not.toContain("x@example.com");
  });

  it("ignores a payment of the wrong amount", async () => {
    const { startPayment } = await import("./paywall");
    const p = await startPayment({ kind: "draw", peopleCount: 60 });
    if (!p.ok) throw new Error("start failed");
    const body = JSON.stringify({ event: "charge.success", data: { reference: p.reference, amount: 150_000, currency: "NGN", status: "success" } });
    await hook(body, sign(body));
    expect(memoryPayments().pay.get(p.reference)!.status).toBe("pending");
  });
});
