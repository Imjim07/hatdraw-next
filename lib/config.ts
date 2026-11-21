// One place to rename the product, change prices or change a contact address.
// Never type the brand name or an email address in a component: use these.
// BRAND and mailto live in lib/brand.ts (small, so the reveal page stays light).
import { BRAND, SUPPORT_EMAIL, mailto } from "./brand";
export { BRAND, mailto };

/** Where people can write to us. Read from the env, with the real addresses as defaults. */
export const CONTACT = {
  info: process.env.NEXT_PUBLIC_EMAIL_INFO || `info@${BRAND.domain}`, // general questions, press
  sales: process.env.NEXT_PUBLIC_EMAIL_SALES || `sales@${BRAND.domain}`, // offices, churches, Big circle, vendors
  support: SUPPORT_EMAIL, // broken links, payments, reminders, vendor reports
  privacy: process.env.NEXT_PUBLIC_EMAIL_PRIVACY || `privacy@${BRAND.domain}`, // data access and deletion requests
};

// Footer social links. Placeholders for now: each points at the platform's home page.
// Replace with the real profile URLs (e.g. https://www.instagram.com/<handle>).
export const SOCIAL = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/" },
  { id: "snapchat", label: "Snapchat", href: "https://www.snapchat.com/" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/" },
] as const;

/** Sender for every automated email (server only). Replies go to CONTACT.support. */
export const emailFrom = () => process.env.EMAIL_FROM || `${BRAND.name} <reminders@${BRAND.domain}>`;

/** The brand's own business WhatsApp (digits only), or null while it isn't set. */
export const brandWhatsApp = (raw = process.env.NEXT_PUBLIC_KADARA_WHATSAPP): string | null => {
  const d = (raw ?? "").replace(/\D/g, "");
  return /^[1-9]\d{9,14}$/.test(d) ? d : null;
};

/** A WhatsApp chat link with a prefilled message. No number: the person picks the chat. */
export const waLink = (text: string, number?: string | null) =>
  `https://wa.me/${number ?? ""}?text=${encodeURIComponent(text)}`;

// Locked launch prices (copy deck, 21 Nov 2026). The server computes every amount sent to
// Paystack from these; the browser only shows what the server says. See lib/pricing.ts.
export const PRICING = {
  FREE_MAX: 15,
  TIERS: [
    { id: "mid", label: "Mid circle", min: 16, max: 50, price: 1500 },
    { id: "big", label: "Big circle", min: 51, max: 500, price: 7500 },
  ],
  YEAR_PASS: { price: 15000, days: 365, maxPeople: 500, maxDraws: 25 },
} as const;

/** The most people one draw can have (the top tier's ceiling). */
export const MAX_PEOPLE = PRICING.TIERS[PRICING.TIERS.length - 1].max;

// "demo": big draws unlock without payment (shows a notice)
// "live": big draws need a verified Paystack payment
export const PAYWALL_MODE: "demo" | "live" =
  process.env.NEXT_PUBLIC_PAYWALL_MODE === "live" ? "live" : "demo";

export const naira = (n: number | string) =>
  "₦" + Number(n).toLocaleString("en-NG");

/** "1 Dec" from "YYYY-MM-DD" (calendar date, no time zone shift). */
export const dayMonth = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });

/** "21 Nov 2027" from an ISO date or timestamp. */
export const dayMonthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
