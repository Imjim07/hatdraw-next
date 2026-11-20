import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/config";
import { orderMessage, orderUrl, validWhatsApp } from "./order";
import { REF_ALPHABET, REF_PATTERN, newRef } from "./ref";

const p = { name: "[Sample] Adire scarf", price: 18500, vendor: { name: "Ada's Candles", whatsapp: "2348012345678" } };

describe("WhatsApp order link", () => {
  it("pre-fills the vendor, gift, exact price and ref", () => {
    expect(orderMessage(p, "CDR-ABC234")).toBe(`Hi Ada's Candles, I found your [Sample] Adire scarf (₦18,500) on ${BRAND.name} and I'd like to order. Ref: CDR-ABC234`);
  });
  it("leaves the ref off when there isn't one", () => {
    expect(orderMessage(p)).not.toMatch(/Ref:/);
  });
  it("goes to the vendor's own number with the message encoded", () => {
    const u = new URL(orderUrl(p, "CDR-ABC234"));
    expect(u.origin + u.pathname).toBe("https://wa.me/2348012345678");
    expect(u.searchParams.get("text")).toContain("Ref: CDR-ABC234");
  });
  it("accepts vendor numbers only as 10–15 digits with no leading zero", () => {
    expect(validWhatsApp("2348012345678")).toBe(true);
    expect(validWhatsApp("+2348012345678")).toBe(false);
    expect(validWhatsApp("234 801 234 5678")).toBe(false);
    expect(validWhatsApp("08012345678")).toBe(false);
    expect(validWhatsApp("23408012345678")).toBe(false);
    expect(validWhatsApp("123456789")).toBe(false);
    expect(validWhatsApp("1234567890123456")).toBe(false);
  });
});

describe("order refs", () => {
  it("are CDR- plus 6 unambiguous characters", () => {
    for (let i = 0; i < 200; i++) expect(newRef()).toMatch(REF_PATTERN);
    expect(REF_ALPHABET).not.toMatch(/[01OIL]/);
  });
  it("use the random source for every character", () => {
    expect(newRef(() => 0)).toBe("CDR-AAAAAA");
    expect(newRef((n) => n - 1)).toBe("CDR-999999");
  });
});
