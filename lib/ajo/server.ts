import { ajo as A } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";
// SERVER ONLY. Helpers shared by the ajo route handlers.
import { getStore, isMemoryStore, StoreMissing, type AjoStore } from "./store";
import { applySwaps, buildTurns, payoutDates, swapExpired } from "./logic";
import type { DrawRow, GroupRow, MemberRow, PublicGroup, SwapRow } from "./types";

export const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

export const ok = (data: object, status = 200) =>
  Response.json({ ok: true, ...data }, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (error: string, status = 400) =>
  Response.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

export const PUBLIC_ID = /^[A-Za-z0-9_-]{16}$/;

/**
 * The current time. Automated tests (in-memory store only) may set it with an
 * `x-ajo-now` header to step past the redraw window or reach a reminder date.
 * With Supabase, the header is ignored.
 */
export function now(req: Request): Date {
  if (isMemoryStore()) {
    const h = req.headers.get("x-ajo-now");
    if (h && !Number.isNaN(Date.parse(h))) return new Date(h);
  }
  return new Date();
}

/** Runs a handler with the store, turning a missing configuration into a clear 503. */
export async function withStore(fn: (s: AjoStore) => Promise<Response>): Promise<Response> {
  try {
    return await fn(await getStore());
  } catch (e) {
    if (e instanceof StoreMissing) return fail(A.errors.notSwitchedOn, 503);
    console.error("[ajo]", e instanceof Error ? e.message : "unknown error"); // never log request bodies (tokens, emails)
    return fail(common.somethingWrong, 500);
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const j = await req.json();
    return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : null;
  } catch { return null; }
}

export type Loaded = {
  group: GroupRow;
  members: MemberRow[];
  draw: DrawRow | null; // current
  firstDrawnAt: string | null; // when the first draw happened (redraws don't reset it)
  swaps: SwapRow[]; // with stale pending swaps marked expired
  revealed: boolean; // order may be shown (instant draw, or live draw past its reveal time)
  order: string[] | null; // member ids in payout order, confirmed swaps applied; null until revealed
  dates: string[];
};

/** Loads a group with everything needed to show or change its schedule. */
export async function load(s: AjoStore, group: GroupRow, at: Date): Promise<Loaded> {
  const [members, draw, history, swapsRaw] = await Promise.all([
    s.members(group.id), s.currentDraw(group.id), s.drawHistory(group.id), s.swaps(group.id),
  ]);

  // A live draw becomes an ordinary drawn schedule once its reveal time passes.
  if (group.status === "scheduled_live" && group.live_reveal_at && at.getTime() >= Date.parse(group.live_reveal_at)) {
    await s.updateGroup(group.id, { status: "drawn" });
    group = { ...group, status: "drawn" };
  }

  // Pending swaps expire after 72 hours.
  const swaps: SwapRow[] = [];
  for (const sw of swapsRaw) {
    if (sw.status === "pending" && swapExpired(sw.requested_at, at)) {
      await s.resolveSwap(sw.id, "expired", at.toISOString());
      swaps.push({ ...sw, status: "expired", resolved_at: at.toISOString() });
    } else swaps.push(sw);
  }

  const revealed = !!draw && group.status !== "setup" && group.status !== "scheduled_live";
  const confirmed = swaps.filter((x) => x.status === "confirmed").sort((a, b) => (a.resolved_at ?? "").localeCompare(b.resolved_at ?? ""));
  const order = revealed && draw ? applySwaps(draw.member_order, confirmed.map((x) => ({ a: x.from_member, b: x.to_member }))) : null;
  const firstDrawnAt = history.length ? history.map((h) => h.drawn_at).sort()[0] : null;
  return { group, members, draw, firstDrawnAt, swaps, revealed, order, dates: payoutDates(group.start_date, group.frequency, members.length) };
}

/** The public schedule: names, dates and amounts only (no emails, no hashes, no ids). */
export function toPublic(l: Loaded, at: Date): PublicGroup {
  const names = new Map(l.members.map((m) => [m.id, m.name]));
  const pins = new Map(l.members.filter((m) => m.pinned_turn).map((m) => [m.id, m.pinned_turn!]));
  return {
    publicId: l.group.public_id,
    name: l.group.name,
    amount: l.group.amount_naira,
    frequency: l.group.frequency,
    startDate: l.group.start_date,
    members: l.members.map((m) => ({ name: m.name, pinnedTurn: m.pinned_turn })),
    status: l.group.status,
    serverNow: at.toISOString(),
    liveRevealAt: l.group.live_reveal_at,
    draw: l.revealed && l.draw ? { mode: l.draw.mode, drawnAt: l.firstDrawnAt ?? l.draw.drawn_at, redrawCount: l.draw.redraw_count } : null,
    turns: l.order ? buildTurns(l.order, names, pins, l.dates, l.group.amount_naira) : null,
    swaps: l.swaps
      .filter((x) => x.status === "confirmed")
      .sort((a, b) => (a.resolved_at ?? "").localeCompare(b.resolved_at ?? ""))
      .map((x) => ({ a: names.get(x.from_member) ?? "", b: names.get(x.to_member) ?? "", at: x.resolved_at! })),
  };
}

export function siteUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  return env || new URL(req.url).origin;
}
