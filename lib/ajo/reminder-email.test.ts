import { describe, expect, it } from "vitest";
import { reminderHtml } from "./reminder-email";
import { passHtml } from "@/lib/pass-email";
import { ajo } from "@/lib/copy/ajo";

const r = {
  site: "https://kadaradraw.com", group: `Mama's <b>Group</b>`, date: "2026-12-04", name: `Ade "<script>"`, amount: 160000,
  schedule: "https://kadaradraw.com/ajo/abc", stop: "https://kadaradraw.com/ajo/unsubscribe#m.s",
};

describe("reminder email", () => {
  it("escapes everything a person typed", () => {
    const html = reminderHtml(r);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>Group</b>");
    expect(html).toContain("&lt;b&gt;Group&lt;/b&gt;");
    expect(html).toContain("Ade &quot;&lt;script&gt;&quot;");
  });

  it("has the schedule button, the stop link, the support line and the landing logo", () => {
    const html = reminderHtml(r);
    expect(html).toContain(`href="${r.schedule}"`);
    expect(html).toContain(`href="${r.stop}"`);
    expect(html).toContain("Stop reminders");
    expect(html).toContain("support@");
    expect(html).toContain(`src="https://kadaradraw.com/email/logo.png"`);
    expect(html).toContain(`alt="Kádàrá"`);
    expect(html).toContain("₦160,000");
  });

  it("keeps the plain-text body word for word", () => {
    expect(ajo.reminderEmail.body(r).split("\n")).toEqual([
      `Contributions for ${r.group} are due by 4 Dec. This turn, ${r.name} collects ₦160,000. Kádàrá doesn't handle money, so pay the way your group agreed.`,
      "", `See schedule: ${r.schedule}`, `Stop reminders: ${r.stop}`, "", expect.stringMatching(/^Questions\? Reply or email support: \S+@/),
    ]);
  });

  it("is light enough that Gmail won't clip it (under 102 KB)", () => {
    expect(Buffer.byteLength(reminderHtml(r))).toBeLessThan(20_000);
  });
});

describe("Year pass email", () => {
  it("shows the code, the start button and the logo", () => {
    const html = passHtml({ site: "https://kadaradraw.com", code: "KD-ABCD-EFGH", date: "24 Nov 2027" });
    expect(html).toContain("KD-ABCD-EFGH");
    expect(html).toContain(`href="https://kadaradraw.com/draw"`);
    expect(html).toContain("/email/logo.png");
  });
});
