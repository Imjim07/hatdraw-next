// SERVER ONLY. AjoStore backed by Supabase, using the service-role key.
// Never import this from a client component: the key bypasses RLS.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AjoStore, NewDraw, NewGroup, NewMember } from "./store";
import type { DrawRow, GroupRow, MemberRow, SwapRow } from "./types";

function must<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data as T;
}

export class SupabaseStore implements AjoStore {
  private db: SupabaseClient;
  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async createGroup(group: NewGroup, members: NewMember[]) {
    const row = must(await this.db.from("ajo_groups").insert(group).select().single()) as GroupRow;
    const ins = await this.db.from("ajo_members").insert(members.map((m) => ({ ...m, group_id: row.id })));
    if (ins.error) {
      await this.db.from("ajo_groups").delete().eq("id", row.id); // no half-created groups
      throw new Error(`Supabase: ${ins.error.message}`);
    }
    return row;
  }
  async getGroup(publicId: string) {
    return must(await this.db.from("ajo_groups").select("*").eq("public_id", publicId).maybeSingle()) as GroupRow | null;
  }
  async updateGroup(id: string, patch: Partial<Pick<GroupRow, "status" | "live_reveal_at">>) {
    must(await this.db.from("ajo_groups").update(patch).eq("id", id));
  }
  async drawnGroups() {
    return must(await this.db.from("ajo_groups").select("*").in("status", ["drawn", "scheduled_live"])) as GroupRow[];
  }

  async members(groupId: string) {
    return must(await this.db.from("ajo_members").select("*").eq("group_id", groupId).order("created_at")) as MemberRow[];
  }
  async memberByTokenHash(hash: string) {
    return must(await this.db.from("ajo_members").select("*").eq("token_hash", hash).maybeSingle()) as MemberRow | null;
  }
  async memberById(id: string) {
    return must(await this.db.from("ajo_members").select("*").eq("id", id).maybeSingle()) as MemberRow | null;
  }
  async updateMember(id: string, patch: Partial<Pick<MemberRow, "email" | "remind">>) {
    must(await this.db.from("ajo_members").update(patch).eq("id", id));
  }

  async currentDraw(groupId: string) {
    return must(await this.db.from("ajo_draws").select("*").eq("group_id", groupId).eq("is_current", true).maybeSingle()) as DrawRow | null;
  }
  async replaceDraw(groupId: string, draw: NewDraw) {
    // The partial unique index allows only one current draw per group, so a
    // concurrent second redraw fails here instead of creating two.
    must(await this.db.from("ajo_draws").update({ is_current: false }).eq("group_id", groupId).eq("is_current", true));
    return must(await this.db.from("ajo_draws").insert({ ...draw, is_current: true }).select().single()) as DrawRow;
  }
  async drawHistory(groupId: string) {
    return must(await this.db.from("ajo_draws").select("*").eq("group_id", groupId).order("drawn_at")) as DrawRow[];
  }

  async swaps(groupId: string) {
    return must(await this.db.from("ajo_swaps").select("*").eq("group_id", groupId).order("requested_at")) as SwapRow[];
  }
  async insertSwap(s: Pick<SwapRow, "group_id" | "from_member" | "to_member" | "requested_at">) {
    return must(await this.db.from("ajo_swaps").insert(s).select().single()) as SwapRow;
  }
  async resolveSwap(id: string, status: "confirmed" | "declined" | "expired", at: string) {
    const rows = must(await this.db.from("ajo_swaps").update({ status, resolved_at: at }).eq("id", id).eq("status", "pending").select("id")) as { id: string }[];
    return rows.length > 0;
  }

  async claimReminder(groupId: string, turn: number, at: string) {
    const res = await this.db.from("ajo_reminders_sent").insert({ group_id: groupId, turn, sent_at: at });
    if (res.error?.code === "23505") return false; // unique (group_id, turn): already sent
    must(res);
    return true;
  }
  async releaseReminder(groupId: string, turn: number) {
    must(await this.db.from("ajo_reminders_sent").delete().eq("group_id", groupId).eq("turn", turn));
  }
}
