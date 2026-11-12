// Ajo payout-order logic. Pure: no DOM, no Node APIs, no storage. The RNG is
// injected (crypto.randomInt on the server, anything in tests), like lib/draw.ts.
import { shuffle, type Rng } from "@/lib/draw";
import type { DrawMode, Frequency, PublicTurn } from "./types";

export const REDRAW_WINDOW_MS = 10 * 60 * 1000;
export const SWAP_EXPIRY_MS = 72 * 60 * 60 * 1000;
export const REMIND_DAYS_BEFORE = 3;
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 100;
export const MAX_AMOUNT = 10_000_000;

export type Pin = { member: string; turn: number };

/** Throws a readable error if pins can't all be honoured. */
export function validatePins(members: string[], pins: Pin[]): void {
  const n = members.length;
  const ids = new Set(members);
  const turns = new Set<number>();
  const pinned = new Set<string>();
  for (const p of pins) {
    if (!ids.has(p.member)) throw new Error("A pinned member isn't in the group.");
    if (!Number.isInteger(p.turn) || p.turn < 1 || p.turn > n) throw new Error(`Pinned turns must be between 1 and ${n}.`);
    if (turns.has(p.turn)) throw new Error(`Turn ${p.turn} is pinned twice.`);
    if (pinned.has(p.member)) throw new Error("A member can only be pinned to one turn.");
    turns.add(p.turn);
    pinned.add(p.member);
  }
}

/**
 * Pinned members go in their agreed turns; everyone else is shuffled into the
 * free turns (in turn order) with the same Fisher–Yates shuffle as the gift draw.
 * Returns members in payout order, turn 1 first.
 */
export function drawOrder(members: string[], pins: Pin[], rng: Rng): string[] {
  validatePins(members, pins);
  const order: (string | null)[] = Array(members.length).fill(null);
  for (const p of pins) order[p.turn - 1] = p.member;
  const pinned = new Set(pins.map((p) => p.member));
  const rest = shuffle(members.filter((m) => !pinned.has(m)), rng);
  let k = 0;
  for (let i = 0; i < order.length; i++) if (order[i] === null) order[i] = rest[k++];
  return order as string[];
}

// ---- dates (YYYY-MM-DD, calendar dates with no time zone) ----
const parse = (d: string) => { const [y, m, day] = d.split("-").map(Number); return { y, m, day }; };
const fmt = (y: number, m: number, d: number) => `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1-based
export const isIsoDate = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d + "T00:00:00Z")) && new Date(d + "T00:00:00Z").toISOString().startsWith(d);

export function addDays(date: string, days: number): string {
  const t = new Date(date + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}

/** Days from a to b (b − a). */
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);

/**
 * Payout date of each turn. Weekly +7 days, biweekly +14, monthly on the same
 * day of the month, falling back to the month's last day (31 Jan → 28/29 Feb → 31 Mar).
 */
export function payoutDates(startDate: string, frequency: Frequency, n: number): string[] {
  if (frequency === "weekly" || frequency === "biweekly") {
    const step = frequency === "weekly" ? 7 : 14;
    return Array.from({ length: n }, (_, i) => addDays(startDate, i * step));
  }
  const { y, m, day } = parse(startDate);
  return Array.from({ length: n }, (_, i) => {
    const mm = m - 1 + i;
    const yy = y + Math.floor(mm / 12);
    const mo = (mm % 12) + 1;
    return fmt(yy, mo, Math.min(day, daysIn(yy, mo)));
  });
}

/** What the person whose turn it is collects: everyone's contribution. */
export const payoutAmount = (amount: number, n: number) => amount * n;

/** Applies confirmed swaps in the order they were confirmed. Unknown members are ignored. */
export function applySwaps(order: string[], swaps: { a: string; b: string }[]): string[] {
  const o = order.slice();
  for (const { a, b } of swaps) {
    const i = o.indexOf(a), j = o.indexOf(b);
    if (i < 0 || j < 0 || i === j) continue;
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

/** Instant draws can be redrawn for 10 minutes (typos); live draws never. */
export function canRedraw(draw: { mode: DrawMode; drawn_at: string }, now: Date): boolean {
  if (draw.mode !== "instant") return false;
  const age = now.getTime() - Date.parse(draw.drawn_at);
  return age >= 0 && age < REDRAW_WINDOW_MS;
}

export const swapExpired = (requestedAt: string, now: Date) => now.getTime() - Date.parse(requestedAt) >= SWAP_EXPIRY_MS;

/** Today's calendar date in Nigeria (WAT, UTC+1), where payout dates are meant. */
export function lagosToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The schedule everyone sees. `order` already has swaps applied. */
export function buildTurns(
  order: string[],
  names: Map<string, string>,
  pins: Map<string, number>,
  dates: string[],
  amount: number,
): PublicTurn[] {
  const total = payoutAmount(amount, order.length);
  return order.map((id, i) => ({
    turn: i + 1,
    date: dates[i],
    name: names.get(id) ?? "",
    amount: total,
    pinned: pins.get(id) === i + 1,
  }));
}

/** Index of the next turn still to come (or −1 when the cycle is complete). */
export const nextTurnIndex = (dates: string[], today: string) => dates.findIndex((d) => d >= today);

/** "redrawn once" / "redrawn 3 times" ("" when never). */
export const redrawLabel = (n: number) => (n <= 0 ? "" : n === 1 ? "redrawn once" : n === 2 ? "redrawn twice" : `redrawn ${n} times`);
