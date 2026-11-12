import { PUBLIC_ID, fail, load, now, ok, toPublic, withStore } from "@/lib/ajo/server";

// The public schedule. Before the draw: members only. During a live countdown:
// no order, just the reveal time and the server time so clients can count down.
export async function GET(req: Request, ctx: RouteContext<"/api/ajo/groups/[publicId]">) {
  const { publicId } = await ctx.params;
  if (!PUBLIC_ID.test(publicId)) return fail("We couldn't find that ajo group.", 404);
  return withStore(async (s) => {
    const group = await s.getGroup(publicId);
    if (!group) return fail("We couldn't find that ajo group.", 404);
    const at = now(req);
    return ok({ group: toPublic(await load(s, group, at), at) });
  });
}
