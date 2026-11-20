import { beforeEach, describe, expect, it, vi } from "vitest";

// "Stop reminders" deletes the member's email, not just a flag.
describe("stop reminders", () => {
  beforeEach(() => {
    vi.stubEnv("AJO_STORE", "memory"); vi.stubEnv("SUPABASE_URL", ""); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("CRON_SECRET", "test-secret");
    delete (globalThis as { __ajoMemoryDb?: unknown }).__ajoMemoryDb;
  });

  it("sets the email to null", async () => {
    const { getStore } = await import("./store");
    const { signMember } = await import("./mail");
    const { POST } = await import("@/app/api/ajo/unsubscribe/route");
    const s = await getStore();
    const g = await s.createGroup({ public_id: "pubpubpubpubpub1", name: "G", amount_naira: 1000, frequency: "weekly", start_date: "2026-12-01", admin_token_hash: "h" },
      [{ name: "Tolu", token_hash: "t", pinned_turn: null }, { name: "Ada", token_hash: "a", pinned_turn: null }]);
    const tolu = (await s.members(g.id))[0];
    await s.updateMember(tolu.id, { email: "tolu@example.com", remind: true });

    const res = await POST(new Request("https://x.test/api/ajo/unsubscribe", { method: "POST", body: JSON.stringify({ m: tolu.id, s: signMember(tolu.id) }) }));
    expect(res.status).toBe(200);
    const after = await s.memberById(tolu.id);
    expect(after?.email).toBeNull();
    expect(after?.remind).toBe(false);
  });

  it("refuses a bad signature and changes nothing", async () => {
    const { getStore } = await import("./store");
    const { POST } = await import("@/app/api/ajo/unsubscribe/route");
    const s = await getStore();
    const g = await s.createGroup({ public_id: "pubpubpubpubpub2", name: "G", amount_naira: 1000, frequency: "weekly", start_date: "2026-12-01", admin_token_hash: "h" },
      [{ name: "Tolu", token_hash: "t2", pinned_turn: null }, { name: "Ada", token_hash: "a2", pinned_turn: null }]);
    const tolu = (await s.members(g.id))[0];
    await s.updateMember(tolu.id, { email: "tolu@example.com", remind: true });
    const res = await POST(new Request("https://x.test/api/ajo/unsubscribe", { method: "POST", body: JSON.stringify({ m: tolu.id, s: "nope" }) }));
    expect(res.status).toBe(400);
    expect((await s.memberById(tolu.id))?.email).toBe("tolu@example.com");
  });
});
