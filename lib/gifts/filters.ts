import { naira } from "@/lib/config";
import { CATEGORIES, FOR_WHOM, type Category, type ForWhom, type GiftProduct } from "./types";

// Gift Finder filters. They live in the URL (/gifts?max=15000&for=her) so a filtered
// view can be shared; anything malformed falls back to "Any".
//   min, max  budget in naira: a gift matches when min < price <= max
//   for       who it's for (one of FOR_WHOM)
//   cat       category (one of CATEGORIES)
//   compare   up to four product slugs to compare side by side, comma-separated

export type Filters = { min: number | null; max: number | null; forWhom: ForWhom | null; category: Category | null; compare: string[] };
export const ANY: Filters = { min: null, max: null, forWhom: null, category: null, compare: [] };

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
  let min = amount(one(sp.min), true);
  const max = amount(one(sp.max), false);
  if (min === 0) min = null;
  if (min !== null && max !== null && min >= max) min = null; // an impossible range: keep the ceiling only
  const forWhom = (FOR_WHOM as readonly string[]).includes(one(sp.for)) ? (one(sp.for) as ForWhom) : null;
  const category = (CATEGORIES as readonly string[]).includes(one(sp.cat)) ? (one(sp.cat) as Category) : null;
  const compare = [...new Set(one(sp.compare).split(",").filter((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length <= 80))].slice(0, COMPARE_MAX);
  return { min, max, forWhom, category, compare };
}

/** Which budget chip is selected, or null for a custom ceiling (e.g. a reveal's ₦15,000 budget). */
export function bandOf(f: Pick<Filters, "min" | "max">): BandId | null {
  return BANDS.find((b) => b.min === f.min && b.max === f.max)?.id ?? null;
}

export function budgetLabel(f: Pick<Filters, "min" | "max">): string {
  if (f.min !== null && f.max !== null) return `${naira(f.min)}–${naira(f.max)}`;
  if (f.max !== null) return `Under ${naira(f.max)}`;
  if (f.min !== null) return `Over ${naira(f.min)}`;
  return "Any budget";
}

export const matches = (p: Pick<GiftProduct, "price" | "forWhom" | "category">, f: Filters) =>
  (f.min === null || p.price > f.min) &&
  (f.max === null || p.price <= f.max) &&
  (f.forWhom === null || p.forWhom.includes(f.forWhom) || (f.forWhom !== "kids" && p.forWhom.includes("anyone"))) &&
  (f.category === null || p.category === f.category);

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
  if (g.category) q.set("cat", g.category);
  if (g.compare.length) q.set("compare", g.compare.join(","));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Adds or removes `slug` from the comparison (at most COMPARE_MAX; the oldest drops off). */
export function toggleCompare(list: string[], slug: string): string[] {
  if (list.includes(slug)) return list.filter((s) => s !== slug);
  return [...list, slug].slice(-COMPARE_MAX);
}
