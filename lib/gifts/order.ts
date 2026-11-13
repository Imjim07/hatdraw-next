import { BRAND, naira } from "@/lib/config";
import type { GiftProduct } from "./types";

// Ordering happens on WhatsApp: the button opens a chat with the store, with the
// product, its exact price and a link to its page already typed. The store then
// confirms price, delivery fee and date before anyone pays.

/** The store's WhatsApp number (digits only), or null while it isn't set up. */
export function storeNumber(raw = process.env.NEXT_PUBLIC_STORE_WHATSAPP): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function orderMessage(p: Pick<GiftProduct, "name" | "price" | "slug">, siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "") {
  const link = `${siteUrl.replace(/\/+$/, "")}/gifts/${p.slug}`;
  return `Hi ${BRAND.name}, I'd like to order: ${p.name} (${naira(p.price)}). ${link}`;
}

export function orderUrl(p: Pick<GiftProduct, "name" | "price" | "slug">, number: string, siteUrl?: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(orderMessage(p, siteUrl))}`;
}
