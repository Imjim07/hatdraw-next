import { ajo as A } from "@/lib/copy/ajo";
import { adminGroup } from "@/lib/ajo/admin";
import { REDRAW_WINDOW_MS, canRedraw } from "@/lib/ajo/logic";
import { fail, load, now, ok, readJson, toPublic, withStore } from "@/lib/ajo/server";

// Admin view: checks the admin token and returns the schedule plus what the
// organiser may still do (draw, or redraw until the 10-minute window closes).
export async function POST(req: Request, ctx: RouteContext<"/api/ajo/groups/[publicId]/admin">) {
  const { publicId } = await ctx.params;
  const body = await readJson(req);
  return withStore(async (s) => {
    const group = await adminGroup(s, publicId, body?.token);
    if (!group) return fail(A.errors.adminLink, 403);
    const at = now(req);
    const l = await load(s, group, at);
    const redrawable = !!l.draw && l.revealed && !!l.firstDrawnAt && canRedraw({ mode: l.draw.mode, drawn_at: l.firstDrawnAt }, at)
      && !l.swaps.some((x) => x.status === "confirmed");
    return ok({
      group: toPublic(l, at),
      canDraw: group.status === "setup",
      redrawUntil: redrawable ? new Date(Date.parse(l.firstDrawnAt!) + REDRAW_WINDOW_MS).toISOString() : null,
    });
  });
}
