// One place to rename the product or change prices.
export const BRAND = {
  name: "HatDraw",
  tagline: "Drop the names in the hat. Let Christmas pick.",
  by: "Capricorn Hub",
  byUrl: "https://capricornhub.com",
};

export const PRICING = {
  FREE_LIMIT: 15, // draws with this many people or fewer are free
  ONE_TIME: 3500, // ₦ per draw above the free limit
  YEARLY: 6000, // ₦ per year (needs accounts — not sold yet)
  MAX_PEOPLE: 500,
};

// "demo": big draws unlock without payment (shows a notice)
// "live": big draws need a verified Paystack payment
export const PAYWALL_MODE: "demo" | "live" =
  process.env.NEXT_PUBLIC_PAYWALL_MODE === "live" ? "live" : "demo";

export const naira = (n: number | string) =>
  "₦" + Number(n).toLocaleString("en-NG");
