import { ajo as A } from "@/lib/copy/ajo";
import { randomInt } from "node:crypto";
import { adminGroup } from "@/lib/ajo/admin";
import { drawOrder } from "@/lib/ajo/logic";
import { fail, load, now, ok, readJson, toPublic, withStore } from "@/lib/ajo/server";

// Admin: draw the payout order.
//   { mode: "instant" }                      → drawn and locked now (redraw allowed for 10 minutes)
//   { mode: "live", startInSeconds: 10..60 } → order computed and stored now, revealed to everyone at once
export async function POST(req: Request, ctx: RouteContext<"/api/ajo/groups/[publicId]/draw">) {
  const { publicId } = await ctx.params;
  const body = await readJson(req);
  const mode = body?.mode === "live" ? "live" : body?.mode === "instant" ? "instant" : null;
  if (!mode) return fail(A.errors.chooseMode);
  const secs = Number(body?.startInSeconds ?? 30);
  if (mode === "live" && (!Number.isInteger(secs) || secs < 10 || secs > 60)) return fail(A.errors.liveSeconds);

  return withStore(async (s) => {
    const group = await adminGroup(s, publicId, body?.token);
    if (!group) return fail(A.errors.adminLink, 403);
    if (group.status !== "setup") return fail(A.errors.alreadyDrawn, 409);

    const at = now(req);
    const members = await s.members(group.id);
    const order = drawOrder(
      members.map((m) => m.id),
      members.filter((m) => m.pinned_turn).map((m) => ({ member: m.id, turn: m.pinned_turn! })),
      (n) => randomInt(n),
    );
    const revealAt = mode === "live" ? new Date(at.getTime() + secs * 1000).toISOString() : null;
    await s.replaceDraw(group.id, {
      group_id: group.id, mode, member_order: order,
      drawn_at: revealAt ?? at.toISOString(), // a live draw counts as drawn when everyone sees it
      redraw_count: 0, locked: true,
    });
    await s.updateGroup(group.id, mode === "live" ? { status: "scheduled_live", live_reveal_at: revealAt } : { status: "drawn" });
    const fresh = (await s.getGroup(publicId))!;
    return ok({ group: toPublic(await load(s, fresh, at), at) });
  });
}
