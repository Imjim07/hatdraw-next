import { PUBLIC_ID, load, now, toPublic, withStore } from "@/lib/ajo/server";
import { fileSafe, scheduleCsv } from "@/lib/ajo/csv";
import { ajo } from "@/lib/copy/ajo";

// The whole payout order as a CSV file: turn, date, day, who collects, amount, and
// whether the turn was agreed before the draw. The same facts the public schedule shows
// (no emails, no ids). Swaps are already applied.
export async function GET(req: Request, ctx: RouteContext<"/api/ajo/groups/[publicId]/schedule.csv">) {
  const { publicId } = await ctx.params;
  const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!PUBLIC_ID.test(publicId)) return notFound();
  return withStore(async (s) => {
    const group = await s.getGroup(publicId);
    if (!group) return notFound();
    const at = now(req);
    const turns = toPublic(await load(s, group, at), at).turns;
    if (!turns) return new Response(ajo.schedule.notDrawn.replace(/ These are the members:$/, ""), { status: 409, headers: { "Cache-Control": "no-store" } });
    return new Response(scheduleCsv(turns), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileSafe(group.name)}-ajo-schedule.csv"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
