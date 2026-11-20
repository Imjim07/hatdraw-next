import { gifts } from "@/lib/copy/gifts";
import { CATEGORIES, FOR_WHOM, type Category, type ForWhom, type GiftProduct } from "./types";

// Gift Finder filters. They live in the URL (/gifts?max=15000&for=her) so a filtered
// view can be shared; anything malformed falls back to "Any".
//   min, max  budget in naira: a gift matches when min < price <= max
//   for       who it's for (one of FOR_WHOM)
//   cat       categories, comma-separated (any of CATEGORIES); a gift matches any of them
//   budget    a band id, from the no-JavaScript form (overrides min/max)
//   sort      price-asc | price-desc (default: the owner's order)
//   compare   up to four product slugs to compare side by side, comma-separated

export const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
] as const;
export type SortId = (typeof SORTS)[number]["id"];

export type Filters = { min: number | null; max: number | null; forWhom: ForWhom | null; categories: Category[]; sort: SortId; compare: string[] };
export const ANY: Filters = { min: null, max: null, forWhom: null, categories: [], sort: "featured", compare: [] };

export const BANDS = [
  { id: "under-10k", label: "Under ₦10k", min: null, max: 10000 },
  { id: "10-25k", label: "₦10–25k", min: 10000, max: 25000 },
  { id: "25-50k", label: "₦25–50k", min: 25000, max: 50000 },
  { id: "50k-plus", label: "₦50k+", min: 50000, max: null },
  { id: "any", label: "Any", min: null, max: null },
] as const;
export type BandId = (typeof BANDS)[number]["id"];
const EDGES = [10000, 25000, 50000];

export const COMPARE_MAX = 4;
const MAX_NAIRA = 10_000_000;

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const amount = (v: string, allowZero: boolean) => {
  if (!/^\d{1,8}$/.test(v)) return null;
  const n = Number(v);
  return (allowZero ? n >= 0 : n > 0) && n <= MAX_NAIRA ? n : null;
};

export function parseFilters(sp: Params): Filters {
  // budget=<band id> is what the filter form submits without JavaScript; it wins over min/max
  const band = BANDS.find((b) => b.id === one(sp.budget));
  let min = band ? band.min : amount(one(sp.min), true);
  const max = band ? band.max : amount(one(sp.max), false);
  if (min === 0) min = null;
  if (min !== null && max !== null && min >= max) min = null; // an impossible range: keep the ceiling only
  const forWhom = (FOR_WHOM as readonly string[]).includes(one(sp.for)) ? (one(sp.for) as ForWhom) : null;
  const picked = new Set((Array.isArray(sp.cat) ? sp.cat.join(",") : sp.cat ?? "").split(",")); // cat=a,b or cat=a&cat=b
  const categories = CATEGORIES.filter((c) => picked.has(c)); // known values only, in a fixed order
  const sort = SORTS.find((s) => s.id === one(sp.sort))?.id ?? "featured";
  const compare = [...new Set(one(sp.compare).split(",").filter((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length <= 80))].slice(0, COMPARE_MAX);
  return { min, max, forWhom, categories, sort, compare };
}

/** Which budget chip is selected, or null for a custom ceiling (e.g. a reveal's ₦15,000 budget). */
export function bandOf(f: Pick<Filters, "min" | "max">): BandId | null {
  return BANDS.find((b) => b.min === f.min && b.max === f.max)?.id ?? null;
}

export function budgetLabel(f: Pick<Filters, "min" | "max">): string {
  const L = gifts.filters.custom;
  if (f.min !== null && f.max !== null) return L.between(f.min, f.max);
  if (f.max !== null) return L.under(f.max);
  if (f.min !== null) return L.over(f.min);
  return L.any;
}

export const matches = (p: Pick<GiftProduct, "price" | "forWhom" | "category">, f: Filters) =>
  (f.min === null || p.price > f.min) &&
  (f.max === null || p.price <= f.max) &&
  (f.forWhom === null || p.forWhom.includes(f.forWhom) || (f.forWhom !== "kids" && p.forWhom.includes("anyone"))) &&
  (f.categories.length === 0 || f.categories.includes(p.category));

/** The next budget up, for the empty state: the next band edge above the ceiling, then Any. */
export function widen(f: Filters): Filters | null {
  if (f.max === null) return null;
  const next = EDGES.find((e) => e > f.max!) ?? null;
  return { ...f, max: next };
}

/** The query string for `f` (with `patch` applied), "" when everything is Any. */
export function toQuery(f: Filters, patch: Partial<Filters> = {}): string {
  const g = { ...f, ...patch };
  const q = new URLSearchParams();
  if (g.min !== null) q.set("min", String(g.min));
  if (g.max !== null) q.set("max", String(g.max));
  if (g.forWhom) q.set("for", g.forWhom);
  if (g.categories.length) q.set("cat", g.categories.join(","));
  if (g.sort !== "featured") q.set("sort", g.sort);
  if (g.compare.length) q.set("compare", g.compare.join(","));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Adds or removes `slug` from the comparison (at most COMPARE_MAX; the oldest drops off). */
export function toggleCompare(list: string[], slug: string): string[] {
  if (list.includes(slug)) return list.filter((s) => s !== slug);
  return [...list, slug].slice(-COMPARE_MAX);
}

/** Orders gifts for display; "featured" keeps the owner's order. Never mutates `list`. */
export function sortGifts<T extends Pick<GiftProduct, "price">>(list: T[], sort: SortId): T[] {
  if (sort === "featured") return list;
  return [...list].sort((a, b) => (sort === "price-asc" ? a.price - b.price : b.price - a.price));
}

/** Adds or removes one category. */
export const toggleCategory = (list: Category[], c: Category) =>
  CATEGORIES.filter((x) => (x === c ? !list.includes(c) : list.includes(x)));

/** How many gifts each option would show, with every OTHER filter applied as it is. */
export function facetCounts(all: Pick<GiftProduct, "price" | "forWhom" | "category">[], f: Filters) {
  const count = (g: Filters) => all.filter((p) => matches(p, g)).length;
  return {
    budget: Object.fromEntries(BANDS.map((b) => [b.id, count({ ...f, min: b.min, max: b.max })])) as Record<BandId, number>,
    forWhom: Object.fromEntries([["any", count({ ...f, forWhom: null })], ...FOR_WHOM.filter((w) => w !== "anyone").map((w) => [w, count({ ...f, forWhom: w })])]) as Record<"any" | Exclude<ForWhom, "anyone">, number>,
    category: Object.fromEntries(CATEGORIES.map((c) => [c, count({ ...f, categories: [c] })])) as Record<Category, number>,
  };
}
export type FacetCounts = ReturnType<typeof facetCounts>;
