import { ajo as A } from "@/lib/copy/ajo";
import { memberFromToken, memberView } from "@/lib/ajo/member";
import { PUBLIC_ID, clip, fail, load, now, ok, readJson, toPublic, withStore } from "@/lib/ajo/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A member's own view (their turn, date, amount, swaps), and saving their
// reminder email. { token, publicId, save?: { email, remind } }
export async function POST(req: Request) {
  const body = await readJson(req);
  return withStore(async (s) => {
    const me = await memberFromToken(s, body?.token);
    if (!me) return fail(A.errors.memberLink, 403);
    const publicId = String(body?.publicId ?? "");
    const group = PUBLIC_ID.test(publicId) ? await s.getGroup(publicId) : null;
    if (!group || group.id !== me.group_id) return fail(A.errors.wrongGroup, 403);

    let saved = me;
    if (body?.save && typeof body.save === "object") {
      const save = body.save as { email?: unknown; remind?: unknown };
      const email = clip(save.email, 254).toLowerCase();
      const remind = save.remind === true;
      if (email && !EMAIL.test(email)) return fail(A.errors.badEmail);
      if (remind && !email) return fail(A.errors.needEmail);
      // An email is kept only while reminders are on. Switching them off deletes it.
      const keep = remind ? email : null;
      await s.updateMember(me.id, { email: keep, remind });
      saved = { ...me, email: keep, remind };
    }

    const at = now(req);
    const l = await load(s, group, at);
    return ok({ me: memberView(l, saved), group: toPublic(l, at) });
  });
}
