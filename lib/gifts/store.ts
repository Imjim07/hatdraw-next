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
import type { Category, ForWhom, GiftProduct, Vendor } from "./types";

const BUCKET = "gift-images";
// The sample products use Unsplash placeholder photos by full URL (next.config allows
// that host). Real products use paths in the bucket.
const UNSPLASH = "https://images.unsplash.com/";

type VendorRow = {
  id: string; slug: string; name: string; whatsapp: string; delivery_areas: string[]; delivery_time: string | null;
  refund_line: string; verified_at: string | null; active: boolean;
};
type Row = {
  id: string; slug: string; name: string; description: string; price_naira: number; images: string[] | null;
  category: Category; for_whom: ForWhom[] | null; delivery_areas: string[] | null; lead_time_days: number; in_stock: boolean;
  vendors: VendorRow | null;
};
const COLUMNS = "id,slug,name,description,price_naira,images,category,for_whom,delivery_areas,lead_time_days,in_stock,"
  + "vendors!inner(id,slug,name,whatsapp,delivery_areas,delivery_time,refund_line,verified_at,active)";

const vendorFrom = (v: VendorRow): Vendor => ({
  id: v.id, slug: v.slug, name: v.name, whatsapp: v.whatsapp, deliveryAreas: v.delivery_areas ?? [],
  deliveryTime: v.delivery_time, refundLine: v.refund_line, verified: v.verified_at !== null,
});

function fromRow(r: Row, base: string): GiftProduct {
  return {
    id: r.id, slug: r.slug, name: r.name, description: r.description ?? "", price: r.price_naira,
    images: (r.images ?? []).map((p) => p.startsWith(UNSPLASH) ? p : `${base}/storage/v1/object/public/${BUCKET}/${p.split("/").map(encodeURIComponent).join("/")}`),
    category: r.category, forWhom: r.for_whom ?? ["anyone"], deliveryAreas: r.delivery_areas ?? ["lagos"],
    leadTimeDays: r.lead_time_days, inStock: r.in_stock, vendor: vendorFrom(r.vendors!),
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
    .select(COLUMNS)
    .eq("active", true)
    .eq("vendors.active", true) // a product shows only while its vendor is active
    .order("sort").order("price_naira");
  if (error) {
    // e.g. the vendors migration hasn't been run yet. Show the empty catalogue rather than
    // crash the page, and say why in the server log (a short code, no request data).
    console.error(`[gifts] load_failed ${error.code ?? ""} ${error.message}`);
    return [];
  }
  return (data as unknown as Row[]).filter((r) => r.vendors).map((r) => fromRow(r, url.replace(/\/+$/, "")));
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

// ---- Ordering (the /api/gift-click route) ----

/**
 * A product and its vendor, read fresh (not cached), for the order button. Null when the
 * product or its vendor is missing or switched off.
 */
export async function findForOrder(productId: string): Promise<GiftProduct | null> {
  const mode = process.env.GIFTS_STORE;
  if (mode === "memory") return SAMPLE_PRODUCTS.find((p) => p.id === productId) ?? null;
  if (mode === "empty") return null;
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return null;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from("gift_products").select(COLUMNS)
    .eq("id", productId).eq("active", true).eq("vendors.active", true).maybeSingle();
  if (error) throw new Error("gift_lookup_failed");
  const r = data as unknown as Row | null;
  return r?.vendors ? fromRow(r, url.replace(/\/+$/, "")) : null;
}

export type GiftClick = { ref: string; product_id: string; vendor_id: string };
const g = globalThis as unknown as { __giftClicks?: GiftClick[] };
/** Test hook: the clicks the in-memory store recorded. */
export const memoryClicks = () => (g.__giftClicks ??= []);

/** Records a click. Returns false if the ref is already taken (the caller makes a new one). */
export async function recordClick(click: GiftClick): Promise<boolean> {
  if (process.env.GIFTS_STORE === "memory") {
    if (memoryClicks().some((c) => c.ref === click.ref)) return false;
    memoryClicks().push(click);
    return true;
  }
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("gift_clicks_unavailable"); // only the server role may write clicks
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const res = await db.from("gift_clicks").insert(click);
  if (res.error?.code === "23505") return false;
  if (res.error) throw new Error("gift_click_failed");
  return true;
}
