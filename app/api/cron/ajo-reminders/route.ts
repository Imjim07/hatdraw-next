import { REMIND_DAYS_BEFORE, daysBetween, lagosToday } from "@/lib/ajo/logic";
import { dailyLimit, sendBatch, signMember, type Email } from "@/lib/ajo/mail";
import { fail, load, now, ok, siteUrl, withStore } from "@/lib/ajo/server";
import { cronAuthorised } from "@/lib/cron";
import { ajo } from "@/lib/copy/ajo";
import { reminderHtml } from "@/lib/ajo/reminder-email";

// Daily cron: emails opted-in members about turns whose payout date is 3 days
// away (or closer, if an earlier run ran out of daily sends). Each (group, turn)
// is recorded in ajo_reminders_sent, so reruns never send twice.
// Requires: Authorization: Bearer $CRON_SECRET

export async function GET(req: Request) {
  if (!cronAuthorised(req)) return fail("Unauthorised.", 401);
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
      const total = group.amount_naira * l.members.length;

      for (let i = 0; i < l.order.length; i++) {
        const days = daysBetween(today, l.dates[i]);
        if (days < 1 || days > REMIND_DAYS_BEFORE) continue;
        if (recipients.length > budget) { deferred++; continue; } // keep each turn's emails together
        if (!(await s.claimReminder(group.id, i + 1, at.toISOString()))) continue; // already sent
        const who = names.get(l.order[i]);
        const emails: Email[] = recipients.map((m) => {
          const unsubscribeUrl = `${site}/api/ajo/unsubscribe?m=${m.id}&s=${signMember(m.id)}`;
          const content = {
            group: group.name, date: l.dates[i], name: who ?? "", amount: total,
            schedule: `${site}/ajo/${group.public_id}`,
            stop: `${site}/ajo/unsubscribe#${m.id}.${signMember(m.id)}`,
          };
          return {
            to: m.email!,
            subject: ajo.reminderEmail.subject(group.name, who ?? "", l.dates[i]),
            unsubscribeUrl,
            text: ajo.reminderEmail.body(content),
            html: reminderHtml({ site, ...content }),
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
