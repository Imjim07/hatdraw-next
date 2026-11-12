import { memberFromToken, memberView } from "@/lib/ajo/member";
import { PUBLIC_ID, clip, fail, load, now, ok, readJson, toPublic, withStore } from "@/lib/ajo/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A member's own view (their turn, date, amount, swaps), and saving their
// reminder email. { token, publicId, save?: { email, remind } }
export async function POST(req: Request) {
  const body = await readJson(req);
  return withStore(async (s) => {
    const me = await memberFromToken(s, body?.token);
    if (!me) return fail("This personal link doesn't work. Ask your organizer to resend it.", 403);
    const publicId = String(body?.publicId ?? "");
    const group = PUBLIC_ID.test(publicId) ? await s.getGroup(publicId) : null;
    if (!group || group.id !== me.group_id) return fail("This personal link doesn't belong to this ajo group.", 403);

    let saved = me;
    if (body?.save && typeof body.save === "object") {
      const save = body.save as { email?: unknown; remind?: unknown };
      const email = clip(save.email, 254).toLowerCase();
      const remind = save.remind === true;
      if (email && !EMAIL.test(email)) return fail("That email address doesn't look right.");
      if (remind && !email) return fail("Add your email to get reminders.");
      await s.updateMember(me.id, { email: email || null, remind });
      saved = { ...me, email: email || null, remind };
    }

    const at = now(req);
    const l = await load(s, group, at);
    return ok({ me: memberView(l, saved), group: toPublic(l, at) });
  });
}
