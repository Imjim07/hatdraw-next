import { randomInt } from "node:crypto";
import { adminGroup } from "@/lib/ajo/admin";
import { canRedraw, drawOrder } from "@/lib/ajo/logic";
import { fail, load, now, ok, readJson, toPublic, withStore } from "@/lib/ajo/server";

// Admin: redraw an instant draw within 10 minutes of the FIRST draw (for typos).
// Each redraw is counted publicly; the old draw is kept as history.
export async function POST(req: Request, ctx: RouteContext<"/api/ajo/groups/[publicId]/redraw">) {
  const { publicId } = await ctx.params;
  const body = await readJson(req);
  return withStore(async (s) => {
    const group = await adminGroup(s, publicId, body?.token);
    if (!group) return fail("This admin link doesn't work. Check you copied all of it.", 403);
    const at = now(req);
    const l = await load(s, group, at);
    if (!l.draw || !l.revealed) return fail("There's nothing to redraw yet.", 409);
    if (l.draw.mode === "live") return fail("Live draws can't be redrawn.", 409);
    if (!canRedraw({ mode: l.draw.mode, drawn_at: l.firstDrawnAt! }, at)) return fail("The 10-minute redraw window has closed. This order is final.", 409);
    if (l.swaps.some((x) => x.status === "confirmed")) return fail("Members have already swapped turns, so this order is final.", 409);

    for (const sw of l.swaps) if (sw.status === "pending") await s.resolveSwap(sw.id, "expired", at.toISOString());
    const order = drawOrder(
      l.members.map((m) => m.id),
      l.members.filter((m) => m.pinned_turn).map((m) => ({ member: m.id, turn: m.pinned_turn! })),
      (n) => randomInt(n),
    );
    await s.replaceDraw(group.id, { group_id: group.id, mode: "instant", member_order: order, drawn_at: at.toISOString(), redraw_count: l.draw.redraw_count + 1, locked: true });
    return ok({ group: toPublic(await load(s, group, at), at) });
  });
}
