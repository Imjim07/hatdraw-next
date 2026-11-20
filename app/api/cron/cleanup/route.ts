import { cronAuthorised } from "@/lib/cron";
import { cleanupGroups } from "@/lib/ajo/cleanup";
import { fail, now, ok, withStore } from "@/lib/ajo/server";

// Daily cron: deletes ajo groups (with their members, draws, swaps and reminder
// records) 90 days after the last turn. Requires: Authorization: Bearer $CRON_SECRET.
export async function GET(req: Request) {
  if (!cronAuthorised(req)) return fail("Unauthorised.", 401);
  return withStore(async (s) => {
    const deleted = await cleanupGroups(s, now(req));
    console.log(`[ajo] cleanup: ${deleted} groups deleted`); // a count only
    return ok({ deleted });
  });
}
