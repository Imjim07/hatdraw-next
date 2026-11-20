// Gift Finder catalogue types. Mirrors supabase/migrations/*_gift_products.sql.

export const CATEGORIES = ["home", "beauty", "food", "tech", "fashion", "experiences", "kids", "office"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABEL: Record<Category, string> = {
  home: "Home", beauty: "Beauty", food: "Food & treats", tech: "Tech", fashion: "Fashion",
  experiences: "Experiences", kids: "Kids", office: "Office",
};

export const FOR_WHOM = ["anyone", "her", "him", "kids", "colleague", "couple"] as const;
export type ForWhom = (typeof FOR_WHOM)[number];
export const FOR_WHOM_LABEL: Record<ForWhom, string> = {
  anyone: "Anyone", her: "Her", him: "Him", kids: "Kids", colleague: "Colleague", couple: "Couple",
};

/** The vendor who sells, takes payment for and delivers a gift. */
export type Vendor = {
  id: string;
  slug: string;
  name: string;
  /** International format, digits only, e.g. 2348012345678. */
  whatsapp: string;
  deliveryAreas: string[];
  deliveryTime: string | null;
  refundLine: string;
  /** Checked by the site: the badge shows only when true. */
  verified: boolean;
};

/** A product as the pages use it. `images` are full public URLs (the store resolves them). */
export type GiftProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number; // naira, exactly as stored
  images: string[];
  category: Category;
  forWhom: ForWhom[];
  deliveryAreas: string[];
  leadTimeDays: number;
  inStock: boolean;
  vendor: Vendor;
};

/** "lagos" → "Lagos", "port-harcourt" → "Port Harcourt" */
export const areaName = (a: string) => a.split(/[-_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/** Where the vendor delivers, e.g. "Lagos Mainland, Lekki". */
export const areasLine = (v: Pick<Vendor, "deliveryAreas">) => v.deliveryAreas.map(areaName).join(", ");
