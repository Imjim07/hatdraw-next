// SERVER ONLY. The HTML of the Year pass email: the code large and easy to copy, what it
// covers, "Start a draw" as the one button, and the lost-code line. Same sentences as the
// plain-text body (copy.santa.pass).
import { santa } from "@/lib/copy/santa";
import { button, emailHtml, esc, p } from "@/lib/email-html";

export function passHtml({ site, code, date }: { site: string; code: string; date: string }): string {
  const P = santa.pass;
  const codeBox = `<p style="margin:0 0 16px;padding:16px;border-radius:12px;background:#F4F1EA;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:24px;font-weight:700;letter-spacing:2px;text-align:center;color:#141A33">${esc(code)}</p>`;
  return emailHtml({
    site,
    preheader: P.emailCovers(date),
    heading: esc(P.emailCodeLabel.replace(/:$/, "")),
    body: codeBox + p(esc(P.emailCovers(date))) + button(`${site}/draw`, P.emailStart),
    footer: [esc(P.emailLost)],
  });
}
