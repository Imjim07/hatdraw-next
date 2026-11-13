// One place to rename the product or change prices.
export const BRAND = {
  name: "HatDraw",
  tagline: "Drop the names in the hat. Let Christmas pick.",
  by: "Capricorn Hub",
  byUrl: "https://capricornhub.com",
};

// Footer social links. Placeholders for now: each points at the platform's home page.
// Replace with the real profile URLs (e.g. https://www.instagram.com/<handle>).
export const SOCIAL = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/" },
  { id: "snapchat", label: "Snapchat", href: "https://www.snapchat.com/" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/" },
] as const;

export const PRICING = {
  FREE_LIMIT: 15, // draws with this many people or fewer are free
  ONE_TIME: 700, // ₦ per draw above the free limit (Big Hat, monthly) — what checkout charges
  BIG_HAT_YEARLY: 7500, // ₦ per year (needs accounts — not sold yet)
  CHAIR_MONTHLY: 1500, // ₦ per month, Chair Hat (not sold yet)
  CHAIR_YEARLY: 15500, // ₦ per year, Chair Hat (not sold yet)
  MAX_PEOPLE: 500,
};

// "demo": big draws unlock without payment (shows a notice)
// "live": big draws need a verified Paystack payment
export const PAYWALL_MODE: "demo" | "live" =
  process.env.NEXT_PUBLIC_PAYWALL_MODE === "live" ? "live" : "demo";

export const naira = (n: number | string) =>
  "₦" + Number(n).toLocaleString("en-NG");
