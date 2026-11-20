import { beforeEach, describe, expect, it } from "vitest";
import { memoryStore } from "./store-memory";
import { cleanupGroups, isExpired, lastTurnDate } from "./cleanup";
import { cronAuthorised } from "@/lib/cron";

// A fake clock: "now" is passed in, so the test never depends on today's date.
const day = (iso: string) => new Date(iso + "T12:00:00+01:00"); // midday in Lagos

describe("ajo cleanup", () => {
  beforeEach(() => { delete (globalThis as { __ajoMemoryDb?: unknown }).__ajoMemoryDb; });

  it("finds the last turn's date", () => {
    expect(lastTurnDate("2026-01-05", "weekly", 3)).toBe("2026-01-19");
    expect(lastTurnDate("2026-01-31", "monthly", 2)).toBe("2026-02-28");
  });

  it("deletes a group 91 days after its last turn and keeps one at 89 days", async () => {
    const s = memoryStore();
    const members = [{ name: "Tolu", token_hash: "t", pinned_turn: null }, { name: "Ada", token_hash: "a", pinned_turn: null }];
    // Last turns: 1 Jan 2026 + 7 days = 8 Jan, and 10 Jan.
    const old = await s.createGroup({ public_id: "old", name: "Old", amount_naira: 5000, frequency: "weekly", start_date: "2026-01-01", admin_token_hash: "h1" }, members);
    const recent = await s.createGroup({ public_id: "new", name: "New", amount_naira: 5000, frequency: "weekly", start_date: "2026-01-03", admin_token_hash: "h2" },
      members.map((m) => ({ ...m, token_hash: m.token_hash + "2" })));
    const oldMember = (await s.members(old.id))[0];
    await s.updateMember(oldMember.id, { email: "tolu@example.com", remind: true });
    await s.claimReminder(old.id, 1, "t");

    // 9 Apr 2026 is 91 days after 8 Jan and 89 days after 10 Jan.
    const deleted = await cleanupGroups(s, day("2026-04-09"));

    expect(deleted).toBe(1);
    expect(await s.getGroup("old")).toBeNull();
    expect(await s.memberById(oldMember.id)).toBeNull(); // the email went with the member
    expect(await s.claimReminder(old.id, 1, "t")).toBe(true); // its reminder records went too
    expect(await s.getGroup("new")).not.toBeNull();
    expect(await s.members(recent.id)).toHaveLength(2);
  });

  it("deletes on day 90, not day 89", () => {
    expect(isExpired("2026-01-10", day("2026-04-09"))).toBe(false); // 89 days
    expect(isExpired("2026-01-10", day("2026-04-10"))).toBe(true); // 90 days
  });
});

describe("cron auth", () => {
  const req = (h?: string) => new Request("https://x.test/api/cron/cleanup", { headers: h ? { authorization: h } : {} });
  it("refuses everything without CRON_SECRET", () => {
    expect(cronAuthorised(req("Bearer "), "")).toBe(false);
    expect(cronAuthorised(req(), undefined)).toBe(false);
  });
  it("accepts only the exact bearer secret", () => {
    expect(cronAuthorised(req("Bearer s3cret"), "s3cret")).toBe(true);
    expect(cronAuthorised(req("Bearer nope"), "s3cret")).toBe(false);
  });
});
