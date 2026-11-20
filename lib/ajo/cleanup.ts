// SERVER ONLY. Ajo groups are deleted 90 days after their last turn's payout date:
// the group, its members (names and any emails), draws, swaps and reminder records.
import { daysBetween, lagosToday, payoutDates } from "./logic";
import type { AjoStore } from "./store";
import type { Frequency } from "./types";

export const KEEP_DAYS = 90;

/** The payout date of a group's last turn (YYYY-MM-DD). */
export const lastTurnDate = (start: string, frequency: Frequency, members: number) =>
  payoutDates(start, frequency, Math.max(1, members)).at(-1)!;

/** True once at least KEEP_DAYS have passed since the last turn, by Nigeria's date. */
export const isExpired = (lastTurn: string, at: Date) => daysBetween(lastTurn, lagosToday(at)) >= KEEP_DAYS;

/** Deletes every expired group. Returns how many went. */
export async function cleanupGroups(s: AjoStore, at: Date): Promise<number> {
  let deleted = 0;
  for (const g of await s.groupsForCleanup()) {
    if (!isExpired(lastTurnDate(g.start_date, g.frequency, g.members), at)) continue;
    await s.deleteGroup(g.id);
    deleted++;
  }
  return deleted;
}
