import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAMPLE_PRODUCTS } from "./samples";
import { REF_PATTERN } from "./ref";

// Gift page → button → POST /api/gift-click → the vendor's WhatsApp with a CDR- ref, and a
// gift_clicks row holding the ref, product and vendor only.
describe("POST /api/gift-click", () => {
  beforeEach(() => { vi.stubEnv("GIFTS_STORE", "memory"); delete (globalThis as { __giftClicks?: unknown }).__giftClicks; });
  afterEach(() => vi.unstubAllEnvs());
  const call = async (body: object) => {
    const { POST } = await import("@/app/api/gift-click/route");
    return POST(new Request("https://x.test/api/gift-click", { method: "POST", body: JSON.stringify(body) }));
  };

  it("opens the vendor's own WhatsApp with the message and a recorded ref", async () => {
    const p = SAMPLE_PRODUCTS[0];
    const res = await call({ productId: p.id });
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.ref).toMatch(REF_PATTERN);
    const u = new URL(j.url);
    expect(u.pathname).toBe(`/${p.vendor.whatsapp}`);
    expect(u.searchParams.get("text")).toContain(`Ref: ${j.ref}`);
    expect(u.searchParams.get("text")).toContain(p.vendor.name);

    const { memoryClicks } = await import("./store");
    expect(memoryClicks()).toEqual([{ ref: j.ref, product_id: p.id, vendor_id: p.vendor.id }]);
  });

  it("is a 404 for an unknown or sold-out product", async () => {
    expect((await call({ productId: "nope" })).status).toBe(404);
    const soldOut = SAMPLE_PRODUCTS.find((p) => !p.inStock)!;
    expect((await call({ productId: soldOut.id })).status).toBe(404);
  });
});
