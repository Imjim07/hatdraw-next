// SERVER ONLY. Member-token lookup and the member's own view.
import { hashToken, looksLikeToken, tokenMatches } from "./tokens";
import type { Loaded } from "./server";
import type { AjoStore } from "./store";
import type { MemberRow, MemberView } from "./types";

export async function memberFromToken(s: AjoStore, token: unknown): Promise<MemberRow | null> {
  if (!looksLikeToken(token)) return null;
  const m = await s.memberByTokenHash(hashToken(token));
  return m && tokenMatches(token, m.token_hash) ? m : null;
}

export function memberView(l: Loaded, me: MemberRow): MemberView {
  const names = new Map(l.members.map((m) => [m.id, m.name]));
  const i = l.order ? l.order.indexOf(me.id) : -1;
  const pending = l.swaps.filter((x) => x.status === "pending");
  return {
    name: me.name,
    email: me.email,
    remind: me.remind,
    turn: i >= 0 ? i + 1 : null,
    date: i >= 0 ? l.dates[i] : null,
    amount: i >= 0 ? l.group.amount_naira * l.members.length : null,
    pinned: me.pinned_turn != null,
    // Pinned turns were agreed before the draw, so they aren't offered for swaps.
    others: l.members.filter((m) => m.id !== me.id && m.pinned_turn == null).map((m) => m.name),
    swapsIn: pending.filter((x) => x.to_member === me.id).map((x) => ({ id: x.id, from: names.get(x.from_member) ?? "", requestedAt: x.requested_at })),
    swapsOut: pending.filter((x) => x.from_member === me.id).map((x) => ({ id: x.id, to: names.get(x.to_member) ?? "", requestedAt: x.requested_at })),
  };
}
