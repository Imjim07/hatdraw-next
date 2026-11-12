import { timingSafeEqual } from "node:crypto";
import { REMIND_DAYS_BEFORE, daysBetween, lagosToday } from "@/lib/ajo/logic";
import { dailyLimit, sendBatch, signMember, type Email } from "@/lib/ajo/mail";
import { fail, load, now, ok, siteUrl, withStore } from "@/lib/ajo/server";
import { naira } from "@/lib/config";

// Daily cron: emails opted-in members about turns whose payout date is 3 days
// away (or closer, if an earlier run ran out of daily sends). Each (group, turn)
// is recorded in ajo_reminders_sent, so reruns never send twice.
// Requires: Authorization: Bearer $CRON_SECRET
function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(`Bearer ${secret}`), b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

const longDate = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });

export async function GET(req: Request) {
  if (!authorised(req)) return fail("Unauthorised.", 401);
  return withStore(async (s) => {
    const at = now(req);
    const today = lagosToday(at);
    const site = siteUrl(req);
    let budget = dailyLimit();
    let sent = 0, turns = 0, deferred = 0;

    for (const group of await s.drawnGroups()) {
      const l = await load(s, group, at);
      if (!l.order) continue;
      const recipients = l.members.filter((m) => m.remind && m.email);
      if (!recipients.length) continue;
      const names = new Map(l.members.map((m) => [m.id, m.name]));
      const total = naira(group.amount_naira * l.members.length);

      for (let i = 0; i < l.order.length; i++) {
        const days = daysBetween(today, l.dates[i]);
        if (days < 1 || days > REMIND_DAYS_BEFORE) continue;
        if (recipients.length > budget) { deferred++; continue; } // keep each turn's emails together
        if (!(await s.claimReminder(group.id, i + 1, at.toISOString()))) continue; // already sent
        const who = names.get(l.order[i]);
        const emails: Email[] = recipients.map((m) => {
          const unsubscribeUrl = `${site}/api/ajo/unsubscribe?m=${m.id}&s=${signMember(m.id)}`;
          return {
            to: m.email!,
            subject: `${group.name} ajo: turn ${i + 1} is on ${longDate(l.dates[i])}`,
            unsubscribeUrl,
            text: [
              `Contributions for the ${group.name} ajo are due by ${longDate(l.dates[i])}.`,
              `This turn, ${who} collects ${total}.`,
              `HatDraw doesn't handle money; pay the way your group agreed.`,
              ``,
              `Schedule: ${site}/ajo/${group.public_id}`,
              ``,
              `Stop these reminders: ${site}/ajo/unsubscribe#${m.id}.${signMember(m.id)}`,
            ].join("\n"),
          };
        });
        const n = await sendBatch(emails);
        if (n < emails.length) { await s.releaseReminder(group.id, i + 1); deferred++; continue; } // retry next run
        sent += n; budget -= n; turns++;
      }
    }
    // Counts only: never log addresses or tokens.
    console.log(`[ajo] reminders: ${sent} emails for ${turns} turns; ${budget} sends left today; ${deferred} turns deferred`);
    return ok({ sent, turns, remaining: budget, deferred });
  });
}
