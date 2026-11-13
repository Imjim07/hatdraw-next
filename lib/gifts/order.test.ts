import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/config";
import { orderMessage, orderUrl, storeNumber } from "./order";

const p = { name: "[Sample] Adire scarf", price: 18500, slug: "sample-adire-scarf" };

describe("WhatsApp order link", () => {
  it("pre-fills the product, its exact price and its page", () => {
    expect(orderMessage(p, "https://example.test/")).toBe(`Hi ${BRAND.name}, I'd like to order: [Sample] Adire scarf (₦18,500). https://example.test/gifts/sample-adire-scarf`);
  });
  it("goes to wa.me with the message encoded", () => {
    const u = new URL(orderUrl(p, "2348000000000", "https://example.test"));
    expect(u.origin + u.pathname).toBe("https://wa.me/2348000000000");
    expect(u.searchParams.get("text")).toContain("(₦18,500)");
  });
  it("accepts the number only as 8–15 digits", () => {
    expect(storeNumber("+234 800 000 0000")).toBe("2348000000000");
    expect(storeNumber("")).toBeNull();
    expect(storeNumber(undefined)).toBeNull();
    expect(storeNumber("12345")).toBeNull();
  });
});
