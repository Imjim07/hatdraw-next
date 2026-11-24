import { ajo as A } from "@/lib/copy/ajo";
import { common } from "@/lib/copy/common";
import { memberFromToken, memberView } from "@/lib/ajo/member";
import { clip, fail, load, now, ok, readJson, toPublic, withStore } from "@/lib/ajo/server";
import { lagosToday } from "@/lib/ajo/logic";

// Swaps turns, only if BOTH members confirm from their own links. Asking counts
// as the asker's confirmation; the other member confirms or declines.
//   { token, action: "request", with: "<member name>" }
//   { token, action: "confirm" | "decline", swapId }   (the member who was asked)
//   { token, action: "cancel", swapId }                (the member who asked; stored as declined)
// Turns whose date has passed can't be swapped.
export async function POST(req: Request) {
  const body = await readJson(req);
  const action = String(body?.action ?? "");
  if (!["request", "confirm", "decline", "cancel"].includes(action)) return fail(common.invalidRequest);

  return withStore(async (s) => {
    const me = await memberFromToken(s, body?.token);
    if (!me) return fail(A.errors.memberLink, 403);
    const group = (await s.getGroup(String(body?.publicId ?? ""))) ?? null;
    if (!group || group.id !== me.group_id) return fail(A.errors.wrongGroup, 403);
    const at = now(req);
    const l = await load(s, group, at);
    if (!l.order) return fail(A.errors.swapsClosed, 409);
    const today = lagosToday(at);
    const passed = (id: string) => { const i = l.order!.indexOf(id); return i >= 0 && l.dates[i] < today; };
    const done = async () => { const fresh = await load(s, group, at); return ok({ me: memberView(fresh, (await s.memberById(me.id))!), group: toPublic(fresh, at) }); };

    if (action === "request") {
      const other = l.members.find((m) => m.name === clip(body?.with, 40));
      if (!other || other.id === me.id) return fail(A.errors.swapSomeoneElse);
      if (me.pinned_turn != null || other.pinned_turn != null) return fail(A.errors.swapPinned, 409);
      if (passed(me.id) || passed(other.id)) return fail(A.errors.swapPast, 409);
      const open = l.swaps.some((x) => x.status === "pending" && [x.from_member, x.to_member].includes(me.id) && [x.from_member, x.to_member].includes(other.id));
      if (open) return fail(A.errors.swapWaiting(other.name), 409);
      await s.insertSwap({ group_id: group.id, from_member: me.id, to_member: other.id, requested_at: at.toISOString() });
      return done();
    }

    const swap = l.swaps.find((x) => x.id === String(body?.swapId ?? ""));
    if (!swap || swap.status !== "pending") return fail(A.errors.swapGone, 409);
    if (action === "cancel") {
      if (swap.from_member !== me.id) return fail(A.errors.swapNotYoursToCancel, 403);
      await s.resolveSwap(swap.id, "declined", at.toISOString());
      return done();
    }
    if (swap.to_member !== me.id) return fail(A.errors.swapNotYours, 403);
    if (action === "confirm" && (passed(swap.from_member) || passed(swap.to_member))) return fail(A.errors.swapPast, 409);
    await s.resolveSwap(swap.id, action === "confirm" ? "confirmed" : "declined", at.toISOString());
    return done();
  });
}
