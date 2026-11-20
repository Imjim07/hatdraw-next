// SERVER ONLY. Storage for ajo groups.
// Production: Supabase (service-role key, server route handlers only).
// Local development and automated tests: an in-memory store, used ONLY when
// AJO_STORE=memory is set explicitly. Without either, ajo routes refuse to run.
import type { DrawRow, GroupRow, MemberRow, ResearchRow, SwapRow } from "./types";

export type NewGroup = Omit<GroupRow, "id" | "created_at" | "status" | "live_reveal_at">;
export type NewMember = Pick<MemberRow, "name" | "token_hash" | "pinned_turn">;
export type NewDraw = Omit<DrawRow, "id" | "is_current">;

export interface AjoStore {
  createGroup(group: NewGroup, members: NewMember[]): Promise<GroupRow>;
  getGroup(publicId: string): Promise<GroupRow | null>;
  updateGroup(id: string, patch: Partial<Pick<GroupRow, "status" | "live_reveal_at">>): Promise<void>;
  /** Groups with a draw (for the reminder cron). */
  drawnGroups(): Promise<GroupRow[]>;
  /** Every group with its member count (for the cleanup cron). */
  groupsForCleanup(): Promise<{ id: string; start_date: string; frequency: GroupRow["frequency"]; members: number }[]>;
  /** Deletes a group; its members, draws, swaps and reminder records go with it (cascade). */
  deleteGroup(id: string): Promise<void>;
  /** Opt-in research numbers, in their own table with no link to the group. */
  recordResearch(row: ResearchRow): Promise<void>;

  members(groupId: string): Promise<MemberRow[]>;
  memberByTokenHash(hash: string): Promise<MemberRow | null>;
  memberById(id: string): Promise<MemberRow | null>;
  updateMember(id: string, patch: Partial<Pick<MemberRow, "email" | "remind">>): Promise<void>;

  currentDraw(groupId: string): Promise<DrawRow | null>;
  /** Makes `draw` the current draw; any previous current draw is kept as history. */
  replaceDraw(groupId: string, draw: NewDraw): Promise<DrawRow>;
  drawHistory(groupId: string): Promise<DrawRow[]>;

  swaps(groupId: string): Promise<SwapRow[]>;
  insertSwap(swap: Pick<SwapRow, "group_id" | "from_member" | "to_member" | "requested_at">): Promise<SwapRow>;
  /** Moves a swap out of "pending". Returns false if it wasn't pending any more. */
  resolveSwap(id: string, status: "confirmed" | "declined" | "expired", at: string): Promise<boolean>;

  /** Records a reminder for (group, turn). Returns false if one was already recorded. */
  claimReminder(groupId: string, turn: number, at: string): Promise<boolean>;
  /** Undo a claim when the email couldn't be sent, so the next run retries. */
  releaseReminder(groupId: string, turn: number): Promise<void>;
}

let store: AjoStore | null = null;

export async function getStore(): Promise<AjoStore> {
  if (store) return store;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { SupabaseStore } = await import("./store-supabase");
    store = new SupabaseStore(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  } else if (process.env.AJO_STORE === "memory") {
    const { memoryStore } = await import("./store-memory");
    store = memoryStore();
  } else {
    throw new StoreMissing();
  }
  return store;
}

export class StoreMissing extends Error {
  constructor() {
    super("Ajo storage isn't configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or AJO_STORE=memory for local testing).");
  }
}

/** True only for the explicit in-memory test/dev store. Test-only hooks check this. */
export const isMemoryStore = () => !(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) && process.env.AJO_STORE === "memory";
