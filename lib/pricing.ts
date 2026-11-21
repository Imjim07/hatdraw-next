// Which price a draw of N people pays. Pure: used by the server to set every amount, and by
// the browser only to label things (the server re-checks everything).
import { PRICING } from "./config";

export type Tier = (typeof PRICING.TIERS)[number];
export type TierId = Tier["id"];

/** null = free (up to FREE_MAX people). Throws above the top tier. */
export function tierFor(people: number): Tier | null {
  if (!Number.isInteger(people) || people < 0) throw new RangeError("people must be a whole number");
  if (people <= PRICING.FREE_MAX) return null;
  const t = PRICING.TIERS.find((x) => people >= x.min && people <= x.max);
  if (!t) throw new RangeError(`at most ${PRICING.TIERS[PRICING.TIERS.length - 1].max} people per draw`);
  return t;
}

export const tierById = (id: string): Tier | null => PRICING.TIERS.find((t) => t.id === id) ?? null;

/** Paystack amounts are in kobo. */
export const kobo = (naira: number) => naira * 100;
