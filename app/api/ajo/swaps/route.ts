import { memberFromToken, memberView } from "@/lib/ajo/member";
import { clip, fail, load, now, ok, readJson, toPublic, withStore } from "@/lib/ajo/server";

// Swaps turns, only if BOTH members confirm from their own links. Asking counts
// as the asker's confirmation; the other member confirms or declines.
//   { token, action: "request", with: "<member name>" }
//   { token, action: "confirm" | "decline", swapId }
export async function POST(req: Request) {
  const body = await readJson(req);
  const action = String(body?.action ?? "");
  if (!["request", "confirm", "decline"].includes(action)) return fail("Invalid request.");

  return withStore(async (s) => {
    const me = await memberFromToken(s, body?.token);
    if (!me) return fail("This personal link doesn't work. Ask your organizer to resend it.", 403);
    const group = (await s.getGroup(String(body?.publicId ?? ""))) ?? null;
    if (!group || group.id !== me.group_id) return fail("This personal link doesn't belong to this ajo group.", 403);
    const at = now(req);
    const l = await load(s, group, at);
    if (!l.order) return fail("Swaps open once the payout order has been drawn.", 409);
    const done = async () => { const fresh = await load(s, group, at); return ok({ me: memberView(fresh, (await s.memberById(me.id))!), group: toPublic(fresh, at) }); };

    if (action === "request") {
      const other = l.members.find((m) => m.name === clip(body?.with, 40));
      if (!other || other.id === me.id) return fail("Choose someone else in your group.");
      if (me.pinned_turn != null || other.pinned_turn != null) return fail("Pinned turns were agreed before the draw, so they can't be swapped.", 409);
      const open = l.swaps.some((x) => x.status === "pending" && [x.from_member, x.to_member].includes(me.id) && [x.from_member, x.to_member].includes(other.id));
      if (open) return fail(`There's already a swap waiting between you and ${other.name}.`, 409);
      await s.insertSwap({ group_id: group.id, from_member: me.id, to_member: other.id, requested_at: at.toISOString() });
      return done();
    }

    const swap = l.swaps.find((x) => x.id === String(body?.swapId ?? ""));
    if (!swap || swap.status !== "pending") return fail("That swap request isn't waiting any more.", 409);
    if (swap.to_member !== me.id) return fail("Only the member who was asked can answer this swap.", 403);
    await s.resolveSwap(swap.id, action === "confirm" ? "confirmed" : "declined", at.toISOString());
    return done();
  });
}
