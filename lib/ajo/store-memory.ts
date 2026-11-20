// SERVER ONLY. In-memory AjoStore for local development and automated tests
// (AJO_STORE=memory). Data lives in this server process and vanishes on restart.
import { randomUUID } from "node:crypto";
import type { AjoStore, NewDraw, NewGroup, NewMember } from "./store";
import type { DrawRow, GroupRow, MemberRow, ResearchRow, SwapRow } from "./types";

type Db = { groups: GroupRow[]; members: MemberRow[]; draws: DrawRow[]; swaps: SwapRow[]; reminders: Set<string>; research: ResearchRow[] };
const g = globalThis as unknown as { __ajoMemoryDb?: Db };

export function memoryStore(): AjoStore {
  const db = (g.__ajoMemoryDb ??= { groups: [], members: [], draws: [], swaps: [], reminders: new Set(), research: [] });
  db.research ??= [];
  const now = () => new Date().toISOString();
  const copy = <T>(x: T): T => structuredClone(x);

  return {
    async createGroup(group: NewGroup, members: NewMember[]) {
      const row: GroupRow = { ...group, id: randomUUID(), status: "setup", live_reveal_at: null, created_at: now() };
      db.groups.push(row);
      for (const m of members) db.members.push({ ...m, id: randomUUID(), group_id: row.id, email: null, remind: false, created_at: now() });
      return copy(row);
    },
    async getGroup(publicId) { const r = db.groups.find((x) => x.public_id === publicId); return r ? copy(r) : null; },
    async updateGroup(id, patch) { const r = db.groups.find((x) => x.id === id); if (r) Object.assign(r, patch); },
    async drawnGroups() { return copy(db.groups.filter((x) => x.status === "drawn" || x.status === "scheduled_live")); },
    async groupsForCleanup() {
      return db.groups.map((x) => ({ id: x.id, start_date: x.start_date, frequency: x.frequency, members: db.members.filter((m) => m.group_id === x.id).length }));
    },
    async deleteGroup(id) {
      // the same cascade as the database
      const gone = new Set(db.members.filter((m) => m.group_id === id).map((m) => m.id));
      db.groups = db.groups.filter((x) => x.id !== id);
      db.members = db.members.filter((m) => m.group_id !== id);
      db.draws = db.draws.filter((d) => d.group_id !== id);
      db.swaps = db.swaps.filter((s) => s.group_id !== id && !gone.has(s.from_member) && !gone.has(s.to_member));
      for (const k of [...db.reminders]) if (k.startsWith(id + ":")) db.reminders.delete(k);
    },
    async recordResearch(row) { db.research.push({ ...row }); },

    async members(groupId) { return copy(db.members.filter((m) => m.group_id === groupId)); },
    async memberByTokenHash(hash) { const r = db.members.find((m) => m.token_hash === hash); return r ? copy(r) : null; },
    async memberById(id) { const r = db.members.find((m) => m.id === id); return r ? copy(r) : null; },
    async updateMember(id, patch) { const r = db.members.find((m) => m.id === id); if (r) Object.assign(r, patch); },

    async currentDraw(groupId) { const r = db.draws.find((d) => d.group_id === groupId && d.is_current); return r ? copy(r) : null; },
    async replaceDraw(groupId, draw: NewDraw) {
      for (const d of db.draws) if (d.group_id === groupId) d.is_current = false;
      const row: DrawRow = { ...draw, id: randomUUID(), is_current: true };
      db.draws.push(row);
      return copy(row);
    },
    async drawHistory(groupId) { return copy(db.draws.filter((d) => d.group_id === groupId)); },

    async swaps(groupId) { return copy(db.swaps.filter((s) => s.group_id === groupId)); },
    async insertSwap(s) {
      const row: SwapRow = { ...s, id: randomUUID(), status: "pending", resolved_at: null };
      db.swaps.push(row);
      return copy(row);
    },
    async resolveSwap(id, status, at) {
      const r = db.swaps.find((s) => s.id === id);
      if (!r || r.status !== "pending") return false;
      r.status = status; r.resolved_at = at;
      return true;
    },

    async claimReminder(groupId, turn) {
      const k = `${groupId}:${turn}`;
      if (db.reminders.has(k)) return false;
      db.reminders.add(k);
      return true;
    },
    async releaseReminder(groupId, turn) { db.reminders.delete(`${groupId}:${turn}`); },
  };
}
