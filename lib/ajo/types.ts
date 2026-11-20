// Ajo payout-order draw: shared types (no Node or DOM APIs).
// The site never holds or moves money; these describe an ORDER and its dates.

export type Frequency = "weekly" | "biweekly" | "monthly";
export type GroupStatus = "setup" | "scheduled_live" | "drawn" | "complete";
export type DrawMode = "instant" | "live";
export type SwapStatus = "pending" | "confirmed" | "declined" | "expired";

// ---- database rows (server only) ----
export type GroupRow = {
  id: string;
  public_id: string;
  name: string;
  amount_naira: number;
  frequency: Frequency;
  start_date: string; // YYYY-MM-DD
  admin_token_hash: string;
  status: GroupStatus;
  live_reveal_at: string | null; // ISO
  created_at: string;
};

/** Opt-in research: four anonymous numbers, stored with no link back to a group. */
export type ResearchRow = { group_size: number; amount_naira: number; frequency: Frequency; created_month: string /* YYYY-MM-01 */ };

export type MemberRow = {
  id: string;
  group_id: string;
  name: string;
  token_hash: string;
  email: string | null;
  remind: boolean;
  pinned_turn: number | null;
  created_at: string;
};

export type DrawRow = {
  id: string;
  group_id: string;
  mode: DrawMode;
  member_order: string[]; // member ids, turn 1 first
  drawn_at: string;
  redraw_count: number;
  locked: boolean;
  is_current: boolean;
};

export type SwapRow = {
  id: string;
  group_id: string;
  from_member: string;
  to_member: string;
  status: SwapStatus;
  requested_at: string;
  resolved_at: string | null;
};

// ---- API shapes (safe to send to browsers: no emails, no hashes) ----
export type PublicTurn = {
  turn: number;
  date: string; // YYYY-MM-DD
  name: string;
  amount: number; // ₦ collected that turn
  pinned: boolean; // agreed before the draw (and still in that turn)
};

export type PublicSwap = { a: string; b: string; at: string }; // confirmed only

export type PublicDrawInfo = { mode: DrawMode; drawnAt: string; redrawCount: number };

export type PublicGroup = {
  publicId: string;
  name: string;
  amount: number; // each member's contribution per turn
  frequency: Frequency;
  startDate: string;
  members: { name: string; pinnedTurn: number | null }[];
  status: GroupStatus;
  serverNow: string; // ISO, so clients can count down to a live reveal
  liveRevealAt: string | null;
  draw: PublicDrawInfo | null; // null before the draw, or while a live draw is still counting down
  turns: PublicTurn[] | null;
  swaps: PublicSwap[];
};

export type CreateGroupRequest = {
  name: string;
  amount: number;
  frequency: Frequency;
  startDate: string;
  members: string[];
  pins: { name: string; turn: number }[];
  researchConsent: boolean;
};

export type CreateGroupResponse =
  | { ok: true; publicId: string; adminToken: string; members: { name: string; token: string }[] }
  | { ok: false; error: string };

export type MemberView = {
  name: string;
  email: string | null; // the member's own email, only ever returned to their own token
  remind: boolean;
  turn: number | null;
  date: string | null;
  amount: number | null;
  others: string[]; // names they could ask to swap with
  pinned: boolean;
  swapsIn: { id: string; from: string; requestedAt: string }[]; // pending, waiting for me
  swapsOut: { id: string; to: string; requestedAt: string }[]; // pending, waiting for them
};
