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
  anyone: "Anyone", her: "Her", him: "Him", kids: "Kids", colleague: "A colleague", couple: "A couple",
};

/** A product as the pages use it. `images` are full public URLs (the store resolves them). */
export type GiftProduct = {
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
};

/** "lagos" → "Lagos", "port-harcourt" → "Port Harcourt" */
export const areaName = (a: string) => a.split(/[-_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const deliveryLine = (p: Pick<GiftProduct, "deliveryAreas" | "leadTimeDays">) => {
  const where = p.deliveryAreas.length ? p.deliveryAreas.map(areaName).join(", ") : "Lagos";
  const when = p.leadTimeDays <= 0 ? "today" : p.leadTimeDays === 1 ? "in 1 day" : `in ${p.leadTimeDays} days`;
  return `Delivered in ${where} ${when}`;
};
