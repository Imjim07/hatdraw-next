// SERVER ONLY. The HTML around every email: one column, max 600px, tables and inline styles
// (what Gmail, Outlook, Apple Mail and Yahoo all render), the brand's cloud page with an
// indigo heading and button, and the landing page's logo at the bottom.
// Every email still has its plain-text twin; this is only the HTML part.
// The logo is a PNG (public/email/logo.png: the header wordmark, Ojuju 800, at 3x on cloud):
// mail apps don't show SVG or the Ojuju web font. It's an ordinary image, not a tracker.
// Everything a person typed (group and member names) goes through esc().
import { BRAND } from "./config";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const INDIGO = "#1B2A5C", CLOUD = "#F4F1EA", INK = "#141A33", MUTED = "#5A6080", CARD = "#FFFFFF", LINE = "#E4DFD3";
const FONT = "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const HEAD = "'Hanken Grotesk',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** A paragraph of body text (already escaped). */
export const p = (html: string, size = 16) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:${size}px;line-height:1.6;color:${INK}">${html}</p>`;

/** The one main action: a full-width-on-phones indigo button. */
export const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${INDIGO}">` +
  `<a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:700;line-height:20px;color:${CLOUD};text-decoration:none;border-radius:999px">${esc(label)} &rarr;</a>` +
  `</td></tr></table>`;

/** A plain link in the footer. */
export const link = (href: string, label: string) =>
  `<a href="${esc(href)}" style="color:${INDIGO};text-decoration:underline">${esc(label)}</a>`;

type Layout = {
  site: string;       // https://kadaradraw.com (no trailing slash): where the logo is served
  preheader: string;  // the line inboxes show after the subject
  heading: string;    // escaped
  body: string;       // escaped HTML blocks (p(), button())
  footer: string[];   // escaped HTML lines, small and muted
};

export function emailHtml({ site, preheader, heading, body, footer }: Layout): string {
  const logo = `${site}/email/logo.png`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(BRAND.display)}</title></head>
<body style="margin:0;padding:0;background:${CLOUD}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CLOUD}"><tr><td align="center" style="padding:24px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td style="background:${CARD};border:1px solid ${LINE};border-radius:20px;padding:32px 24px">
<h1 style="margin:0 0 16px;font-family:${HEAD};font-size:24px;line-height:1.3;font-weight:700;color:${INDIGO}">${heading}</h1>
${body}
</td></tr>
<tr><td style="padding:24px 8px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${MUTED}">
${footer.map((l) => `<p style="margin:0 0 8px">${l}</p>`).join("\n")}
</td></tr>
<tr><td align="center" style="padding:24px 0 8px">
<a href="${esc(site)}" style="text-decoration:none"><img src="${esc(logo)}" width="152" height="56" alt="${esc(BRAND.display)}" style="display:block;border:0;width:152px;height:56px"></a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
