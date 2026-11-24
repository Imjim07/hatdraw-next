// SERVER ONLY. The HTML of the ajo payout reminder: the same sentences as the plain-text
// body (copy.ajo.reminderEmail), the schedule as the one button, then why they get it,
// how to stop, and the support line. Group and member names are escaped.
import { ajo } from "@/lib/copy/ajo";
import { button, emailHtml, esc, link, p } from "@/lib/email-html";

type Reminder = { site: string; group: string; date: string; name: string; amount: number; schedule: string; stop: string };

export function reminderHtml(r: Reminder): string {
  const R = ajo.reminderEmail;
  const headline = R.headline(r.name, r.amount, r.date);
  return emailHtml({
    site: r.site,
    preheader: headline,
    heading: esc(headline),
    body: p(esc(R.main(r))) + button(r.schedule, R.seeSchedule),
    footer: [esc(R.why(r.group)), link(r.stop, R.stop), esc(R.questions)],
  });
}
