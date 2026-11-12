import { beforeEach, describe, expect, it } from "vitest";
import { memoryStore } from "./store-memory";

describe("memory store", () => {
  beforeEach(() => { delete (globalThis as { __ajoMemoryDb?: unknown }).__ajoMemoryDb; });

  it("keeps one current draw per group and the rest as history", async () => {
    const s = memoryStore();
    const g = await s.createGroup({ public_id: "p", name: "G", amount_naira: 1000, frequency: "weekly", start_date: "2026-01-01", admin_token_hash: "h", research_consent: false },
      [{ name: "A", token_hash: "a", pinned_turn: null }, { name: "B", token_hash: "b", pinned_turn: null }]);
    const ids = (await s.members(g.id)).map((m) => m.id);
    await s.replaceDraw(g.id, { group_id: g.id, mode: "instant", member_order: ids, drawn_at: "t1", redraw_count: 0, locked: true });
    await s.replaceDraw(g.id, { group_id: g.id, mode: "instant", member_order: ids.reverse(), drawn_at: "t2", redraw_count: 1, locked: true });
    expect((await s.currentDraw(g.id))?.redraw_count).toBe(1);
    expect(await s.drawHistory(g.id)).toHaveLength(2);
  });

  it("records each reminder once", async () => {
    const s = memoryStore();
    expect(await s.claimReminder("g", 1, "now")).toBe(true);
    expect(await s.claimReminder("g", 1, "now")).toBe(false);
    await s.releaseReminder("g", 1);
    expect(await s.claimReminder("g", 1, "now")).toBe(true);
  });

  it("resolves a swap only while it is pending", async () => {
    const s = memoryStore();
    const sw = await s.insertSwap({ group_id: "g", from_member: "a", to_member: "b", requested_at: "t" });
    expect(await s.resolveSwap(sw.id, "confirmed", "t2")).toBe(true);
    expect(await s.resolveSwap(sw.id, "declined", "t3")).toBe(false);
  });
});
