import { PUBLIC_ID, load, now, siteUrl, withStore } from "@/lib/ajo/server";
import { naira } from "@/lib/config";

// iCalendar file: one all-day event per turn.
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const day = (d: string) => d.replace(/-/g, "");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// RFC 5545: lines over 75 octets are folded with CRLF + space.
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 74) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  return [...out, cur].join("\r\n");
}

export async function GET(req: Request, ctx: RouteContext<"/api/ajo/groups/[publicId]/calendar.ics">) {
  const { publicId } = await ctx.params;
  const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!PUBLIC_ID.test(publicId)) return notFound();
  return withStore(async (s) => {
    const group = await s.getGroup(publicId);
    if (!group) return notFound();
    const at = now(req);
    const l = await load(s, group, at);
    if (!l.order) return new Response("The payout order hasn't been drawn yet.", { status: 409, headers: { "Cache-Control": "no-store" } });

    const names = new Map(l.members.map((m) => [m.id, m.name]));
    const total = group.amount_naira * l.members.length;
    const url = `${siteUrl(req)}/ajo/${publicId}`;
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HatDraw//Ajo//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      `X-WR-CALNAME:${esc(`${group.name} ajo`)}`,
      ...l.order.flatMap((id, i) => {
        const date = l.dates[i];
        return [
          "BEGIN:VEVENT",
          `UID:${publicId}-turn-${i + 1}@hatdraw`,
          `DTSTAMP:${stamp(at)}`,
          `DTSTART;VALUE=DATE:${day(date)}`,
          `SUMMARY:${esc(`Ajo turn ${i + 1}: ${names.get(id)} collects ${naira(total)}`)}`,
          `DESCRIPTION:${esc(`${group.name} ajo. HatDraw doesn't handle money; pay the way your group agreed. Schedule: ${url}`)}`,
          `URL:${url}`,
          "END:VEVENT",
        ];
      }),
      "END:VCALENDAR",
    ];
    const safeName = group.name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "ajo";
    return new Response(lines.map(fold).join("\r\n") + "\r\n", {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}-ajo.ics"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
