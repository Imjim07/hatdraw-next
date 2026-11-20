import { ajo as A } from "@/lib/copy/ajo";
import { verifyMember } from "@/lib/ajo/mail";
import { fail, ok, withStore } from "@/lib/ajo/server";

// One-click unsubscribe from reminder emails. Works from the link in the email
// (the page posts JSON) and from mail clients' List-Unsubscribe-Post (query string).
export async function POST(req: Request) {
  const q = new URL(req.url).searchParams;
  let m = q.get("m") ?? "", sig = q.get("s") ?? "";
  if (!m) { try { const j = await req.json(); m = String(j?.m ?? ""); sig = String(j?.s ?? ""); } catch {} }
  if (!/^[0-9a-f-]{36}$/i.test(m) || !sig || !verifyMember(m, sig)) return fail(A.errors.unsubscribe, 400);
  return withStore(async (s) => {
    const me = await s.memberById(m);
    // Stopping reminders deletes the address, not just a flag.
    if (me) await s.updateMember(me.id, { email: null, remind: false });
    return ok({ name: me?.name ?? null });
  });
}
