// SERVER ONLY. Where the Gift Finder catalogue comes from.
//
// Production: Supabase. Reads use SUPABASE_ANON_KEY so row-level security applies
// (the anon role sees active products only). If only the service-role key is set, the
// query filters on active = true itself.
// Local development and automated tests, only when set explicitly:
//   GIFTS_STORE=memory  the six "[Sample]" products, all shown
//   GIFTS_STORE=empty   no products (the empty state)
// With none of these the catalogue is empty rather than broken.
//
// Results are cached for 10 minutes ("use cache"), so a product the owner switches on
// in the dashboard appears within 10 minutes.
import { cacheLife } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { SAMPLE_PRODUCTS } from "./samples";
import type { Category, ForWhom, GiftProduct } from "./types";

const BUCKET = "gift-images";

type Row = {
  slug: string; name: string; description: string; price_naira: number; images: string[] | null;
  category: Category; for_whom: ForWhom[] | null; delivery_areas: string[] | null; lead_time_days: number; in_stock: boolean;
};

function fromRow(r: Row, base: string): GiftProduct {
  return {
    slug: r.slug, name: r.name, description: r.description ?? "", price: r.price_naira,
    images: (r.images ?? []).map((p) => `${base}/storage/v1/object/public/${BUCKET}/${p.split("/").map(encodeURIComponent).join("/")}`),
    category: r.category, forWhom: r.for_whom ?? ["anyone"], deliveryAreas: r.delivery_areas ?? ["lagos"],
    leadTimeDays: r.lead_time_days, inStock: r.in_stock,
  };
}

async function load(): Promise<GiftProduct[]> {
  const mode = process.env.GIFTS_STORE;
  if (mode === "memory") return SAMPLE_PRODUCTS;
  if (mode === "empty") return [];
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("gift_products")
    .select("slug,name,description,price_naira,images,category,for_whom,delivery_areas,lead_time_days,in_stock")
    .eq("active", true)
    .order("sort").order("price_naira");
  if (error) throw new Error(`Couldn't load gifts: ${error.message}`);
  return (data as Row[]).map((r) => fromRow(r, url.replace(/\/+$/, "")));
}

/** Every active product, in the owner's order. */
export async function listGifts(): Promise<GiftProduct[]> {
  "use cache";
  cacheLife({ revalidate: 600 });
  return load();
}

export async function getGift(slug: string): Promise<GiftProduct | null> {
  return (await listGifts()).find((p) => p.slug === slug) ?? null;
}
