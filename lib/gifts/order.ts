import { waLink } from "@/lib/config";
import { gifts } from "@/lib/copy/gifts";
import type { GiftProduct } from "./types";

// SERVER AND CLIENT. Ordering happens on the vendor's own WhatsApp: the button opens a chat
// with THAT vendor, with the gift, its exact price and a ref already typed. The vendor
// confirms price, delivery fee and date before anyone pays. The site never takes payment.

/** A vendor's number is valid as 10–15 digits, no "+", no spaces, no leading 0, no 0 after 234. */
export const validWhatsApp = (n: string) => /^[1-9]\d{9,14}$/.test(n) && !n.startsWith("2340");

type Orderable = Pick<GiftProduct, "name" | "price"> & { vendor: Pick<GiftProduct["vendor"], "name" | "whatsapp"> };

export function orderMessage(p: Orderable, ref?: string) {
  return gifts.vendorMessage({ vendor: p.vendor.name, gift: p.name, price: p.price, ref });
}

/** wa.me link to the vendor with the message typed in. Without a ref when the server couldn't make one. */
export function orderUrl(p: Orderable, ref?: string) {
  return waLink(orderMessage(p, ref), p.vendor.whatsapp);
}
